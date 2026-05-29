import type { OutputConfig, OutputWriter } from "../../domain/types";
import { ConfigError } from "../../domain/errors";
import { FilesystemOutputWriter } from "./filesystem-output";

export function createOutputWriter(config: OutputConfig): OutputWriter {
  if (config.driver === "filesystem") {
    return new FilesystemOutputWriter(config.directory);
  }

  throw new ConfigError(
    `Unsupported output driver: ${(config as { driver?: string }).driver ?? "unknown"}`,
  );
}
