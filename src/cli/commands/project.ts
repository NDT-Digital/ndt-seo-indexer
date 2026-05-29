import type { Command } from "commander";
import {
  createRegisteredProject,
  getDefaultCreateInput,
  getRegisteredProject,
  listRegisteredProjects,
  removeRegisteredProject,
  setCurrentProject,
} from "../../infrastructure/config/project-registry-store";
import {
  getGlobalConfigPath,
  getProjectConfigPath,
  getUserConfigDirectory,
  sanitizeProjectName,
} from "../../infrastructure/config/user-config-paths";

export function registerProjectCommand(program: Command): void {
  const command = program
    .command("project")
    .description(
      "Manage NSI projects stored in the user configuration directory.",
    );

  command
    .command("create")
    .argument("<name>", "Project name")
    .description(
      "Create a registered project configuration in the user directory.",
    )
    .option("--site-url <url>", "Public canonical site URL")
    .option("--output-dir <path>", "Filesystem output directory")
    .option("--from <path>", "Create the project from an existing config file")
    .option("--no-set-current", "Do not select the created project as current")
    .option("--force", "Overwrite the project config file if it already exists")
    .action(
      async (
        name: string,
        options: {
          siteUrl?: string;
          outputDir?: string;
          from?: string;
          setCurrent: boolean;
          force?: boolean;
        },
      ) => {
        const safeName = sanitizeProjectName(name);
        const defaults = getDefaultCreateInput(safeName);
        const result = await createRegisteredProject({
          name: safeName,
          siteUrl: options.siteUrl ?? defaults.siteUrl,
          outputDirectory: options.outputDir ?? defaults.outputDirectory,
          setCurrent: options.setCurrent,
          force: options.force,
          fromConfigPath: options.from,
        });

        console.log(`Project created: ${result.project.name}`);
        console.log(`Project config: ${result.configPath}`);
        console.log(`Global config: ${result.globalConfigPath}`);
      },
    );

  command
    .command("list")
    .description("List registered NSI projects.")
    .action(async () => {
      const config = await listRegisteredProjects();

      console.log(`NSI home: ${getUserConfigDirectory()}`);
      console.log(`Global config: ${getGlobalConfigPath()}`);
      console.log("");

      if (!config.projects.length) {
        console.log("No projects registered.");
        return;
      }

      for (const project of config.projects) {
        const marker = project.name === config.currentProject ? "*" : " ";
        console.log(`${marker} ${project.name} — ${project.configPath}`);
      }
    });

  command
    .command("use")
    .argument("<name>", "Project name")
    .description(
      "Select the current project used by commands without --project.",
    )
    .action(async (name: string) => {
      const project = await setCurrentProject(name);
      console.log(`Current project: ${project.name}`);
      console.log(`Config: ${project.configPath}`);
    });

  command
    .command("show")
    .argument("[name]", "Project name. Defaults to the current project.")
    .description("Show a registered project.")
    .action(async (name?: string) => {
      const project = await getRegisteredProject(name);
      console.log(`Project: ${project.name}`);
      console.log(`Config: ${project.configPath}`);
      console.log(`Created: ${project.createdAt}`);
      console.log(`Updated: ${project.updatedAt}`);
    });

  command
    .command("path")
    .argument("[name]", "Project name. Defaults to the current project.")
    .description("Print the project configuration path.")
    .action(async (name?: string) => {
      if (name) {
        console.log(getProjectConfigPath(name));
        return;
      }

      const project = await getRegisteredProject();
      console.log(project.configPath);
    });

  command
    .command("remove")
    .argument("<name>", "Project name")
    .description("Remove a project from the registry.")
    .option("--delete-files", "Also delete the project directory")
    .action(async (name: string, options: { deleteFiles?: boolean }) => {
      const project = await removeRegisteredProject(name, {
        deleteFiles: options.deleteFiles,
      });

      console.log(`Project removed: ${project.name}`);
    });
}
