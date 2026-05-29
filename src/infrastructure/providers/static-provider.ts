import type {
  RawUrlRow,
  StaticSitemapConfig,
  UrlProvider,
} from "../../domain/types";

export class StaticProvider implements UrlProvider {
  constructor(private readonly config: StaticSitemapConfig) {}

  async count(): Promise<number> {
    return this.config.urls.length;
  }

  async *rows(): AsyncIterable<RawUrlRow> {
    for (const url of this.config.urls) {
      yield { ...url };
    }
  }
}
