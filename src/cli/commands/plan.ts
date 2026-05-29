import type { Command } from "commander";
import { planProject } from "../../application/plan-project";
import { loadConfigFromOptions } from "../config";
import { printPlan } from "../console";

export function registerPlanCommand(program: Command): void {
  program
    .command("plan")
    .description("Preview estimated URL and sitemap file counts.")
    .option("-c, --config <path>", "Path to a local NSI config file")
    .option("-p, --project <name>", "Registered project name")
    .action(async (options: { config?: string; project?: string }) => {
      const config = await loadConfigFromOptions(options);
      const result = await planProject(config);

      printPlan(result);
    });
}
