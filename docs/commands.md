# Commands

Este documento lista os comandos principais da CLI `nsi` e suas flags.

## Resumo geral

| Comando                        | Descrição                                              |
| ------------------------------ | ------------------------------------------------------ |
| `nsi init`                     | Cria um arquivo local `nsi.config.json` de exemplo.    |
| `nsi project create <name>`    | Cria um projeto registrado no diretório do usuário.    |
| `nsi project list`             | Lista projetos registrados.                            |
| `nsi project use <name>`       | Define o projeto atual.                                |
| `nsi project show [name]`      | Mostra os dados de um projeto.                         |
| `nsi project path [name]`      | Mostra o caminho do arquivo de configuração.           |
| `nsi project remove <name>`    | Remove um projeto do registro.                         |
| `nsi config home`              | Mostra o diretório de configuração do usuário.         |
| `nsi config global`            | Mostra o caminho do arquivo global.                    |
| `nsi config list`              | Mostra a configuração do projeto atual.                |
| `nsi config get <key>`         | Lê uma chave da configuração do projeto.               |
| `nsi config set <key> <value>` | Atualiza uma chave simples da configuração do projeto. |
| `nsi validate`                 | Valida configuração, output e providers.               |
| `nsi plan`                     | Exibe estimativas de URLs e arquivos.                  |
| `nsi generate`                 | Gera sitemap index, sitemaps e logs da execução.       |

## `nsi init`

Cria um arquivo local de configuração.

```bash
nsi init
```

### Flags

| Flag                  | Descrição                            | Padrão                |
| --------------------- | ------------------------------------ | --------------------- |
| `-o, --output <path>` | Caminho do arquivo gerado.           | `nsi.config.json`     |
| `--project <name>`    | Identificador do projeto no arquivo. | `example-project`     |
| `--site-url <url>`    | URL pública do site.                 | `https://example.com` |
| `--output-dir <path>` | Diretório de saída dos sitemaps.     | `./dist/sitemaps`     |

## `nsi project create <name>`

Cria um projeto registrado em `~/.ndt-seo-indexer/projects/<name>`.

```bash
nsi project create example --site-url https://example.com
```

### Flags

| Flag                  | Descrição                                                        |
| --------------------- | ---------------------------------------------------------------- |
| `--site-url <url>`    | URL pública canônica do site.                                    |
| `--output-dir <path>` | Diretório onde os XMLs serão gerados.                            |
| `--from <path>`       | Cria o projeto a partir de um arquivo de configuração existente. |
| `--no-set-current`    | Não define o projeto criado como atual.                          |
| `--force`             | Sobrescreve o arquivo do projeto se ele já existir.              |

## `nsi project list`

Lista os projetos registrados e marca o projeto atual com `*`.

```bash
nsi project list
```

## `nsi project use <name>`

Seleciona o projeto atual.

```bash
nsi project use example
```

Depois disso, comandos como `nsi generate` usam esse projeto automaticamente.

## `nsi project show [name]`

Mostra dados do projeto.

```bash
nsi project show
nsi project show example
```

## `nsi project path [name]`

Mostra o caminho do arquivo de configuração do projeto.

```bash
nsi project path
nsi project path example
```

## `nsi project remove <name>`

Remove um projeto do registro.

```bash
nsi project remove example
```

### Flags

| Flag             | Descrição                                                          |
| ---------------- | ------------------------------------------------------------------ |
| `--delete-files` | Também remove a pasta do projeto em `~/.ndt-seo-indexer/projects`. |

## `nsi config home`

Mostra o diretório base da CLI.

```bash
nsi config home
```

## `nsi config global`

Mostra o caminho do arquivo global.

```bash
nsi config global
```

## `nsi config list`

Mostra a configuração do projeto atual.

```bash
nsi config list
```

### Flags

| Flag                   | Descrição                                       |
| ---------------------- | ----------------------------------------------- |
| `-p, --project <name>` | Mostra a configuração de um projeto específico. |
| `--global`             | Mostra o registro global da CLI.                |

## `nsi config get <key>`

Lê uma chave usando dot notation.

```bash
nsi config get siteUrl
nsi config get output.directory
```

### Flags

| Flag                   | Descrição           |
| ---------------------- | ------------------- |
| `-p, --project <name>` | Projeto específico. |

## `nsi config set <key> <value>`

Atualiza uma chave simples da configuração.

```bash
nsi config set siteUrl https://example.org
nsi config set output.directory ./dist/sitemaps
nsi config set limits.urlsPerSitemap 20000
```

Valores JSON são aceitos:

```bash
nsi config set output.clean true
```

### Flags

| Flag                   | Descrição           |
| ---------------------- | ------------------- |
| `-p, --project <name>` | Projeto específico. |

## `nsi validate`

Valida a configuração carregada.

```bash
nsi validate
```

### Flags

| Flag                   | Descrição                  |
| ---------------------- | -------------------------- |
| `-c, --config <path>`  | Usa um arquivo local.      |
| `-p, --project <name>` | Usa um projeto registrado. |

## `nsi plan`

Mostra estimativas antes de gerar arquivos.

```bash
nsi plan
```

### Flags

| Flag                   | Descrição                  |
| ---------------------- | -------------------------- |
| `-c, --config <path>`  | Usa um arquivo local.      |
| `-p, --project <name>` | Usa um projeto registrado. |

## `nsi generate`

Gera os arquivos XML, cria um log JSONL da execução e mostra progresso resumido no terminal.

```bash
nsi generate
```

### Flags

| Flag                   | Descrição                               |
| ---------------------- | --------------------------------------- |
| `-c, --config <path>`  | Usa um arquivo local.                   |
| `-p, --project <name>` | Usa um projeto registrado.              |
| `-s, --sitemap <name>` | Gera somente um sitemap específico.     |
| `--dry-run`            | Simula a geração sem escrever arquivos. |

## Exemplos

Gerar tudo do projeto atual:

```bash
nsi generate
```

Gerar somente um sitemap:

```bash
nsi generate --sitemap records
```

Gerar por projeto:

```bash
nsi generate --project example
```

Gerar por arquivo local:

```bash
nsi generate --config ./configs/example.nsi.config.json
```
