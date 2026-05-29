import { homedir } from "node:os";
import { join } from "node:path";

const APP_DIRECTORY_NAME = ".ndt-seo-indexer";
const GLOBAL_CONFIG_FILENAME = "nsi.config.json";

export function getUserConfigDirectory(): string {
  return join(homedir(), APP_DIRECTORY_NAME);
}

export function getGlobalConfigPath(): string {
  return join(getUserConfigDirectory(), GLOBAL_CONFIG_FILENAME);
}

export function getProjectsDirectory(): string {
  return join(getUserConfigDirectory(), "projects");
}

export function getProjectDirectory(projectName: string): string {
  return join(getProjectsDirectory(), sanitizeProjectName(projectName));
}

export function getProjectConfigPath(projectName: string): string {
  const safeName = sanitizeProjectName(projectName);

  return join(getProjectDirectory(safeName), `${safeName}.nsi.config.json`);
}

export function getDefaultProjectOutputDirectory(projectName: string): string {
  return join(getProjectDirectory(projectName), "dist");
}

export function sanitizeProjectName(value: string): string {
  const sanitized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!sanitized) {
    throw new Error("Project name must contain at least one valid character.");
  }

  return sanitized;
}
