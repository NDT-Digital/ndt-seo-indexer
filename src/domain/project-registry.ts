export type RegisteredProject = {
  name: string;
  configPath: string;
  createdAt: string;
  updatedAt: string;
};

export type GlobalNsiConfig = {
  version: 1;
  currentProject?: string;
  projects: RegisteredProject[];
};

export type ProjectCreateInput = {
  name: string;
  siteUrl: string;
  outputDirectory: string;
  setCurrent: boolean;
  force?: boolean;
  fromConfigPath?: string;
};
