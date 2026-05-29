# Commands

This document lists the main `nsi` CLI commands and flags.

## Summary

| Command                        | Description                                          |
| ------------------------------ | ---------------------------------------------------- |
| `nsi --version`                | Shows the CLI version from `package.json`.           |
| `nsi -v`                       | Shows the CLI version from `package.json`.           |
| `nsi version`                  | Shows the CLI version from `package.json`.           |
| `nsi init`                     | Creates a local sample `nsi.config.json`.            |
| `nsi project create <name>`    | Creates a registered project in the user directory.  |
| `nsi project list`             | Lists registered projects.                           |
| `nsi project use <name>`       | Sets the current project.                            |
| `nsi project show [name]`      | Shows project data.                                  |
| `nsi project path [name]`      | Shows the project config path.                       |
| `nsi project remove <name>`    | Removes a project from the registry.                 |
| `nsi config home`              | Shows the CLI home directory.                        |
| `nsi config global`            | Shows the global registry file path.                 |
| `nsi config list`              | Shows the current project configuration.             |
| `nsi config get <key>`         | Reads a project config key.                          |
| `nsi config set <key> <value>` | Updates a simple project config key.                 |
| `nsi validate`                 | Validates configuration, output, and providers.      |
| `nsi plan`                     | Shows URL and file estimates.                        |
| `nsi generate`                 | Generates robots, sitemap index, sitemaps, and logs. |

## Generate flags

| Flag                   | Description                                            |
| ---------------------- | ------------------------------------------------------ |
| `-c, --config <path>`  | Uses a local config file.                              |
| `-p, --project <name>` | Uses a registered project.                             |
| `-s, --sitemap <name>` | Generates only one sitemap by name.                    |
| `--dry-run`            | Simulates generation without writing files.            |
| `--force`              | Ignores an incomplete checkpoint and starts from zero. |
| `--no-resume`          | Disables checkpoint resume for this execution.         |
