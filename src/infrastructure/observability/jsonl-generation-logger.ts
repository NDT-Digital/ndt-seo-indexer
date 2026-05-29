import { createWriteStream, type WriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import type {
  GenerationEvent,
  GenerationObserver,
} from "../../domain/generation-observer";
import type { ProjectConfig } from "../../domain/types";
import {
  createGenerationLogFilename,
  resolveProjectLogsDirectory,
} from "./log-paths";

export type JsonlGenerationLoggerOptions = {
  config: ProjectConfig;
  runId: string;
};

export class JsonlGenerationLogger implements GenerationObserver {
  readonly filePath: string;
  private readonly stream: WriteStream;

  private constructor(
    private readonly config: ProjectConfig,
    private readonly runId: string,
    filePath: string,
  ) {
    this.filePath = filePath;
    this.stream = createWriteStream(filePath, {
      encoding: "utf8",
      flags: "a",
    });
  }

  static async create(
    options: JsonlGenerationLoggerOptions,
  ): Promise<JsonlGenerationLogger> {
    const directory = resolveProjectLogsDirectory(options.config);
    await mkdir(directory, { recursive: true });

    return new JsonlGenerationLogger(
      options.config,
      options.runId,
      join(directory, createGenerationLogFilename(options.runId)),
    );
  }

  async onEvent(event: GenerationEvent): Promise<void> {
    const { type, ...payload } = event;
    const line = JSON.stringify({
      timestamp: new Date().toISOString(),
      runId: this.runId,
      project: this.config.project,
      event: type,
      ...payload,
    });

    await writeLine(this.stream, line);
  }

  async close(): Promise<void> {
    await closeStream(this.stream);
  }
}

async function writeLine(stream: WriteStream, line: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    stream.write(`${line}\n`, (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

async function closeStream(stream: WriteStream): Promise<void> {
  if (stream.closed || stream.destroyed) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    stream.once("finish", resolve);
    stream.once("error", reject);
    stream.end();
  });
}
