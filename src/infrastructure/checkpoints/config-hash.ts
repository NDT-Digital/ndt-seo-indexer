import { createHash } from "node:crypto";
import type { ProjectConfig } from "../../domain/types";

export function createGenerationConfigHash(
  config: ProjectConfig,
  sitemapName?: string,
): string {
  const selectedSitemaps = sitemapName
    ? config.sitemaps.filter((sitemap) => sitemap.name === sitemapName)
    : config.sitemaps;

  return createHash("sha256")
    .update(
      stableStringify({
        project: config.project,
        siteUrl: config.siteUrl,
        output: config.output,
        sitemapIndex: config.sitemapIndex,
        limits: config.limits,
        selectedSitemapName: sitemapName,
        sitemaps: selectedSitemaps,
      }),
    )
    .digest("hex");
}

function stableStringify(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, sortValue(item)]),
    );
  }

  return value;
}
