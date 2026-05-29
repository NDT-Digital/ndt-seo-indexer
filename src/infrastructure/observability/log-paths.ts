import { dirname, join, resolve } from "node:path";
import type { ProjectConfig } from "../../domain/types";
import { createRunTimestamp } from "./run-id";

export function resolveProjectLogsDirectory(config: ProjectConfig): string {
  if (config.logging?.directory) {
    return resolve(process.cwd(), config.logging.directory);
  }

  const outputDirectory = resolve(process.cwd(), config.output.directory);

  return join(dirname(outputDirectory), "logs");
}

export function createGenerationLogFilename(
  runId: string,
  date = new Date(),
): string {
  return `generate-${createRunTimestamp(date)}-${runId}.jsonl`;
}
