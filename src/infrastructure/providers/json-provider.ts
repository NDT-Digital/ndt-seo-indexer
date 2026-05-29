import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type {
  JsonSitemapConfig,
  RawUrlRow,
  UrlProvider,
} from "../../domain/types";
import { ProviderError } from "../../domain/errors";
import { getNestedValue } from "../../utils/object";

export class JsonProvider implements UrlProvider {
  constructor(private readonly config: JsonSitemapConfig) {}

  async count(): Promise<number | "unknown"> {
    const items = await this.readItems();

    return items.length;
  }

  async *rows(): AsyncIterable<RawUrlRow> {
    const items = await this.readItems();

    for (const item of items) {
      yield item;
    }
  }

  private async readItems(): Promise<RawUrlRow[]> {
    const filePath = resolve(process.cwd(), this.config.source.file);
    const content = await readFile(filePath, "utf8");
    const parsed = JSON.parse(content) as unknown;
    const value = this.config.source.itemsPath
      ? getNestedValue(parsed, this.config.source.itemsPath)
      : parsed;

    if (!Array.isArray(value)) {
      throw new ProviderError(
        `JSON provider '${this.config.name}' expected an array of items.`,
      );
    }

    return value.map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        throw new ProviderError(
          `JSON provider '${this.config.name}' found an item that is not an object.`,
        );
      }

      return item as RawUrlRow;
    });
  }
}
