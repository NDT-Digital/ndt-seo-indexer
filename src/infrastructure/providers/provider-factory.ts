import type { SitemapConfig, UrlProvider } from "../../domain/types";
import { ConfigError } from "../../domain/errors";
import { CsvProvider } from "./csv-provider";
import { JsonProvider } from "./json-provider";
import { PostgresProvider } from "./postgres-provider";
import { StaticProvider } from "./static-provider";

export function createProvider(config: SitemapConfig): UrlProvider {
  switch (config.type) {
    case "static":
      return new StaticProvider(config);
    case "postgres":
      return new PostgresProvider(config);
    case "csv":
      return new CsvProvider(config);
    case "json":
      return new JsonProvider(config);
    default:
      throw new ConfigError(
        `Unsupported sitemap provider type: ${(config as { type?: string }).type ?? "unknown"}`,
      );
  }
}
