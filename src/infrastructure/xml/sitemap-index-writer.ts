import type { GeneratedSitemapFile } from "../../domain/types";
import { joinUrl } from "../../utils/path";
import { escapeXml } from "./xml-escape";

export function serializeSitemapIndex(
  siteUrl: string,
  files: GeneratedSitemapFile[],
): string {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];

  for (const file of files) {
    lines.push("  <sitemap>");
    lines.push(`    <loc>${escapeXml(joinUrl(siteUrl, file.filename))}</loc>`);
    lines.push(`    <lastmod>${escapeXml(file.lastmod)}</lastmod>`);
    lines.push("  </sitemap>");
  }

  lines.push("</sitemapindex>");

  return `${lines.join("\n")}\n`;
}
