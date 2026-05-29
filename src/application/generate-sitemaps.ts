import { stat } from "node:fs/promises";
import { Writable } from "node:stream";
import type {
  GenerationCheckpoint,
  GenerationCheckpointSession,
  SitemapCheckpoint,
} from "../domain/generation-checkpoint";
import type { GenerationObserver } from "../domain/generation-observer";
import { NoopGenerationObserver } from "../domain/generation-observer";
import type {
  GenerateResult,
  GeneratedSitemapFile,
  ProjectConfig,
  SitemapConfig,
} from "../domain/types";
import { GenerationCheckpointStore } from "../infrastructure/checkpoints/generation-checkpoint-store";
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
  checkpointSession?: GenerationCheckpointSession;
};

type GenerateSingleSitemapInput = {
  projectConfig: ProjectConfig;
  sitemapConfig: SitemapConfig;
  output: ReturnType<typeof createOutputWriter>;
  dryRun: boolean;
  observer: GenerationObserver;
  checkpointStore?: GenerationCheckpointStore;
  checkpoint?: SitemapCheckpoint;
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
  const checkpointStore = createCheckpointStore(options.checkpointSession);
  const checkpoint = options.checkpointSession?.checkpoint;

  try {
    await notifyCheckpointSession(observer, options.checkpointSession);

    await observer.onEvent({
      type: "generation_started",
      level: "info",
      command: "generate",
      dryRun,
      siteUrl: config.siteUrl,
      outputDirectory: config.output.directory,
      sitemapIndexFilename,
      selectedSitemaps: selectedSitemaps.map((sitemap) => sitemap.name),
      resumeMode: options.checkpointSession?.mode,
    });

    if (checkpointStore) {
      await checkpointStore.markGenerationStarted(
        createInitialCheckpoint({
          config,
          session: options.checkpointSession,
          checkpoint,
          selectedSitemaps: selectedSitemaps.map((sitemap) => sitemap.name),
          sitemapIndexFilename,
          dryRun,
        }),
      );
    }

    if (!dryRun) {
      await output.prepare(
        shouldCleanOutput(config, options.checkpointSession),
      );
    }

    const generatedFiles: GeneratedSitemapFile[] = [];

    for (const sitemapConfig of selectedSitemaps) {
      const sitemapCheckpoint = findSitemapCheckpoint(
        checkpoint,
        sitemapConfig.name,
      );

      if (sitemapCheckpoint?.status === "completed") {
        generatedFiles.push(...sitemapCheckpoint.files);
        continue;
      }

      const files = await generateSingleSitemap({
        projectConfig: config,
        sitemapConfig,
        output,
        dryRun,
        observer,
        checkpointStore,
        checkpoint: sitemapCheckpoint,
      });
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

      await checkpointStore?.markSitemapIndexCreated({
        filename: sitemapIndexFilename,
        sitemapFileCount: generatedFiles.length,
        fileSizeBytes: sitemapIndexFileSizeBytes,
      });
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

    const durationMs = Date.now() - startedAt;

    await checkpointStore?.markCompleted({
      totalUrls: result.totalUrls,
      totalFiles: generatedFiles.length + (options.sitemapName ? 0 : 1),
      totalBytesWritten: result.totalBytesWritten,
      durationMs,
    });

    await observer.onEvent({
      type: "generation_completed",
      level: "info",
      totalUrls: result.totalUrls,
      totalFiles: generatedFiles.length + (options.sitemapName ? 0 : 1),
      totalBytesWritten: result.totalBytesWritten,
      durationMs,
      dryRun,
    });

    return result;
  } catch (error) {
    const durationMs = Date.now() - startedAt;

    await checkpointStore?.markFailed({ durationMs }).catch(() => undefined);
    await observer.onEvent({
      type: "generation_failed",
      level: "error",
      durationMs,
      error: serializeError(error),
    });
    throw error;
  }
}

async function generateSingleSitemap(
  input: GenerateSingleSitemapInput,
): Promise<GeneratedSitemapFile[]> {
  const {
    projectConfig,
    sitemapConfig,
    output,
    dryRun,
    observer,
    checkpointStore,
    checkpoint,
  } = input;
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
  const generatedFiles: GeneratedSitemapFile[] = checkpoint
    ? [...checkpoint.files]
    : [];
  let currentStream: NodeJS.WritableStream | null = null;
  let currentFile: GeneratedSitemapFile | null = null;
  let currentCount = 0;
  let page = generatedFiles.length;
  let totalUrlsProcessed = generatedFiles.reduce(
    (total, file) => total + file.urlCount,
    0,
  );
  let totalBytesWritten = generatedFiles.reduce(
    (total, file) => total + (file.fileSizeBytes ?? 0),
    0,
  );
  const resumeUrlsToSkip = totalUrlsProcessed;

  await observer.onEvent({
    type: "sitemap_started",
    level: "info",
    sitemap: sitemapConfig.name,
    provider: sitemapConfig.type,
    batchSize: urlsPerSitemap,
    estimatedUrls,
    estimatedFiles,
  });

  await checkpointStore?.upsertSitemap({
    name: sitemapConfig.name,
    provider: sitemapConfig.type,
    status: "in_progress",
    batchSize: urlsPerSitemap,
    estimatedUrls,
    estimatedFiles,
    files: generatedFiles,
    urlsProcessed: totalUrlsProcessed,
    bytesWritten: totalBytesWritten,
    startedAt: checkpoint?.startedAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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

    await checkpointStore?.addSitemapFile(sitemapConfig.name, currentFile);

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
    let skippedRows = 0;

    for await (const row of provider.rows()) {
      if (skippedRows < resumeUrlsToSkip) {
        skippedRows += 1;
        continue;
      }

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

  await checkpointStore?.markSitemapCompleted(sitemapConfig.name, {
    files,
    urlsProcessed: totalUrlsProcessed,
    bytesWritten: totalBytesWritten,
  });

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

function createCheckpointStore(
  session?: GenerationCheckpointSession,
): GenerationCheckpointStore | undefined {
  if (!session?.checkpointFilePath || session.mode === "disabled") {
    return undefined;
  }

  return new GenerationCheckpointStore(session.checkpointFilePath);
}

function findSitemapCheckpoint(
  checkpoint: GenerationCheckpoint | undefined,
  sitemapName: string,
): SitemapCheckpoint | undefined {
  return checkpoint?.sitemaps.find((sitemap) => sitemap.name === sitemapName);
}

function shouldCleanOutput(
  config: ProjectConfig,
  session?: GenerationCheckpointSession,
): boolean {
  if (session?.mode === "resumed") {
    return false;
  }

  return config.output.clean ?? false;
}

async function notifyCheckpointSession(
  observer: GenerationObserver,
  session?: GenerationCheckpointSession,
): Promise<void> {
  if (!session) {
    return;
  }

  if (session.mode === "resumed" && session.checkpointFilePath) {
    await observer.onEvent({
      type: "generation_resumed",
      level: "info",
      runId: session.runId,
      logFilePath: session.logFilePath,
      checkpointFilePath: session.checkpointFilePath,
      reason: session.resumeReason,
    });
    return;
  }

  if (session.mode === "restarted") {
    await observer.onEvent({
      type: "generation_checkpoint_restarted",
      level: "info",
      runId: session.runId,
      logFilePath: session.logFilePath,
      checkpointFilePath: session.checkpointFilePath,
      reason: session.restartReason ?? "Checkpoint could not be resumed.",
    });
  }
}

function createInitialCheckpoint(input: {
  config: ProjectConfig;
  session?: GenerationCheckpointSession;
  checkpoint?: GenerationCheckpoint;
  selectedSitemaps: string[];
  sitemapIndexFilename: string;
  dryRun: boolean;
}): GenerationCheckpoint {
  const now = new Date().toISOString();
  const previous =
    input.session?.mode === "resumed" ? input.checkpoint : undefined;

  return {
    version: 1,
    status: "in_progress",
    runId: input.session?.runId ?? previous?.runId ?? "unknown",
    logFilePath: input.session?.logFilePath ?? previous?.logFilePath ?? "",
    configHash: input.session?.configHash ?? previous?.configHash ?? "",
    command: "generate",
    project: input.config.project,
    siteUrl: input.config.siteUrl,
    outputDirectory: input.config.output.directory,
    sitemapIndexFilename: input.sitemapIndexFilename,
    selectedSitemaps: input.selectedSitemaps,
    dryRun: input.dryRun,
    startedAt: previous?.startedAt ?? now,
    updatedAt: now,
    sitemaps: previous?.sitemaps ?? [],
    sitemapIndex: previous?.sitemapIndex,
  };
}
