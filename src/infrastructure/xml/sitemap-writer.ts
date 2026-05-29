import type { SitemapUrl } from "../../domain/types";
import { escapeXml } from "./xml-escape";

export function createSitemapHeader(): string {
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
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
