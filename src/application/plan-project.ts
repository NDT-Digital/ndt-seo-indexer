import type { PlanResult, ProjectConfig } from "../domain/types";
import { createProvider } from "../infrastructure/providers/provider-factory";

const DEFAULT_URLS_PER_SITEMAP = 40_000;

export async function planProject(config: ProjectConfig): Promise<PlanResult> {
  const sitemaps = [];

  for (const sitemapConfig of config.sitemaps) {
    const provider = createProvider(sitemapConfig);
    const estimatedUrls = provider.count ? await provider.count() : "unknown";
    const batchSize =
      sitemapConfig.batchSize ??
      config.limits?.urlsPerSitemap ??
      DEFAULT_URLS_PER_SITEMAP;
    const estimatedFiles: number | "unknown" =
      typeof estimatedUrls === "number"
        ? Math.max(1, Math.ceil(estimatedUrls / batchSize))
        : "unknown";

    await provider.close?.();

    sitemaps.push({
      name: sitemapConfig.name,
      type: sitemapConfig.type,
      estimatedUrls,
      batchSize,
      estimatedFiles,
    });
  }

  return {
    project: config.project,
    siteUrl: config.siteUrl,
    outputDirectory: config.output.directory,
    sitemaps,
  };
}
