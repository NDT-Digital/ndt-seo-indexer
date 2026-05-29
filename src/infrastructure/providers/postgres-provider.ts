import pg from "pg";
import type {
  PostgresSitemapConfig,
  RawUrlRow,
  UrlProvider,
} from "../../domain/types";
import { ProviderError } from "../../domain/errors";

const { Client } = pg;

export class PostgresProvider implements UrlProvider {
  private client: pg.Client | null = null;

  constructor(private readonly config: PostgresSitemapConfig) {}

  async count(): Promise<number | "unknown"> {
    if (!this.config.source.countQuery) {
      return "unknown";
    }

    const client = await this.createClient();

    try {
      const result = await client.query(this.config.source.countQuery);
      const firstRow = result.rows[0] as Record<string, unknown> | undefined;
      const value = firstRow?.count ?? Object.values(firstRow ?? {})[0];
      const parsed = Number(value);

      return Number.isFinite(parsed) ? parsed : "unknown";
    } finally {
      await client.end();
    }
  }

  async *rows(): AsyncIterable<RawUrlRow> {
    const client = await this.createClient();
    const cursorName = `nsi_cursor_${Date.now()}_${Math.round(Math.random() * 1_000_000)}`;
    const fetchSize = this.config.source.fetchSize ?? 5000;
    const query = stripTrailingSemicolon(this.config.source.query);

    this.client = client;

    try {
      await client.query("BEGIN");
      await client.query(`DECLARE ${cursorName} NO SCROLL CURSOR FOR ${query}`);

      while (true) {
        const result = await client.query(
          `FETCH FORWARD ${fetchSize} FROM ${cursorName}`,
        );

        if (result.rows.length === 0) {
          break;
        }

        for (const row of result.rows) {
          yield row as RawUrlRow;
        }
      }

      await client.query(`CLOSE ${cursorName}`);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      await client.end();
      this.client = null;
    }
  }

  async close(): Promise<void> {
    await this.client?.end();
    this.client = null;
  }

  private async createClient(): Promise<pg.Client> {
    const connectionString = this.resolveConnectionString();
    const client = new Client({ connectionString });

    await client.connect();

    return client;
  }

  private resolveConnectionString(): string {
    if (this.config.source.connectionString) {
      return this.config.source.connectionString;
    }

    if (this.config.source.connectionStringEnv) {
      const value = process.env[this.config.source.connectionStringEnv];

      if (value?.trim()) {
        return value.trim();
      }

      throw new ProviderError(
        `Missing required environment variable '${this.config.source.connectionStringEnv}' for sitemap '${this.config.name}'.`,
      );
    }

    throw new ProviderError(
      `Postgres sitemap '${this.config.name}' requires connectionString or connectionStringEnv.`,
    );
  }
}

function stripTrailingSemicolon(query: string): string {
  return query.trim().replace(/;+$/, "");
}
