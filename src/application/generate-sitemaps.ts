import { stat } from "node:fs/promises";
import { Writable } from "node:stream";
import type { GenerationObserver } from "../domain/generation-observer";
import { NoopGenerationObserver } from "../domain/generation-observer";
import type {
  GenerateResult,
  GeneratedSitemapFile,
  ProjectConfig,
  SitemapConfig,
} from "../domain/types";
import { serializeError } from "../infrastructure/observability/error-serializer";
import { createOutputWriter } from "../infrastructure/output/output-factory";
import { createProvider } from "../infrastructure/providers/provider-factory";
import {
  createSitemapFooter,
  createSitemapHeader,
  serializeSitemapUrl,
} from "../infrastructure/xml/sitemap-writer";
import { serializeSitemapIndex } from "../infrastructure/xml/sitemap-index-writer";
import { endStream, writeToStream } from "../utils/async";
import { normalizeRelativeFilePath } from "../utils/path";
import { mapRowToSitemapUrl } from "./url-mapper";

const DEFAULT_URLS_PER_SITEMAP = 40_000;
const DEFAULT_SITEMAP_INDEX_FILENAME = "sitemap.xml";

export type GenerateOptions = {
  sitemapName?: string;
  dryRun?: boolean;
  observer?: GenerationObserver;
};

export async function generateSitemaps(
  config: ProjectConfig,
  options: GenerateOptions = {},
): Promise<GenerateResult> {
  const startedAt = Date.now();
  const observer = options.observer ?? new NoopGenerationObserver();
  const dryRun = options.dryRun ?? false;
  const output = createOutputWriter(config.output);
  const selectedSitemaps = options.sitemapName
    ? config.sitemaps.filter((sitemap) => sitemap.name === options.sitemapName)
    : config.sitemaps;

  if (options.sitemapName && selectedSitemaps.length === 0) {
    throw new Error(
      `Sitemap '${options.sitemapName}' was not found in project '${config.project}'.`,
    );
  }

  const sitemapIndexFilename = normalizeRelativeFilePath(
    config.sitemapIndex?.filename ?? DEFAULT_SITEMAP_INDEX_FILENAME,
  );

  try {
    await observer.onEvent({
      type: "generation_started",
      level: "info",
      command: "generate",
      dryRun,
      siteUrl: config.siteUrl,
      outputDirectory: config.output.directory,
      sitemapIndexFilename,
      selectedSitemaps: selectedSitemaps.map((sitemap) => sitemap.name),
    });

    if (!dryRun) {
      await output.prepare(config.output.clean);
    }

    const generatedFiles: GeneratedSitemapFile[] = [];

    for (const sitemapConfig of selectedSitemaps) {
      const files = await generateSingleSitemap(
        config,
        sitemapConfig,
        output,
        dryRun,
        observer,
      );
      generatedFiles.push(...files);
    }

    let sitemapIndexFileSizeBytes = 0;

    if (!dryRun && !options.sitemapName) {
      await output.writeText(
        sitemapIndexFilename,
        serializeSitemapIndex(config.siteUrl, generatedFiles),
      );
      sitemapIndexFileSizeBytes = await getFileSize(
        output.resolvePath(sitemapIndexFilename),
      );
    }

    if (!options.sitemapName) {
      await observer.onEvent({
        type: "sitemap_index_created",
        level: "info",
        file: sitemapIndexFilename,
        sitemapFileCount: generatedFiles.length,
        fileSizeBytes: sitemapIndexFileSizeBytes,
        dryRun,
      });
    }

    const result = {
      project: config.project,
      outputDirectory: config.output.directory,
      sitemapIndexFilename,
      generatedFiles,
      totalUrls: generatedFiles.reduce(
        (total, file) => total + file.urlCount,
        0,
      ),
      totalBytesWritten: generatedFiles.reduce(
        (total, file) => total + (file.fileSizeBytes ?? 0),
        sitemapIndexFileSizeBytes,
      ),
    };

    await observer.onEvent({
      type: "generation_completed",
      level: "info",
      totalUrls: result.totalUrls,
      totalFiles: generatedFiles.length + (options.sitemapName ? 0 : 1),
      totalBytesWritten: result.totalBytesWritten,
      durationMs: Date.now() - startedAt,
      dryRun,
    });

    return result;
  } catch (error) {
    await observer.onEvent({
      type: "generation_failed",
      level: "error",
      durationMs: Date.now() - startedAt,
      error: serializeError(error),
    });
    throw error;
  }
}

