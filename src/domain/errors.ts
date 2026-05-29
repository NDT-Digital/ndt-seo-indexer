export class NdtSeoIndexerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NdtSeoIndexerError";
  }
}

export class ConfigError extends NdtSeoIndexerError {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export class ProviderError extends NdtSeoIndexerError {
  constructor(message: string) {
    super(message);
    this.name = "ProviderError";
  }
}
