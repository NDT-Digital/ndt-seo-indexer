# Architecture

**NDT SEO Indexer** is a CLI for large-scale sitemap generation. It is designed to stay independent from the products that consume the generated files.

The main product application keeps rendering public pages. The indexer only generates URL lists in XML and a `robots.txt` file to help search engines discover those pages.

## Overview

```txt
CLI
↓
Application use cases
↓
Domain contracts
↓
Providers
↓
XML/TXT writers
↓
Output writer
```

## Layers

### CLI

Receives commands such as `project create`, `validate`, `plan`, `generate`, and `version`.

The CLI does not contain XML generation rules. It parses arguments, resolves project/config files, and calls application use cases.

### Application

Contains the main flows:

- validate a project;
- plan generation;
- generate sitemaps;
- map data rows to URLs;
- coordinate checkpoints, observability, and output.

### Domain

Defines central contracts and types:

- `ProjectConfig`;
- `SitemapConfig`;
- `SitemapUrl`;
- `UrlProvider`;
- `OutputWriter`;
- `GenerationObserver`;
- `GenerationCheckpoint`.

### Infrastructure

Implements real file, database, and serialization access:

- configuration loading;
- local project registry;
- `static`, `postgres`, `csv`, and `json` providers;
- `filesystem` output;
- sitemap, sitemap index, and robots writers;
- JSONL logs;
- file-based checkpoints.

## Project registry

The indexer keeps a local registry in the user directory:

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

The global `nsi.config.json` file is the CLI registry, not the product sitemap configuration. Each project has its own complete configuration.

## Observability

The generation flow emits events such as `generation_started`, `sitemap_file_created`, `robots_created`, and `generation_completed`. Infrastructure adapters convert these events into JSONL logs and concise console output.

## Checkpoints

The application layer stores generation checkpoints per project. A checkpoint allows a long generation to resume from the last completed XML file. If the configuration changes or expected files are missing, the generation restarts safely.
