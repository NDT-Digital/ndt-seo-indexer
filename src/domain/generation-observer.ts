export type GenerationEventLevel = "info" | "error";

export type GenerationErrorPayload = {
  name?: string;
  message: string;
  stack?: string;
};

export type GenerationEvent =
  | {
      type: "generation_resumed";
      level: "info";
      runId: string;
      logFilePath: string;
      checkpointFilePath: string;
      reason?: string;
    }
  | {
      type: "generation_checkpoint_restarted";
      level: "info";
      runId: string;
      logFilePath: string;
      checkpointFilePath?: string;
      reason: string;
    }
  | {
      type: "generation_started";
      level: "info";
      command: "generate";
      dryRun: boolean;
      siteUrl: string;
      outputDirectory: string;
      sitemapIndexFilename: string;
      selectedSitemaps: string[];
      resumeMode?: string;
    }
  | {
      type: "sitemap_started";
      level: "info";
      sitemap: string;
      provider: string;
      batchSize: number;
      estimatedUrls: number | "unknown";
      estimatedFiles: number | "unknown";
    }
  | {
      type: "sitemap_file_created";
      level: "info";
      sitemap: string;
      file: string;
      fileIndex: number;
      totalFiles: number | "unknown";
      urlCount: number;
      totalUrlsProcessed: number;
      fileSizeBytes: number;
      totalBytesWritten: number;
      dryRun: boolean;
    }
  | {
      type: "sitemap_completed";
      level: "info";
      sitemap: string;
      fileCount: number;
      urlCount: number;
      bytesWritten: number;
      durationMs: number;
    }
  | {
      type: "sitemap_index_created";
      level: "info";
      file: string;
      sitemapFileCount: number;
      fileSizeBytes: number;
      dryRun: boolean;
    }
  | {
      type: "robots_created";
      level: "info";
      file: string;
      sitemap: string;
      fileSizeBytes: number;
      dryRun: boolean;
    }
  | {
      type: "generation_completed";
      level: "info";
      totalUrls: number;
      totalFiles: number;
      totalBytesWritten: number;
      durationMs: number;
      dryRun: boolean;
    }
  | {
      type: "generation_failed";
      level: "error";
      durationMs: number;
      error: GenerationErrorPayload;
    };

export type GenerationObserver = {
  onEvent(event: GenerationEvent): Promise<void> | void;
  close?(): Promise<void> | void;
};

export class NoopGenerationObserver implements GenerationObserver {
  onEvent(): void {
    // No operation.
  }
}
