# Providers

Providers are sources of rows that will be converted into sitemap URLs.

The application core does not know whether data came from PostgreSQL, CSV, JSON, or static configuration. It receives rows and applies the configured mapping.

## `static`

Use for fixed pages.

```json
{
  "name": "static",
  "type": "static",
  "filename": "sitemaps/static.xml",
  "urls": [
    { "path": "/", "priority": 1, "changefreq": "weekly" },
    { "path": "/about", "priority": 0.6, "changefreq": "monthly" }
  ]
}
```

## `postgres`

Use for large PostgreSQL datasets.

```json
{
  "name": "records",
  "type": "postgres",
  "filenamePattern": "sitemaps/records-{page}.xml",
  "batchSize": 50000,
  "urlPattern": "/records/:slug",
  "lastmodField": "updated_at",
  "source": {
    "connectionString": "postgres://user:password@localhost:5432/database",
    "fetchSize": 10000,
    "query": "SELECT slug, updated_at FROM seo_indexable_records ORDER BY slug",
    "countQuery": "SELECT COUNT(*) FROM seo_indexable_records"
  }
}
```

The provider uses a PostgreSQL cursor to avoid loading the entire result set into memory.

## `csv`

Use for CSV files with headers.

## `json`

Use for JSON files. Use `itemsPath` when the records are nested in an object.

## Row shape

A row can return:

| Field                   | Purpose                                  |
| ----------------------- | ---------------------------------------- |
| `loc`                   | Ready-to-use absolute URL.               |
| `path`                  | Relative path joined with `siteUrl`.     |
| `urlPattern` fields     | Values substituted into the URL pattern. |
| `lastmodField` value    | Value used as `<lastmod>`.               |
| `changefreqField` value | Value used as `<changefreq>`.            |
| `priorityField` value   | Value used as `<priority>`.              |
