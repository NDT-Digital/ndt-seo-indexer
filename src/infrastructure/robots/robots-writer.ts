import { createTextSignatureComment } from "../signature/generated-file-signature";
import { joinUrl } from "../../utils/path";

export function serializeRobotsTxt(input: {
  siteUrl: string;
  sitemapIndexFilename: string;
  generatedAt?: string;
}): string {
  const signature = createTextSignatureComment({
    generatedAt: input.generatedAt,
    type: "robots",
  });

  return [
    signature.trimEnd(),
    "",
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${joinUrl(input.siteUrl, input.sitemapIndexFilename)}`,
    "",
  ].join("\n");
}
