import { dirname, join, resolve } from "node:path";
import type { ProjectConfig } from "../../domain/types";

export function resolveProjectCheckpointsDirectory(
  config: ProjectConfig,
): string {
  const outputDirectory = resolve(process.cwd(), config.output.directory);

  return join(dirname(outputDirectory), "checkpoints");
}

export function resolveGenerationCheckpointPath(config: ProjectConfig): string {
  return join(
    resolveProjectCheckpointsDirectory(config),
    "generate-state.json",
  );
}