async function generateSingleSitemap(
  projectConfig: ProjectConfig,
  sitemapConfig: SitemapConfig,
  output: ReturnType<typeof createOutputWriter>,
  dryRun: boolean,
  observer: GenerationObserver,
): Promise<GeneratedSitemapFile[]> {
  const provider = createProvider(sitemapConfig);
  const urlsPerSitemap =
    sitemapConfig.batchSize ??
    projectConfig.limits?.urlsPerSitemap ??
    DEFAULT_URLS_PER_SITEMAP;
  const estimatedUrls = provider.count ? await provider.count() : "unknown";
  const estimatedFiles =
    typeof estimatedUrls === "number"
      ? Math.max(1, Math.ceil(estimatedUrls / urlsPerSitemap))
      : "unknown";
  const startedAt = Date.now();
  const generatedFiles: GeneratedSitemapFile[] = [];
  let currentStream: NodeJS.WritableStream | null = null;
  let currentFile: GeneratedSitemapFile | null = null;
  let currentCount = 0;
  let page = 0;
  let totalUrlsProcessed = 0;
  let totalBytesWritten = 0;

  await observer.onEvent({
    type: "sitemap_started",
    level: "info",
    sitemap: sitemapConfig.name,
    provider: sitemapConfig.type,
    batchSize: urlsPerSitemap,
    estimatedUrls,
    estimatedFiles,
  });

  async function closeCurrentFile(): Promise<void> {
    if (!currentStream || !currentFile) {
      return;
    }

    if (!dryRun) {
      await writeToStream(currentStream, createSitemapFooter());
    }

    await endStream(currentStream);

    const fileSizeBytes = dryRun
      ? 0
      : await getFileSize(output.resolvePath(currentFile.filename));

    currentFile.fileSizeBytes = fileSizeBytes;
    totalBytesWritten += fileSizeBytes;

    await observer.onEvent({
      type: "sitemap_file_created",
      level: "info",
      sitemap: sitemapConfig.name,
      file: currentFile.filename,
      fileIndex: page,
      totalFiles: estimatedFiles,
      urlCount: currentFile.urlCount,
      totalUrlsProcessed,
      fileSizeBytes,
      totalBytesWritten,
      dryRun,
    });

    currentStream = null;
    currentFile = null;
  }

  try {
    for await (const row of provider.rows()) {
      if (!currentStream || currentCount >= urlsPerSitemap) {
        await closeCurrentFile();

        page += 1;
        currentCount = 0;
        const filename = resolveSitemapFilename(sitemapConfig, page);
        const lastmod = new Date().toISOString();

        currentFile = {
          name: sitemapConfig.name,
          filename,
          urlCount: 0,
          lastmod,
        };
        generatedFiles.push(currentFile);

        if (!dryRun) {
          currentStream = await output.createWriteStream(filename);
          await writeToStream(currentStream, createSitemapHeader());
        } else {
          currentStream = createDryRunStream();
        }
      }

      const url = mapRowToSitemapUrl(projectConfig.siteUrl, sitemapConfig, row);

      if (!dryRun && currentStream) {
        await writeToStream(currentStream, serializeSitemapUrl(url));
      }

      currentCount += 1;
      totalUrlsProcessed += 1;
      generatedFiles[generatedFiles.length - 1].urlCount = currentCount;
    }

    await closeCurrentFile();
  } finally {
    await provider.close?.();
  }

  const files = generatedFiles.filter((file) => file.urlCount > 0);

  await observer.onEvent({
    type: "sitemap_completed",
    level: "info",
    sitemap: sitemapConfig.name,
    fileCount: files.length,
    urlCount: totalUrlsProcessed,
    bytesWritten: totalBytesWritten,
    durationMs: Date.now() - startedAt,
  });

  return files;
}

function resolveSitemapFilename(config: SitemapConfig, page: number): string {
  if (config.filenamePattern) {
    return normalizeRelativeFilePath(
      config.filenamePattern.replace(/\{page\}/g, String(page)),
    );
  }

  if (config.filename) {
    return normalizeRelativeFilePath(config.filename);
  }

  return normalizeRelativeFilePath(`sitemaps/${config.name}-${page}.xml`);
}

function createDryRunStream(): NodeJS.WritableStream {
  return new Writable({
    write(_chunk, _encoding, callback) {
      callback();
    },
  });
}

async function getFileSize(path: string): Promise<number> {
  const stats = await stat(path);

  return stats.size;
}
