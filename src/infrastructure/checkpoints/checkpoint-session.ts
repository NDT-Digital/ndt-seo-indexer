import { constants } from "node:fs";
import { access, stat } from "node:fs/promises";
import { join } from "node:path";
import type {
  GenerationCheckpoint,
  GenerationCheckpointSession,
} from "../../domain/generation-checkpoint";
import type { ProjectConfig } from "../../domain/types";
import {
  createGenerationLogFilename,
  resolveProjectLogsDirectory,
} from "../observability/log-paths";
import { createRunId } from "../observability/run-id";
import { createGenerationConfigHash } from "./config-hash";
import { GenerationCheckpointStore } from "./generation-checkpoint-store";
import { resolveGenerationCheckpointPath } from "./checkpoint-paths";

export type ResolveGenerationSessionOptions = {
  sitemapName?: string;
  dryRun?: boolean;
  resume?: boolean;
  force?: boolean;
};

export async function resolveGenerationCheckpointSession(
  config: ProjectConfig,
  options: ResolveGenerationSessionOptions = {},
): Promise<GenerationCheckpointSession> {
  const configHash = createGenerationConfigHash(config, options.sitemapName);
  const checkpointFilePath = resolveGenerationCheckpointPath(config);

  if (options.dryRun) {
    return createFreshSession(config, configHash, {
      mode: "disabled",
      checkpointFilePath,
      restartReason: "Dry-run executions do not use checkpoints.",
    });
  }

  const store = new GenerationCheckpointStore(checkpointFilePath);
  const checkpoint = await safeLoadCheckpoint(store);

  if (options.force || options.resume === false) {
    return createFreshSession(config, configHash, {
      mode: options.force ? "restarted" : "disabled",
      checkpointFilePath,
      restartReason: options.force
        ? "Checkpoint ignored by --force."
        : "Checkpoint resume disabled by --no-resume.",
    });
  }

  if (!checkpoint) {
    return createFreshSession(config, configHash, {
      mode: "fresh",
      checkpointFilePath,
    });
  }

  if (checkpoint.status === "completed") {
    return createFreshSession(config, configHash, {
      mode: "fresh",
      checkpointFilePath,
      restartReason: "Previous generation is completed.",
    });
  }

  if (checkpoint.configHash !== configHash) {
    return createFreshSession(config, configHash, {
      mode: "restarted",
      checkpointFilePath,
      restartReason:
        "Checkpoint config hash does not match the current config.",
    });
  }

  const validation = await validateCheckpointOutputFiles(config, checkpoint);

  if (!validation.valid) {
    return createFreshSession(config, configHash, {
      mode: "restarted",
      checkpointFilePath,
      restartReason: validation.reason,
    });
  }

  return {
    mode: "resumed",
    runId: checkpoint.runId,
    logFilePath: checkpoint.logFilePath,
    checkpointFilePath,
    configHash,
    checkpoint,
    resumeReason: "Found a valid incomplete checkpoint.",
  };
}

function createFreshSession(
  config: ProjectConfig,
  configHash: string,
  input: {
    mode: GenerationCheckpointSession["mode"];
    checkpointFilePath?: string;
    restartReason?: string;
  },
): GenerationCheckpointSession {
  const runId = createRunId();
  const logFilePath = join(
    resolveProjectLogsDirectory(config),
    createGenerationLogFilename(runId),
  );

  return {
    mode: input.mode,
    runId,
    logFilePath,
    checkpointFilePath: input.checkpointFilePath,
    configHash,
    restartReason: input.restartReason,
  };
}

async function safeLoadCheckpoint(
  store: GenerationCheckpointStore,
): Promise<GenerationCheckpoint | null> {
  try {
    return await store.load();
  } catch {
    return null;
  }
}

async function validateCheckpointOutputFiles(
  config: ProjectConfig,
  checkpoint: GenerationCheckpoint,
): Promise<{ valid: true } | { valid: false; reason: string }> {
  for (const sitemap of checkpoint.sitemaps) {
    for (const file of sitemap.files) {
      const absolutePath = join(config.output.directory, file.filename);

      if (!(await pathExists(absolutePath))) {
        return {
          valid: false,
          reason: `Checkpoint file '${file.filename}' was not found in output directory.`,
        };
      }

      if (file.fileSizeBytes && file.fileSizeBytes > 0) {
        const stats = await stat(absolutePath);

        if (stats.size !== file.fileSizeBytes) {
          return {
            valid: false,
            reason: `Checkpoint file '${file.filename}' size does not match the recorded size.`,
          };
        }
      }
    }
  }

  return { valid: true };
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}
