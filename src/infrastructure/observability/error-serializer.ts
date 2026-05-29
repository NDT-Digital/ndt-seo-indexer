import type { GenerationErrorPayload } from "../../domain/generation-observer";

export function serializeError(error: unknown): GenerationErrorPayload {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    message: String(error),
  };
}
