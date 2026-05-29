import type { Command } from "commander";
import { validateProject } from "../../application/validate-project";
import { loadConfigFromOptions } from "../config";
import { printValidationResult } from "../console";

export function registerValidateCommand(program: Command): void {
  program
    .command("validate")
    .description("Validate project config, output and providers.")
    .option("-c, --config <path>", "Path to a local NSI config file")
    .option("-p, --project <name>", "Registered project name")
    .action(async (options: { config?: string; project?: string }) => {
      const config = await loadConfigFromOptions(options);
      const result = await validateProject(config);

      printValidationResult(result);

      if (!result.ok) {
        process.exitCode = 1;
      }
    });
}
