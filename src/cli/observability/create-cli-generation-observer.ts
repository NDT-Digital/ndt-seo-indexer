import {
  NoopGenerationObserver,
  type GenerationObserver,
} from "../../domain/generation-observer";
import type { GenerationCheckpointSession } from "../../domain/generation-checkpoint";
import type { ProjectConfig } from "../../domain/types";
import { CompositeGenerationObserver } from "../../infrastructure/observability/composite-generation-observer";
import { JsonlGenerationLogger } from "../../infrastructure/observability/jsonl-generation-logger";
import { createRunId } from "../../infrastructure/observability/run-id";
import { PrettyConsoleReporter } from "./pretty-console-reporter";

export async function createCliGenerationObserver(
  config: ProjectConfig,
  session?: GenerationCheckpointSession,
): Promise<GenerationObserver> {
  if (config.logging?.enabled === false) {
    return createConsoleObserver(config) ?? new NoopGenerationObserver();
  }

  const runId = session?.runId ?? createRunId();
  const observers: GenerationObserver[] = [
    session
      ? await JsonlGenerationLogger.createFromSession(config, session)
      : await JsonlGenerationLogger.createNew({ config, runId }),
  ];
  const consoleObserver = createConsoleObserver(config);

  if (consoleObserver) {
    observers.push(consoleObserver);
  }

  return new CompositeGenerationObserver(observers);
}

function createConsoleObserver(
  config: ProjectConfig,
): GenerationObserver | null {
  if (config.logging?.console?.enabled === false) {
    return null;
  }

  return new PrettyConsoleReporter({
    project: config.project,
    useColors: config.logging?.console?.useColors,
    singleLineProgress: config.logging?.console?.singleLineProgress,
  });
}
