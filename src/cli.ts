import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { Command } from "commander";
import { registerConfigCommand } from "./cli/commands/config";
import { registerGenerateCommand } from "./cli/commands/generate";
import { registerInitCommand } from "./cli/commands/init";
import { registerPlanCommand } from "./cli/commands/plan";
import { registerProjectCommand } from "./cli/commands/project";
import { registerValidateCommand } from "./cli/commands/validate";

function getPackageVersion(): string {
  const require = createRequire(import.meta.url);
  const packageJsonPath = require.resolve("../package.json");
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
    version?: string;
  };

  return packageJson.version ?? "0.0.0";
}

async function main(): Promise<void> {
  const program = new Command();

  const packageVersion = getPackageVersion();

  program
    .name("nsi")
    .description(
      "NDT SEO Indexer — scalable sitemap generator for programmatic SEO.",
    )
    .version(packageVersion, "-v, --version", "Show CLI version");

  program
    .command("version")
    .description("Show CLI version")
    .action(() => {
      console.log(packageVersion);
    });

  registerInitCommand(program);
  registerProjectCommand(program);
  registerConfigCommand(program);
  registerValidateCommand(program);
  registerPlanCommand(program);
  registerGenerateCommand(program);

  await program.parseAsync(process.argv);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  process.exitCode = 1;
});
