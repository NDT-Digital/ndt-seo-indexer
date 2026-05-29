import { constants } from "node:fs";
import { access, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type {
  GenerationCheckpoint,
  SitemapCheckpoint,
} from "../../domain/generation-checkpoint";
import { GENERATION_CHECKPOINT_VERSION } from "../../domain/generation-checkpoint";
import type { GeneratedSitemapFile } from "../../domain/types";

export class GenerationCheckpointStore {
  constructor(readonly filePath: string) {}

  async load(): Promise<GenerationCheckpoint | null> {
    if (!(await pathExists(this.filePath))) {
      return null;
    }

    const content = await readFile(this.filePath, "utf8");
    const parsed = JSON.parse(content) as unknown;

    return normalizeGenerationCheckpoint(parsed);
  }

  async save(checkpoint: GenerationCheckpoint): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });

    const temporaryPath = `${this.filePath}.tmp`;
    await writeFile(
      temporaryPath,
      `${JSON.stringify(checkpoint, null, 2)}\n`,
      "utf8",
    );
    await rename(temporaryPath, this.filePath);
  }

  async markGenerationStarted(checkpoint: GenerationCheckpoint): Promise<void> {
    await this.save({
      ...checkpoint,
      status: "in_progress",
      updatedAt: new Date().toISOString(),
    });
  }

  async upsertSitemap(sitemap: SitemapCheckpoint): Promise<void> {
    const checkpoint = await this.requireCheckpoint();
    const now = new Date().toISOString();

    await this.save({
      ...checkpoint,
      status: "in_progress",
      updatedAt: now,
      sitemaps: [
        ...checkpoint.sitemaps.filter((item) => item.name !== sitemap.name),
        { ...sitemap, updatedAt: now },
      ],
    });
  }

  async addSitemapFile(
    sitemapName: string,
    file: GeneratedSitemapFile,
  ): Promise<void> {
    const checkpoint = await this.requireCheckpoint();
    const now = new Date().toISOString();
    const sitemap = checkpoint.sitemaps.find(
      (item) => item.name === sitemapName,
    );

    if (!sitemap) {
      throw new Error(
        `Cannot add checkpoint file for unknown sitemap '${sitemapName}'.`,
      );
    }

    const files = [
      ...sitemap.files.filter((item) => item.filename !== file.filename),
      file,
    ].sort(
      (left, right) =>
        extractFilePage(left.filename) - extractFilePage(right.filename),
    );

    const bytesWritten = files.reduce(
      (total, item) => total + (item.fileSizeBytes ?? 0),
      0,
    );
    const urlsProcessed = files.reduce(
      (total, item) => total + item.urlCount,
      0,
    );

    await this.save({
      ...checkpoint,
      status: "in_progress",
      updatedAt: now,
      sitemaps: checkpoint.sitemaps.map((item) =>
        item.name === sitemapName
          ? {
              ...item,
              files,
              urlsProcessed,
              bytesWritten,
              status: "in_progress",
              updatedAt: now,
            }
          : item,
      ),
    });
  }

  async markSitemapCompleted(
    sitemapName: string,
    input: Pick<SitemapCheckpoint, "files" | "urlsProcessed" | "bytesWritten">,
  ): Promise<void> {
    const checkpoint = await this.requireCheckpoint();
    const now = new Date().toISOString();

    await this.save({
      ...checkpoint,
      status: "in_progress",
      updatedAt: now,
      sitemaps: checkpoint.sitemaps.map((item) =>
        item.name === sitemapName
          ? {
              ...item,
              status: "completed",
              files: input.files,
              urlsProcessed: input.urlsProcessed,
              bytesWritten: input.bytesWritten,
              updatedAt: now,
              completedAt: now,
            }
          : item,
      ),
    });
  }

  async markSitemapIndexCreated(input: {
    filename: string;
    sitemapFileCount: number;
    fileSizeBytes: number;
  }): Promise<void> {
    const checkpoint = await this.requireCheckpoint();
    const now = new Date().toISOString();

    await this.save({
      ...checkpoint,
      updatedAt: now,
      sitemapIndex: {
        ...input,
        createdAt: now,
      },
    });
  }

  async markCompleted(input: {
    totalUrls: number;
    totalFiles: number;
    totalBytesWritten: number;
    durationMs: number;
  }): Promise<void> {
    const checkpoint = await this.requireCheckpoint();
    const now = new Date().toISOString();

    await this.save({
      ...checkpoint,
      status: "completed",
      updatedAt: now,
      completedAt: now,
      totals: input,
    });
  }

  async markFailed(input: { durationMs: number }): Promise<void> {
    const checkpoint = await this.load();

    if (!checkpoint) {
      return;
    }

    const now = new Date().toISOString();

    await this.save({
      ...checkpoint,
      status: "failed",
      updatedAt: now,
      failedAt: now,
      totals: checkpoint.totals
        ? { ...checkpoint.totals, durationMs: input.durationMs }
        : undefined,
    });
  }

  private async requireCheckpoint(): Promise<GenerationCheckpoint> {
    const checkpoint = await this.load();

    if (!checkpoint) {
      throw new Error("Generation checkpoint was not initialized.");
    }

    return checkpoint;
  }
}

function normalizeGenerationCheckpoint(value: unknown): GenerationCheckpoint {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Generation checkpoint must be a JSON object.");
  }

  const record = value as Record<string, unknown>;

  if (record.version !== GENERATION_CHECKPOINT_VERSION) {
    throw new Error("Unsupported generation checkpoint version.");
  }

  return record as GenerationCheckpoint;
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function extractFilePage(filename: string): number {
  const match = filename.match(/(\d+)(?=\.xml$)/);

  return match ? Number(match[1]) : 0;
}
