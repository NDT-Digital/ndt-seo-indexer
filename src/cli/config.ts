import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { loadProjectConfig } from "../infrastructure/config/config-loader";
import { loadRegisteredProjectConfig } from "../infrastructure/config/project-registry-store";

export type CommonCommandOptions = {
  config?: string;
  project?: string;
};

export async function loadConfigFromOptions(options: CommonCommandOptions) {
  if (options.config) {
    return loadProjectConfig(options.config);
  }

  if (options.project) {
    const { config } = await loadRegisteredProjectConfig(options.project);
    return config;
  }

  try {
    const { config } = await loadRegisteredProjectConfig();
    return config;
  } catch (error) {
    if (await localConfigExists()) {
      return loadProjectConfig("nsi.config.json");
    }

    throw error;
  }
}

async function localConfigExists(): Promise<boolean> {
  try {
    await access("nsi.config.json", constants.F_OK);
    return true;
  } catch {
    return false;
  }
}
