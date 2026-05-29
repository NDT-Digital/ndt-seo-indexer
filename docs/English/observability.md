# Observability

`nsi generate` includes initial observability with JSONL logs, console progress, and per-project checkpoints.

## JSONL logs

Each execution creates a `.jsonl` file inside the project logs directory:

```txt
~/.ndt-seo-indexer/projects/<project>/logs/
```

Each line is an independent JSON event.

## Main events

| Event                             | Description                                          |
| --------------------------------- | ---------------------------------------------------- |
| `generation_started`              | Generation started.                                  |
| `generation_resumed`              | Generation resumed from checkpoint.                  |
| `generation_checkpoint_restarted` | Invalid checkpoint ignored and generation restarted. |
| `sitemap_started`                 | A configured sitemap started.                        |
| `sitemap_file_created`            | A sitemap XML file was generated.                    |
| `sitemap_completed`               | A configured sitemap completed.                      |
| `sitemap_index_created`           | Sitemap index generated.                             |
| `robots_created`                  | `robots.txt` generated.                              |
| `generation_completed`            | Generation completed.                                |
| `generation_failed`               | A failure interrupted generation.                    |

Individual URLs are not logged.

## Checkpoints

The checkpoint file is stored at:

```txt
~/.ndt-seo-indexer/projects/<project>/checkpoints/generate-state.json
```

Use `--force` to ignore it and start from zero.
