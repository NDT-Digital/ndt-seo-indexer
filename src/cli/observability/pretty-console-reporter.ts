import type {
  GenerationEvent,
  GenerationObserver,
} from "../../domain/generation-observer";

const CLEAR_LINE = "\x1b[2K";
const CURSOR_START = "\r";

export type PrettyConsoleReporterOptions = {
  project?: string;
  useColors?: boolean;
  singleLineProgress?: boolean;
};

export class PrettyConsoleReporter implements GenerationObserver {
  private hasProgressLine = false;
  private readonly project?: string;
  private readonly useColors: boolean;
  private readonly singleLineProgress: boolean;

  constructor(options: PrettyConsoleReporterOptions = {}) {
    this.project = options.project;
    this.useColors = options.useColors ?? process.stdout.isTTY;
    this.singleLineProgress = options.singleLineProgress ?? true;
  }

  onEvent(event: GenerationEvent): void {
    switch (event.type) {
      case "generation_resumed":
        this.writeLine(
          `${this.time()} ${this.color("Resuming checkpoint", "cyan")} · run=${event.runId} · checkpoint=${event.checkpointFilePath}`,
        );
        break;
      case "generation_checkpoint_restarted":
        this.writeLine(
          `${this.time()} ${this.color("Checkpoint ignored", "cyan")} · ${event.reason}`,
        );
        break;
      case "generation_started":
        this.writeLine(
          `${this.time()} ${this.color("NSI generate started", "green")} · project=${this.project ?? "unknown"} · sitemaps=${event.selectedSitemaps.join(",") || "all"} · output=${event.outputDirectory} · mode=${event.resumeMode ?? "fresh"}`,
        );
        break;
      case "sitemap_started":
        this.writeLine(
          `${this.time()} ${this.color("Sitemap started", "cyan")} · ${event.sitemap} · batch=${event.batchSize} · files=${event.estimatedFiles}`,
        );
        break;
      case "sitemap_file_created":
        this.writeProgress(this.formatFileProgress(event));
        break;
      case "sitemap_index_created":
        this.finishProgressLine();
        this.writeLine(
          `${this.time()} ${this.color("Sitemap index created", "green")} · ${event.file} · files=${event.sitemapFileCount}`,
        );
        break;
      case "robots_created":
        this.finishProgressLine();
        this.writeLine(
          `${this.time()} ${this.color("Robots created", "green")} · ${event.file} · sitemap=${event.sitemap}`,
        );
        break;
      case "sitemap_completed":
        this.finishProgressLine();
        this.writeLine(
          `${this.time()} ${this.color("Sitemap completed", "green")} · ${event.sitemap} · files=${event.fileCount} · urls=${formatNumber(event.urlCount)} · size=${formatBytes(event.bytesWritten)} · duration=${formatDuration(event.durationMs)}`,
        );
        break;
      case "generation_completed":
        this.finishProgressLine();
        this.writeLine(
          `${this.time()} ${this.color("Generate completed", "green")} · urls=${formatNumber(event.totalUrls)} · files=${event.totalFiles} · size=${formatBytes(event.totalBytesWritten)} · duration=${formatDuration(event.durationMs)}`,
        );
        break;
      case "generation_failed":
        this.finishProgressLine();
        this.writeLine(
          `${this.time()} ${this.color("Generate failed", "red")} · ${event.error.message}`,
        );
        break;
    }
  }

  close(): void {
    this.finishProgressLine();
  }

  private formatFileProgress(
    event: Extract<GenerationEvent, { type: "sitemap_file_created" }>,
  ): string {
    const totalFilesLabel =
      typeof event.totalFiles === "number" ? String(event.totalFiles) : "?";
    const percentage =
      typeof event.totalFiles === "number"
        ? ` · ${((event.fileIndex / event.totalFiles) * 100).toFixed(1)}%`
        : "";
    const averageSize = event.totalBytesWritten / Math.max(event.fileIndex, 1);
    const estimatedSize =
      typeof event.totalFiles === "number"
        ? ` · estimated=${formatBytes(averageSize * event.totalFiles)}`
        : "";

    return `${this.time()} ${this.color(event.sitemap, "cyan")} · files=${event.fileIndex}/${totalFilesLabel}${percentage} · urls=${formatNumber(event.totalUrlsProcessed)} · size=${formatBytes(event.totalBytesWritten)}${estimatedSize} · latest=${event.file}`;
  }

  private writeProgress(message: string): void {
    if (!this.singleLineProgress || !process.stdout.isTTY) {
      this.writeLine(message);
      return;
    }

    process.stdout.write(`${CURSOR_START}${CLEAR_LINE}${message}`);
    this.hasProgressLine = true;
  }

  private finishProgressLine(): void {
    if (this.hasProgressLine) {
      process.stdout.write("\n");
      this.hasProgressLine = false;
    }
  }

  private writeLine(message: string): void {
    this.finishProgressLine();
    console.log(message);
  }

  private time(): string {
    return this.color(
      `[${new Date().toLocaleTimeString("pt-BR", { hour12: false })}]`,
      "gray",
    );
  }

  private color(
    value: string,
    color: "cyan" | "gray" | "green" | "red",
  ): string {
    if (!this.useColors) {
      return value;
    }

    const codes = {
      cyan: "\x1b[36m",
      gray: "\x1b[90m",
      green: "\x1b[32m",
      red: "\x1b[31m",
    };

    return `${codes[color]}${value}\x1b[0m`;
  }
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatBytes(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  let currentValue = value;
  let unitIndex = 0;

  while (currentValue >= 1024 && unitIndex < units.length - 1) {
    currentValue /= 1024;
    unitIndex += 1;
  }

  return `${currentValue.toFixed(currentValue >= 10 ? 1 : 2)} ${units[unitIndex]}`;
}

function formatDuration(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${seconds}s`;
}
