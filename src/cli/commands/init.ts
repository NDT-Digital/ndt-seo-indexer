import { writeFile } from "node:fs/promises";
import type { Command } from "commander";
import { createProjectConfigTemplate } from "../../infrastructure/config/project-config-template";

export function registerInitCommand(program: Command): void {
  program
    .command("init")
    .description("Create a local example nsi.config.json file.")
    .option("-o, --output <path>", "Config output path", "nsi.config.json")
    .option("--project <name>", "Project identifier", "example-project")
    .option(
      "--site-url <url>",
      "Public canonical site URL",
      "https://example.com",
    )
    .option(
      "--output-dir <path>",
      "Generated sitemap output directory",
      "./dist/sitemaps",
    )
    .action(
      async (options: {
        output: string;
        project: string;
        siteUrl: string;
        outputDir: string;
      }) => {
        const config = createProjectConfigTemplate({
          project: options.project,
          siteUrl: options.siteUrl,
          outputDirectory: options.outputDir,
        });

        await writeFile(
          options.output,
          `${JSON.stringify(config, null, 2)}\n`,
          "utf8",
        );
        console.log(`Created ${options.output}`);
      },
    );
}
