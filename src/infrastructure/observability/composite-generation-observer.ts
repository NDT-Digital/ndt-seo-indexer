import type {
  GenerationEvent,
  GenerationObserver,
} from "../../domain/generation-observer";

export class CompositeGenerationObserver implements GenerationObserver {
  constructor(private readonly observers: GenerationObserver[]) {}

  async onEvent(event: GenerationEvent): Promise<void> {
    for (const observer of this.observers) {
      await observer.onEvent(event);
    }
  }

  async close(): Promise<void> {
    for (const observer of this.observers) {
      await observer.close?.();
    }
  }
}
