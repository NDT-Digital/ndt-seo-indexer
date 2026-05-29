export type ChangeFrequency =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

export type SitemapUrl = {
  loc: string;
  lastmod?: string;
  changefreq?: ChangeFrequency;
  priority?: number;
};

export type RawUrlRow = Record<string, unknown>;

export type OutputConfig = {
  driver: "filesystem";
  directory: string;
  clean?: boolean;
};

export type SitemapIndexConfig = {
  filename?: string;
};

export type StaticUrlInput = {
  path?: string;
  loc?: string;
  lastmod?: string;
  changefreq?: ChangeFrequency;
  priority?: number;
};

export type BaseSitemapConfig = {
  name: string;
  filename?: string;
  filenamePattern?: string;
  batchSize?: number;
  urlPattern?: string;
  lastmodField?: string;
  changefreqField?: string;
  priorityField?: string;
  defaultChangefreq?: ChangeFrequency;
  defaultPriority?: number;
};

export type StaticSitemapConfig = BaseSitemapConfig & {
  type: "static";
  urls: StaticUrlInput[];
};

export type PostgresSitemapConfig = BaseSitemapConfig & {
  type: "postgres";
  source: {
    connectionString?: string;
    connectionStringEnv?: string;
    query: string;
    countQuery?: string;
    fetchSize?: number;
  };
};

export type CsvSitemapConfig = BaseSitemapConfig & {
  type: "csv";
  source: {
    file: string;
    delimiter?: string;
  };
};

export type JsonSitemapConfig = BaseSitemapConfig & {
  type: "json";
  source: {
    file: string;
    itemsPath?: string;
  };
};

export type SitemapConfig =
  | StaticSitemapConfig
  | PostgresSitemapConfig
  | CsvSitemapConfig
  | JsonSitemapConfig;

export type ProjectConfig = {
  project: string;
  siteUrl: string;
  output: OutputConfig;
  sitemapIndex?: SitemapIndexConfig;
  limits?: {
    urlsPerSitemap?: number;
  };
  sitemaps: SitemapConfig[];
};

export type GeneratedSitemapFile = {
  name: string;
  filename: string;
  urlCount: number;
  lastmod: string;
};

export type GenerateResult = {
  project: string;
  outputDirectory: string;
  sitemapIndexFilename: string;
  generatedFiles: GeneratedSitemapFile[];
  totalUrls: number;
};

export type PlanResult = {
  project: string;
  siteUrl: string;
  outputDirectory: string;
  sitemaps: Array<{
    name: string;
    type: SitemapConfig["type"];
    estimatedUrls: number | "unknown";
    batchSize: number;
    estimatedFiles: number | "unknown";
  }>;
};

export type UrlProvider = {
  count?(): Promise<number | "unknown">;
  rows(): AsyncIterable<RawUrlRow>;
  close?(): Promise<void>;
};

export type OutputWriter = {
  prepare(clean?: boolean): Promise<void>;
  writeText(relativePath: string, content: string): Promise<void>;
  createWriteStream(relativePath: string): Promise<NodeJS.WritableStream>;
  resolvePath(relativePath: string): string;
};
