# Configuration

The CLI can work with either a registered project or a local config file.

Default local file:

```txt
nsi.config.json
```

Use another file with:

```bash
nsi generate --config ./configs/example.nsi.config.json
```

## Root fields

| Field                   | Description                                          |
| ----------------------- | ---------------------------------------------------- |
| `project`               | Project identifier used in logs and messages.        |
| `siteUrl`               | Public canonical URL of the site.                    |
| `output`                | Output driver configuration.                         |
| `sitemapIndex.filename` | Sitemap index filename. Default: `sitemap.xml`.      |
| `limits.urlsPerSitemap` | Default URL limit per sitemap. Recommended: `50000`. |
| `logging`               | Optional log and console configuration.              |
| `sitemaps`              | List of sitemap definitions.                         |

## Filesystem output

```json
{
  "output": {
    "driver": "filesystem",
    "directory": "./dist/sitemaps",
    "clean": true
  }
}
```

## URL mapping

Rows can provide a full URL:

```json
{ "loc": "https://example.com/page" }
```

A relative path:

```json
{ "path": "/page" }
```

Or fields used by `urlPattern`:

```json
{
  "urlPattern": "/records/:slug"
}
```

With a row:

```json
{ "slug": "first-record" }
```

The generated URL becomes:

```txt
https://example.com/records/first-record
```

## PostgreSQL provider

```json
{
  "name": "records",
  "type": "postgres",
  "filenamePattern": "sitemaps/records-{page}.xml",
  "batchSize": 50000,
  "urlPattern": "/records/:slug",
  "lastmodField": "updated_at",
  "defaultChangefreq": "weekly",
  "defaultPriority": 0.8,
  "source": {
    "connectionString": "postgres://user:password@localhost:5432/database",
    "fetchSize": 10000,
    "query": "SELECT slug, updated_at FROM seo_indexable_records ORDER BY slug",
    "countQuery": "SELECT COUNT(*) FROM seo_indexable_records"
  }
}
```

The provider uses a PostgreSQL cursor to avoid loading the entire result set into memory.

## `batchSize` and `fetchSize`

| Field       | Purpose                                                        |
| ----------- | -------------------------------------------------------------- |
| `batchSize` | How many URLs go into each XML sitemap. Do not exceed `50000`. |
| `fetchSize` | How many PostgreSQL rows are fetched at a time.                |
