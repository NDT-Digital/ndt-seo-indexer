import type {
  ChangeFrequency,
  RawUrlRow,
  SitemapConfig,
  SitemapUrl,
} from "../domain/types";
import { asNumber, asString } from "../utils/object";
import { joinUrl, normalizeWebPath } from "../utils/path";

const TOKEN_PATTERN = /:([A-Za-z0-9_]+)/g;

export function mapRowToSitemapUrl(
  siteUrl: string,
  config: SitemapConfig,
  row: RawUrlRow,
): SitemapUrl {
  const explicitLoc = asString(row.loc);
  const explicitPath = asString(row.path);
  const path =
    explicitLoc ?? explicitPath ?? buildPathFromPattern(config.urlPattern, row);
  const loc = isAbsoluteUrl(path)
    ? path
    : joinUrl(siteUrl, normalizeWebPath(path));

  return {
    loc,
    lastmod: getFieldValue(row, config.lastmodField) ?? asString(row.lastmod),
    changefreq: (getFieldValue(row, config.changefreqField) ??
      asString(row.changefreq) ??
      config.defaultChangefreq) as ChangeFrequency | undefined,
    priority:
      getNumberFieldValue(row, config.priorityField) ??
      asNumber(row.priority) ??
      config.defaultPriority,
  };
}

export function buildPathFromPattern(
  pattern: string | undefined,
  row: RawUrlRow,
): string {
  if (!pattern) {
    throw new Error(
      "urlPattern is required when row does not contain loc or path.",
    );
  }

  return pattern.replace(TOKEN_PATTERN, (_, key: string) => {
    const value = asString(row[key]);

    if (!value) {
      throw new Error(`Missing value for urlPattern token ':${key}'.`);
    }

    return encodeURIComponent(value);
  });
}

function isAbsoluteUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function getFieldValue(row: RawUrlRow, field?: string): string | undefined {
  if (!field) {
    return undefined;
  }

  return asString(row[field]);
}

function getNumberFieldValue(
  row: RawUrlRow,
  field?: string,
): number | undefined {
  if (!field) {
    return undefined;
  }

  return asNumber(row[field]);
}
