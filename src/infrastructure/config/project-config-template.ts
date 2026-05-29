import type { ProjectConfig } from "../../domain/types";

export function createProjectConfigTemplate(input: {
  project: string;
  siteUrl: string;
  outputDirectory: string;
}): ProjectConfig {
  return {
    project: input.project,
    siteUrl: input.siteUrl,
    output: {
      driver: "filesystem",
      directory: input.outputDirectory,
      clean: true,
    },
    sitemapIndex: {
      filename: "sitemap.xml",
    },
    limits: {
      urlsPerSitemap: 40_000,
    },
    sitemaps: [
      {
        name: "static",
        type: "static",
        filename: "sitemaps/static.xml",
        urls: [
          { path: "/", priority: 1, changefreq: "weekly" },
          { path: "/about", priority: 0.6, changefreq: "monthly" },
        ],
      },
    ],
  };
}
