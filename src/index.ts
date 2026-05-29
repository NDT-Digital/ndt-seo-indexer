export type {
  ChangeFrequency,
  CsvSitemapConfig,
  GenerateResult,
  JsonSitemapConfig,
  OutputConfig,
  PlanResult,
  PostgresSitemapConfig,
  ProjectConfig,
  SitemapConfig,
  SitemapUrl,
  StaticSitemapConfig,
} from "./domain/types";

export { generateSitemaps } from "./application/generate-sitemaps";
export { planProject } from "./application/plan-project";
export { validateProject } from "./application/validate-project";
export {
  loadProjectConfig,
  normalizeProjectConfig,
} from "./infrastructure/config/config-loader";
export { escapeXml } from "./infrastructure/xml/xml-escape";

export {
  createRegisteredProject,
  getRegisteredProject,
  listRegisteredProjects,
  loadRegisteredProjectConfig,
  removeRegisteredProject,
  setCurrentProject,
} from "./infrastructure/config/project-registry-store";
export {
  getGlobalConfigPath,
  getProjectConfigPath,
  getUserConfigDirectory,
} from "./infrastructure/config/user-config-paths";
