import type { ProjectConfig } from "../domain/types";
import { createOutputWriter } from "../infrastructure/output/output-factory";
import { createProvider } from "../infrastructure/providers/provider-factory";
import { validateConfig } from "../infrastructure/config/config-loader";

export type ValidationResult = {
  project: string;
  ok: boolean;
  checks: Array<{ name: string; ok: boolean; details?: string }>;
};

export async function validateProject(
  config: ProjectConfig,
): Promise<ValidationResult> {
  const checks: ValidationResult["checks"] = [];

  validateConfig(config);
  checks.push({
    name: "config",
    ok: true,
    details: "Configuration shape is valid.",
  });

  const output = createOutputWriter(config.output);
  checks.push({ name: "output", ok: true, details: output.resolvePath(".") });

  for (const sitemap of config.sitemaps) {
    const provider = createProvider(sitemap);

    try {
      const count = provider.count ? await provider.count() : "unknown";
      checks.push({
        name: `provider:${sitemap.name}`,
        ok: true,
        details: `estimatedUrls=${String(count)}`,
      });
    } finally {
      await provider.close?.();
    }
  }

  return {
    project: config.project,
    ok: checks.every((check) => check.ok),
    checks,
  };
}
