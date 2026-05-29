# Usage

This guide shows a complete local workflow.

## 1. Create a registered project

```bash
nsi project create example --site-url https://example.com
```

The CLI creates:

```txt
~/.ndt-seo-indexer/projects/example/example.nsi.config.json
```

## 2. Validate, plan, and generate

```bash
nsi validate
nsi plan
nsi generate
```

## 3. Edit simple fields through the CLI

```bash
nsi config set siteUrl https://example.org
nsi config set output.directory ./dist/generated-sitemaps
nsi config set limits.urlsPerSitemap 50000
```

For larger changes, such as adding providers, edit the JSON file directly.

## 4. Dry run

```bash
nsi generate --dry-run
```

## 5. Generate one sitemap

```bash
nsi generate --sitemap static
```

## 6. Use without global registry

```bash
nsi init --project local-example --site-url https://example.com
nsi validate --config nsi.config.json
nsi plan --config nsi.config.json
nsi generate --config nsi.config.json
```

## Final result

Generated files must be published by the site, proxy, or storage.

Example:

```txt
https://example.com/robots.txt
https://example.com/sitemap.xml
https://example.com/sitemaps/static.xml
https://example.com/sitemaps/records-1.xml
```

Submit the main `sitemap.xml` in Google Search Console.

## Resume interrupted generation

If `nsi generate` is interrupted during a large generation, run the same command again. The CLI validates the project checkpoint and continues from the next pending file.

To start from zero:

```bash
nsi generate --force
```
