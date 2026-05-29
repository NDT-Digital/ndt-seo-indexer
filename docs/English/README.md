# NDT SEO Indexer

Configurable **NDT Digital** CLI for generating `sitemap.xml`, sitemap indexes, `robots.txt`, and batched XML sitemap files for programmatic SEO projects.

The project separates sitemap generation from the main application. Product APIs or frontends keep rendering public pages, while **NDT SEO Indexer** reads configured sources, maps public URLs, and writes files ready to be published.

## Features

- CLI-first workflow with the short alias `nsi`.
- Local multi-project registry in `~/.ndt-seo-indexer`.
- Per-project configuration without requiring `.env`.
- Sitemap index generation.
- Batched sitemap generation for large URL sets.
- `robots.txt` generation pointing to the main sitemap.
- Initial providers: `static`, `postgres`, `csv`, and `json`.
- Initial filesystem output.
- PostgreSQL cursor-based reading for large datasets.
- JSONL logs per generation run.
- Checkpoints to resume interrupted generations.
- Commands for `validate`, `plan`, `generate`, `project`, `config`, and `version`.

## Installation

Install the CLI globally:

```bash
npm install -g @ndt-digital/seo-indexer
```

Then use:

```bash
nsi --help
nsi --version
nsi project create example --site-url https://example.com
```

You can also install it as a development dependency:

```bash
npm install -D @ndt-digital/seo-indexer
```

Use with `npx`:

```bash
npx @ndt-digital/seo-indexer --help
```

## Core concept

The indexer generates files. It does not submit pages to Google and does not replace Google Search Console.

Expected flow:

```txt
Data source
↓
NDT SEO Indexer
↓
sitemap.xml + robots.txt + sitemaps/*.xml
↓
Files published on a site or storage
↓
Search engines discover URLs through robots.txt, sitemap index, or Search Console
```

## First local usage

Create a registered project:

```bash
nsi project create example --site-url https://example.com
```

This creates:

```txt
~/.ndt-seo-indexer/
  nsi.config.json
  projects/
    example/
      example.nsi.config.json
      dist/
      logs/
      checkpoints/
```

Validate, plan, and generate:

```bash
nsi validate
nsi plan
nsi generate
```

## Generated files

A typical generation creates:

```txt
dist/sitemaps/
  robots.txt
  sitemap.xml
  sitemaps/
    static.xml
    records-1.xml
    records-2.xml
```

The `sitemap.xml` file is a sitemap index pointing to the generated sitemap files. The `robots.txt` file points to the main `sitemap.xml`.

## Documentation

- [`architecture.md`](architecture.md)
- [`configuration.md`](configuration.md)
- [`commands.md`](commands.md)
- [`providers.md`](providers.md)
- [`usage.md`](usage.md)
- [`observability.md`](observability.md)
- [`repository-metadata.md`](repository-metadata.md)
