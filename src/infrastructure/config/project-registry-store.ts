import { constants } from "node:fs";
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type {
  GlobalNsiConfig,
  ProjectCreateInput,
  RegisteredProject,
} from "../../domain/project-registry";
import type { ProjectConfig } from "../../domain/types";
import { ConfigError } from "../../domain/errors";
import { normalizeProjectConfig } from "./config-loader";
import { createProjectConfigTemplate } from "./project-config-template";
import {
  getDefaultProjectOutputDirectory,
  getGlobalConfigPath,
  getProjectConfigPath,
  getProjectDirectory,
  getUserConfigDirectory,
  sanitizeProjectName,
} from "./user-config-paths";

const EMPTY_GLOBAL_CONFIG: GlobalNsiConfig = {
  version: 1,
  projects: [],
};

export type ProjectCreateResult = {
  project: RegisteredProject;
  configPath: string;
  globalConfigPath: string;
};

export async function ensureUserConfigDirectory(): Promise<void> {
  await mkdir(getUserConfigDirectory(), { recursive: true });
}

export async function loadGlobalConfig(): Promise<GlobalNsiConfig> {
  const path = getGlobalConfigPath();

  if (!(await pathExists(path))) {
    return { ...EMPTY_GLOBAL_CONFIG, projects: [] };
  }

  const content = await readFile(path, "utf8");
  const parsed = JSON.parse(content) as unknown;

  return normalizeGlobalConfig(parsed, path);
}

export async function saveGlobalConfig(config: GlobalNsiConfig): Promise<void> {
  const path = getGlobalConfigPath();
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

export async function createRegisteredProject(
  input: ProjectCreateInput,
): Promise<ProjectCreateResult> {
  const name = sanitizeProjectName(input.name);
  const projectDirectory = getProjectDirectory(name);
  const configPath = getProjectConfigPath(name);
  const now = new Date().toISOString();

  await ensureUserConfigDirectory();

  if (!input.force && (await pathExists(configPath))) {
    throw new ConfigError(
      `Project '${name}' already exists. Use --force to overwrite its config file.`,
    );
  }

  await mkdir(projectDirectory, { recursive: true });

  const projectConfig = input.fromConfigPath
    ? await loadConfigTemplateFromFile(input.fromConfigPath, name)
    : createProjectConfigTemplate({
        project: name,
        siteUrl: input.siteUrl,
        outputDirectory: input.outputDirectory,
      });

  await writeFile(
    configPath,
    `${JSON.stringify(projectConfig, null, 2)}\n`,
    "utf8",
  );

  const globalConfig = await loadGlobalConfig();
  const existing = globalConfig.projects.find(
    (project) => project.name === name,
  );
  const registeredProject: RegisteredProject = {
    name,
    configPath,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  globalConfig.projects = [
    ...globalConfig.projects.filter((project) => project.name !== name),
    registeredProject,
  ].sort((left, right) => left.name.localeCompare(right.name));

  if (input.setCurrent || !globalConfig.currentProject) {
    globalConfig.currentProject = name;
  }

  await saveGlobalConfig(globalConfig);

  return {
    project: registeredProject,
    configPath,
    globalConfigPath: getGlobalConfigPath(),
  };
}

export async function listRegisteredProjects(): Promise<GlobalNsiConfig> {
  return loadGlobalConfig();
}

export async function setCurrentProject(
  projectName: string,
): Promise<RegisteredProject> {
  const name = sanitizeProjectName(projectName);
  const globalConfig = await loadGlobalConfig();
  const project = findRegisteredProject(globalConfig, name);

  globalConfig.currentProject = project.name;
  await saveGlobalConfig(globalConfig);

  return project;
}

export async function getRegisteredProject(
  projectName?: string,
): Promise<RegisteredProject> {
  const globalConfig = await loadGlobalConfig();
  const name = projectName
    ? sanitizeProjectName(projectName)
    : globalConfig.currentProject;

  if (!name) {
    throw new ConfigError(
      "No project selected. Use 'nsi project use <name>' or pass --project <name>.",
    );
  }

  return findRegisteredProject(globalConfig, name);
}

export async function removeRegisteredProject(
  projectName: string,
  options: { deleteFiles?: boolean } = {},
): Promise<RegisteredProject> {
  const name = sanitizeProjectName(projectName);
  const globalConfig = await loadGlobalConfig();
  const project = findRegisteredProject(globalConfig, name);

  globalConfig.projects = globalConfig.projects.filter(
    (item) => item.name !== name,
  );

  if (globalConfig.currentProject === name) {
    globalConfig.currentProject = globalConfig.projects[0]?.name;
  }

  await saveGlobalConfig(globalConfig);

  if (options.deleteFiles) {
    await rm(getProjectDirectory(name), { force: true, recursive: true });
  }

  return project;
}

export async function loadRegisteredProjectConfig(
  projectName?: string,
): Promise<{ config: ProjectConfig; project: RegisteredProject }> {
  const project = await getRegisteredProject(projectName);
  const content = await readFile(project.configPath, "utf8");
  const parsed = JSON.parse(content) as unknown;

  return {
    config: normalizeProjectConfig(parsed, project.configPath),
    project,
  };
}

export async function updateRegisteredProjectConfig(
  projectName: string | undefined,
  update: (config: unknown) => unknown,
): Promise<{ config: ProjectConfig; project: RegisteredProject }> {
  const project = await getRegisteredProject(projectName);
  const content = await readFile(project.configPath, "utf8");
  const parsed = JSON.parse(content) as unknown;
  const updated = update(parsed);
  const normalized = normalizeProjectConfig(updated, project.configPath);

  await writeFile(
    project.configPath,
    `${JSON.stringify(normalized, null, 2)}\n`,
    "utf8",
  );

  const globalConfig = await loadGlobalConfig();
  const now = new Date().toISOString();
  globalConfig.projects = globalConfig.projects.map((item) =>
    item.name === project.name ? { ...item, updatedAt: now } : item,
  );
  await saveGlobalConfig(globalConfig);

  return {
    config: normalized,
    project: { ...project, updatedAt: now },
  };
}

export function getDefaultCreateInput(
  name: string,
): Pick<ProjectCreateInput, "outputDirectory" | "siteUrl"> {
  const safeName = sanitizeProjectName(name);

  return {
    siteUrl: "https://example.com",
    outputDirectory: getDefaultProjectOutputDirectory(safeName),
  };
}

function normalizeGlobalConfig(
  value: unknown,
  source: string,
): GlobalNsiConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ConfigError(`${source} must be a JSON object.`);
  }

  const record = value as Record<string, unknown>;
  const projects = Array.isArray(record.projects)
    ? record.projects.map((item, index) =>
        normalizeRegisteredProject(item, `${source}.projects[${index}]`),
      )
    : [];
  const currentProject =
    typeof record.currentProject === "string" && record.currentProject.trim()
      ? sanitizeProjectName(record.currentProject)
      : undefined;

  return {
    version: 1,
    currentProject,
    projects,
  };
}

