import type { SitemapUrl } from "../../domain/types";
import { createXmlSignatureComment } from "../signature/generated-file-signature";
import { escapeXml } from "./xml-escape";

export type SitemapHeaderInput = {
  generatedAt?: string;
  sitemapName?: string;
  page?: number;
};

export function createSitemapHeader(input: SitemapHeaderInput = {}): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    createXmlSignatureComment({
      generatedAt: input.generatedAt,
      type: "urlset",
      sitemapName: input.sitemapName,
      page: input.page,
    }).trimEnd(),
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    "",
  ].join("\n");
}

export function createSitemapFooter(): string {
  return "</urlset>\n";
}

export function serializeSitemapUrl(url: SitemapUrl): string {
  const lines = ["  <url>", `    <loc>${escapeXml(url.loc)}</loc>`];

  if (url.lastmod) {
    lines.push(`    <lastmod>${escapeXml(url.lastmod)}</lastmod>`);
  }

  if (url.changefreq) {
    lines.push(`    <changefreq>${escapeXml(url.changefreq)}</changefreq>`);
  }

  if (typeof url.priority === "number") {
    lines.push(`    <priority>${url.priority.toFixed(1)}</priority>`);
  }

  lines.push("  </url>");

  return `${lines.join("\n")}\n`;
}
