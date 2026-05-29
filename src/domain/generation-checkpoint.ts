import type { GeneratedSitemapFile, SitemapConfig } from "./types";

export const GENERATION_CHECKPOINT_VERSION = 1;

export type GenerationCheckpointStatus = "in_progress" | "completed" | "failed";

export type SitemapCheckpointStatus = "in_progress" | "completed";

export type SitemapCheckpoint = {
  name: string;
  provider: SitemapConfig["type"];
  status: SitemapCheckpointStatus;
  batchSize: number;
  estimatedUrls: number | "unknown";
  estimatedFiles: number | "unknown";
  files: GeneratedSitemapFile[];
  urlsProcessed: number;
  bytesWritten: number;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
};

export type SitemapIndexCheckpoint = {
  filename: string;
  sitemapFileCount: number;
  fileSizeBytes: number;
  createdAt: string;
};

export type GenerationCheckpoint = {
  version: typeof GENERATION_CHECKPOINT_VERSION;
  status: GenerationCheckpointStatus;
  runId: string;
  logFilePath: string;
  configHash: string;
  command: "generate";
  project: string;
  siteUrl: string;
  outputDirectory: string;
  sitemapIndexFilename: string;
  selectedSitemaps: string[];
  dryRun: boolean;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  failedAt?: string;
  sitemaps: SitemapCheckpoint[];
  sitemapIndex?: SitemapIndexCheckpoint;
  totals?: {
    totalUrls: number;
    totalFiles: number;
    totalBytesWritten: number;
    durationMs: number;
  };
};

export type CheckpointResumeMode =
  | "disabled"
  | "fresh"
  | "resumed"
  | "restarted";

export type GenerationCheckpointSession = {
  mode: CheckpointResumeMode;
  runId: string;
  logFilePath: string;
  checkpointFilePath?: string;
  configHash: string;
  checkpoint?: GenerationCheckpoint;
  restartReason?: string;
  resumeReason?: string;
};
