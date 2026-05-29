import { Writable } from "node:stream";
import type {
  GenerateResult,
  GeneratedSitemapFile,
  ProjectConfig,
  SitemapConfig,
} from "../domain/types";
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
};

export async function generateSitemaps(
  config: ProjectConfig,
  options: GenerateOptions = {},
): Promise<GenerateResult> {
  const output = createOutputWriter(config.output);
  const selectedSitemaps = options.sitemapName
    ? config.sitemaps.filter((sitemap) => sitemap.name === options.sitemapName)
    : config.sitemaps;

  if (options.sitemapName && selectedSitemaps.length === 0) {
    throw new Error(
      `Sitemap '${options.sitemapName}' was not found in project '${config.project}'.`,
    );
  }

  if (!options.dryRun) {
    await output.prepare(config.output.clean);
  }

  const generatedFiles: GeneratedSitemapFile[] = [];

  for (const sitemapConfig of selectedSitemaps) {
    const files = await generateSingleSitemap(
      config,
      sitemapConfig,
      output,
      options.dryRun ?? false,
    );
    generatedFiles.push(...files);
  }

  const sitemapIndexFilename = normalizeRelativeFilePath(
    config.sitemapIndex?.filename ?? DEFAULT_SITEMAP_INDEX_FILENAME,
  );

  if (!options.dryRun && !options.sitemapName) {
    await output.writeText(
      sitemapIndexFilename,
      serializeSitemapIndex(config.siteUrl, generatedFiles),
    );
  }

  return {
    project: config.project,
    outputDirectory: config.output.directory,
    sitemapIndexFilename,
    generatedFiles,
    totalUrls: generatedFiles.reduce((total, file) => total + file.urlCount, 0),
  };
}

async function generateSingleSitemap(
  projectConfig: ProjectConfig,
  sitemapConfig: SitemapConfig,
  output: ReturnType<typeof createOutputWriter>,
  dryRun: boolean,
): Promise<GeneratedSitemapFile[]> {
  const provider = createProvider(sitemapConfig);
  const urlsPerSitemap =
    sitemapConfig.batchSize ??
    projectConfig.limits?.urlsPerSitemap ??
    DEFAULT_URLS_PER_SITEMAP;
  const generatedFiles: GeneratedSitemapFile[] = [];
  let currentStream: NodeJS.WritableStream | null = null;
  let currentCount = 0;
  let page = 0;

  try {
    for await (const row of provider.rows()) {
      if (!currentStream || currentCount >= urlsPerSitemap) {
        if (currentStream) {
          await writeToStream(currentStream, createSitemapFooter());
          await endStream(currentStream);
        }

        page += 1;
        currentCount = 0;
        const filename = resolveSitemapFilename(sitemapConfig, page);
        const lastmod = new Date().toISOString();

        generatedFiles.push({
          name: sitemapConfig.name,
          filename,
          urlCount: 0,
          lastmod,
        });

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
      generatedFiles[generatedFiles.length - 1].urlCount = currentCount;
    }

    if (currentStream) {
      if (!dryRun) {
        await writeToStream(currentStream, createSitemapFooter());
      }

      await endStream(currentStream);
    }
  } finally {
    await provider.close?.();
  }

  return generatedFiles.filter((file) => file.urlCount > 0);
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