function normalizeRegisteredProject(
  value: unknown,
  source: string,
): RegisteredProject {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ConfigError(`${source} must be an object.`);
  }

  const record = value as Record<string, unknown>;
  const name = readRequiredString(record, "name", source);
  const configPath = readRequiredString(record, "configPath", source);
  const createdAt =
    readOptionalString(record, "createdAt") ?? new Date().toISOString();
  const updatedAt = readOptionalString(record, "updatedAt") ?? createdAt;

  return {
    name: sanitizeProjectName(name),
    configPath,
    createdAt,
    updatedAt,
  };
}

function findRegisteredProject(
  config: GlobalNsiConfig,
  name: string,
): RegisteredProject {
  const project = config.projects.find((item) => item.name === name);

  if (!project) {
    throw new ConfigError(
      `Project '${name}' was not found. Use 'nsi project list' to see registered projects.`,
    );
  }

  return project;
}

async function loadConfigTemplateFromFile(
  path: string,
  projectName: string,
): Promise<ProjectConfig> {
  const content = await readFile(resolve(process.cwd(), path), "utf8");
  const parsed = JSON.parse(content) as unknown;
  const normalized = normalizeProjectConfig(parsed, path);

  return {
    ...normalized,
    project: projectName,
  };
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function readRequiredString(
  record: Record<string, unknown>,
  key: string,
  source: string,
): string {
  const value = record[key];

  if (typeof value !== "string" || !value.trim()) {
    throw new ConfigError(
      `${source} is missing required string field '${key}'.`,
    );
  }

  return value.trim();
}

function readOptionalString(
  record: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = record[key];

  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
