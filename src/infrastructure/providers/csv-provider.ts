import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { resolve } from "node:path";
import type {
  CsvSitemapConfig,
  RawUrlRow,
  UrlProvider,
} from "../../domain/types";

export class CsvProvider implements UrlProvider {
  constructor(private readonly config: CsvSitemapConfig) {}

  async count(): Promise<number | "unknown"> {
    let count = 0;
    let hasHeader = false;

    for await (const line of this.readLines()) {
      if (!line.trim()) {
        continue;
      }

      if (!hasHeader) {
        hasHeader = true;
        continue;
      }

      count += 1;
    }

    return count;
  }

  async *rows(): AsyncIterable<RawUrlRow> {
    const delimiter = this.config.source.delimiter ?? ",";
    let headers: string[] | null = null;

    for await (const line of this.readLines()) {
      if (!line.trim()) {
        continue;
      }

      const columns = parseCsvLine(line, delimiter);

      if (!headers) {
        headers = columns.map((header) => header.trim());
        continue;
      }

      const row: RawUrlRow = {};

      for (const [index, header] of headers.entries()) {
        row[header] = columns[index] ?? "";
      }

      yield row;
    }
  }

  private readLines(): AsyncIterable<string> {
    const stream = createReadStream(
      resolve(process.cwd(), this.config.source.file),
      { encoding: "utf8" },
    );

    return createInterface({ input: stream, crlfDelay: Infinity });
  }
}

export function parseCsvLine(line: string, delimiter = ","): string[] {
  const values: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"') {
      if (insideQuotes && nextCharacter === '"') {
        current += '"';
        index += 1;
        continue;
      }

      insideQuotes = !insideQuotes;
      continue;
    }

    if (character === delimiter && !insideQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += character;
  }

  values.push(current.trim());

  return values;
}
