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
  console.log(`Generated sitemap files: ${result.generatedFiles.length}`);
  console.log(`Total size: ${formatBytes(result.totalBytesWritten)}`);

  if (result.generatedFiles.length === 0) {
    return;
  }

  console.log("");

  if (result.generatedFiles.length <= 20) {
    console.log("Generated files:");

    for (const file of result.generatedFiles) {
      console.log(
        `- ${file.filename} | urls=${file.urlCount} | size=${formatBytes(file.fileSizeBytes ?? 0)}`,
      );
    }

    return;
  }

  const firstFile = result.generatedFiles[0];
  const lastFile = result.generatedFiles[result.generatedFiles.length - 1];

  console.log(
    `Generated files omitted from summary (${result.generatedFiles.length} files). Check the JSONL log for file-level details.`,
  );
  console.log(`First: ${firstFile.filename} | urls=${firstFile.urlCount}`);
  console.log(`Last: ${lastFile.filename} | urls=${lastFile.urlCount}`);
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

function formatBytes(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  let currentValue = value;
  let unitIndex = 0;

  while (currentValue >= 1024 && unitIndex < units.length - 1) {
    currentValue /= 1024;
    unitIndex += 1;
  }

  return `${currentValue.toFixed(currentValue >= 10 ? 1 : 2)} ${units[unitIndex]}`;
}
