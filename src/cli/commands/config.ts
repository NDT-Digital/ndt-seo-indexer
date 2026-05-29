import { readFile } from "node:fs/promises";
import type { Command } from "commander";
import { ConfigError } from "../../domain/errors";
import {
  getRegisteredProject,
  loadGlobalConfig,
  updateRegisteredProjectConfig,
} from "../../infrastructure/config/project-registry-store";
import {
  getGlobalConfigPath,
  getUserConfigDirectory,
} from "../../infrastructure/config/user-config-paths";

export function registerConfigCommand(program: Command): void {
  const command = program
    .command("config")
    .description("Inspect and update NSI global and project configuration.");

  command
    .command("home")
    .description("Print the NSI user configuration directory.")
    .action(() => {
      console.log(getUserConfigDirectory());
    });

  command
    .command("global")
    .description("Print the global NSI config path.")
    .action(() => {
      console.log(getGlobalConfigPath());
    });

  command
    .command("list")
    .description("Print the global config or a project config.")
    .option(
      "-p, --project <name>",
      "Project name. Defaults to the current project.",
    )
    .option("--global", "Print the global registry config")
    .action(async (options: { project?: string; global?: boolean }) => {
      if (options.global) {
        const config = await loadGlobalConfig();
        console.log(JSON.stringify(config, null, 2));
        return;
      }

      const project = await getRegisteredProject(options.project);
      const content = await readFile(project.configPath, "utf8");
      console.log(content.trimEnd());
    });

  command
    .command("get")
    .argument(
      "<key>",
      "Dot notation key, for example siteUrl or output.directory",
    )
    .description("Read a project config value.")
    .option(
      "-p, --project <name>",
      "Project name. Defaults to the current project.",
    )
    .action(async (key: string, options: { project?: string }) => {
      const project = await getRegisteredProject(options.project);
      const content = await readFile(project.configPath, "utf8");
      const parsed = JSON.parse(content) as unknown;
      const value = getValueByPath(parsed, key);

      console.log(formatValue(value));
    });

  command
    .command("set")
    .argument(
      "<key>",
      "Dot notation key, for example siteUrl or output.directory",
    )
    .argument("<value>", "Value. JSON values are supported.")
    .description("Update a project config value.")
    .option(
      "-p, --project <name>",
      "Project name. Defaults to the current project.",
    )
    .action(
      async (key: string, value: string, options: { project?: string }) => {
        const parsedValue = parseCliValue(value);
        const result = await updateRegisteredProjectConfig(
          options.project,
          (config) => setValueByPath(config, key, parsedValue),
        );

        console.log(`Updated ${key} for project '${result.project.name}'.`);
        console.log(`Config: ${result.project.configPath}`);
      },
    );
}

function getValueByPath(value: unknown, path: string): unknown {
  const segments = path.split(".").filter(Boolean);
  let current = value;

  for (const segment of segments) {
    if (!current || typeof current !== "object") {
      return undefined;
    }

    current = (current as Record<string, unknown>)[segment];
  }

  return current;
}

function setValueByPath(
  value: unknown,
  path: string,
  nextValue: unknown,
): unknown {
  const segments = path.split(".").filter(Boolean);

  if (!segments.length) {
    throw new ConfigError("Config key cannot be empty.");
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ConfigError("Project config must be a JSON object.");
  }

  let current = value as Record<string, unknown>;

  for (const segment of segments.slice(0, -1)) {
    const child = current[segment];

    if (!child || typeof child !== "object" || Array.isArray(child)) {
      current[segment] = {};
    }

    current = current[segment] as Record<string, unknown>;
  }

  current[segments[segments.length - 1] ?? ""] = nextValue;

  return value;
}

function parseCliValue(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

function formatValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value, null, 2);
}
