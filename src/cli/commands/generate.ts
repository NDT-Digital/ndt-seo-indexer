import type { Command } from "commander";
import { generateSitemaps } from "../../application/generate-sitemaps";
import { loadConfigFromOptions } from "../config";
import { printGenerateResult } from "../console";
import { createCliGenerationObserver } from "../observability/create-cli-generation-observer";

export function registerGenerateCommand(program: Command): void {
  program
    .command("generate")
    .description(
      "Generate sitemap files and sitemap index from a project config.",
    )
    .option("-c, --config <path>", "Path to a local NSI config file")
    .option("-p, --project <name>", "Registered project name")
    .option("-s, --sitemap <name>", "Generate only one sitemap by name")
    .option("--dry-run", "Run without writing files")
    .action(
      async (options: {
        config?: string;
        project?: string;
        sitemap?: string;
        dryRun?: boolean;
      }) => {
        const config = await loadConfigFromOptions(options);
        const observer = await createCliGenerationObserver(config);

        try {
          const result = await generateSitemaps(config, {
            sitemapName: options.sitemap,
            dryRun: options.dryRun,
            observer,
          });

          printGenerateResult(result);
        } finally {
          await observer.close?.();
        }
      },
    );
}
