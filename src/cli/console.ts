import type { GenerateResult, PlanResult } from "../domain/types";
import type { ValidationResult } from "../application/validate-project";

export function printPlan(result: PlanResult): void {
  console.log(`Project: ${result.project}`);
  console.log(`Site URL: ${result.siteUrl}`);
  console.log(`Output: ${result.outputDirectory}`);
  console.log("");
  console.log("Sitemaps:");

  for (const sitemap of result.sitemaps) {
    console.log(
      `- ${sitemap.name} (${sitemap.type}) | urls=${sitemap.estimatedUrls} | batch=${sitemap.batchSize} | files=${sitemap.estimatedFiles}`,
    );
  }
}

export function printGenerateResult(result: GenerateResult): void {
  console.log(`Project: ${result.project}`);
  console.log(`Output: ${result.outputDirectory}`);
  console.log(`Sitemap index: ${result.sitemapIndexFilename}`);
  console.log(`Total URLs: ${result.totalUrls}`);
  console.log("");
  console.log("Generated files:");

  for (const file of result.generatedFiles) {
    console.log(`- ${file.filename} | urls=${file.urlCount}`);
  }
}

export function printValidationResult(result: ValidationResult): void {
  console.log(`Project: ${result.project}`);
  console.log(`Status: ${result.ok ? "ok" : "failed"}`);
  console.log("");

  for (const check of result.checks) {
    console.log(
      `- ${check.ok ? "✓" : "✗"} ${check.name}${check.details ? ` — ${check.details}` : ""}`,
    );
  }
}
