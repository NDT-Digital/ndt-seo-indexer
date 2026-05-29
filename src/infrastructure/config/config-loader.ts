import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { ProjectConfig, SitemapConfig } from "../../domain/types";
import { ConfigError } from "../../domain/errors";
import { trimTrailingSlash } from "../../utils/path";

export async function loadProjectConfig(
  configPath: string,
): Promise<ProjectConfig> {
  const resolvedPath = resolve(process.cwd(), configPath);
  const content = await readFile(resolvedPath, "utf8");
  const parsed = JSON.parse(content) as unknown;

  return normalizeProjectConfig(parsed, resolvedPath);
}

export function normalizeProjectConfig(
  value: unknown,
  source = "config",
): ProjectConfig {
  assertRecord(value, `${source} must be a JSON object.`);

  const project = readRequiredString(value, "project");
  const siteUrl = trimTrailingSlash(readRequiredString(value, "siteUrl"));
  const output = readRequiredRecord(value, "output");
  const sitemaps = readRequiredArray(value, "sitemaps");

  const config: ProjectConfig = {
    project,
    siteUrl,
    output: {
      driver: readRequiredString(output, "driver") as "filesystem",
      directory: readRequiredString(output, "directory"),
      clean: readOptionalBoolean(output, "clean"),
    },
    sitemapIndex: readOptionalRecord(value, "sitemapIndex")
      ? {
          filename: readOptionalString(
            readOptionalRecord(value, "sitemapIndex") ?? {},
            "filename",
          ),
        }
      : undefined,
    limits: readOptionalRecord(value, "limits")
      ? {
          urlsPerSitemap: readOptionalNumber(
            readOptionalRecord(value, "limits") ?? {},
            "urlsPerSitemap",
          ),
        }
      : undefined,
    sitemaps: sitemaps.map((item, index) =>
      normalizeSitemapConfig(item, `${source}.sitemaps[${index}]`),
    ),
  };

  validateConfig(config);

  return config;
}

function normalizeSitemapConfig(value: unknown, source: string): SitemapConfig {
  assertRecord(value, `${source} must be an object.`);

  const type = readRequiredString(value, "type");
  const base = {
    name: readRequiredString(value, "name"),
    type,
    filename: readOptionalString(value, "filename"),
    filenamePattern: readOptionalString(value, "filenamePattern"),
    batchSize: readOptionalNumber(value, "batchSize"),
    urlPattern: readOptionalString(value, "urlPattern"),
    lastmodField: readOptionalString(value, "lastmodField"),
    changefreqField: readOptionalString(value, "changefreqField"),
    priorityField: readOptionalString(value, "priorityField"),
    defaultChangefreq: readOptionalString(
      value,
      "defaultChangefreq",
    ) as SitemapConfig["defaultChangefreq"],
    defaultPriority: readOptionalNumber(value, "defaultPriority"),
  };

  if (type === "static") {
    return {
      ...base,
      type: "static",
      urls: readRequiredArray(value, "urls").map((url) => {
        assertRecord(url, `${source}.urls[] must be an object.`);

        return {
          path: readOptionalString(url, "path"),
          loc: readOptionalString(url, "loc"),
          lastmod: readOptionalString(url, "lastmod"),
          changefreq: readOptionalString(
            url,
            "changefreq",
          ) as SitemapConfig["defaultChangefreq"],
          priority: readOptionalNumber(url, "priority"),
        };
      }),
    };
  }

  const sourceConfig = readRequiredRecord(value, "source");

  if (type === "postgres") {
    return {
      ...base,
      type: "postgres",
      source: {
        connectionString: readOptionalString(sourceConfig, "connectionString"),
        connectionStringEnv: readOptionalString(
          sourceConfig,
          "connectionStringEnv",
        ),
        query: readRequiredString(sourceConfig, "query"),
        countQuery: readOptionalString(sourceConfig, "countQuery"),
        fetchSize: readOptionalNumber(sourceConfig, "fetchSize"),
      },
    };
  }

  if (type === "csv") {
    return {
      ...base,
      type: "csv",
      source: {
        file: readRequiredString(sourceConfig, "file"),
        delimiter: readOptionalString(sourceConfig, "delimiter"),
      },
    };
  }

  if (type === "json") {
    return {
      ...base,
      type: "json",
      source: {
        file: readRequiredString(sourceConfig, "file"),
        itemsPath: readOptionalString(sourceConfig, "itemsPath"),
      },
    };
  }

  throw new ConfigError(`${source}.type '${type}' is not supported.`);
}

export function validateConfig(config: ProjectConfig): void {
  if (!config.project.trim()) {
    throw new ConfigError("project is required.");
  }

  try {
    new URL(config.siteUrl);
  } catch {
    throw new ConfigError("siteUrl must be a valid absolute URL.");
  }

  if (config.output.driver !== "filesystem") {
    throw new ConfigError(
      "Only filesystem output is supported in this version.",
    );
  }

  if (!config.sitemaps.length) {
    throw new ConfigError("At least one sitemap must be configured.");
  }

  const names = new Set<string>();

  for (const sitemap of config.sitemaps) {
    if (names.has(sitemap.name)) {
      throw new ConfigError(`Duplicated sitemap name '${sitemap.name}'.`);
    }

    names.add(sitemap.name);

    if (sitemap.type !== "static" && !sitemap.urlPattern) {
      throw new ConfigError(`Sitemap '${sitemap.name}' requires urlPattern.`);
    }
  }
}

function assertRecord(
  value: unknown,
  message: string,
): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ConfigError(message);
  }
}

function readRequiredString(
  record: Record<string, unknown>,
  key: string,
): string {
  const value = record[key];

  if (typeof value !== "string" || !value.trim()) {
    throw new ConfigError(`Missing required string field '${key}'.`);
  }

  return value.trim();
}

function readOptionalString(
  record: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = record[key];

  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readRequiredRecord(
  record: Record<string, unknown>,
  key: string,
): Record<string, unknown> {
  const value = record[key];
  assertRecord(value, `Missing required object field '${key}'.`);

  return value;
}

function readOptionalRecord(
  record: Record<string, unknown>,
  key: string,
): Record<string, unknown> | undefined {
  const value = record[key];

  if (!value) {
    return undefined;
  }

  assertRecord(value, `Field '${key}' must be an object.`);

  return value;
}

function readRequiredArray(
  record: Record<string, unknown>,
  key: string,
): unknown[] {
  const value = record[key];

  if (!Array.isArray(value)) {
    throw new ConfigError(`Missing required array field '${key}'.`);
  }

  return value;
}

function readOptionalBoolean(
  record: Record<string, unknown>,
  key: string,
): boolean | undefined {
  const value = record[key];

  return typeof value === "boolean" ? value : undefined;
}

function readOptionalNumber(
  record: Record<string, unknown>,
  key: string,
): number | undefined {
  const value = record[key];

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  return undefined;
}
