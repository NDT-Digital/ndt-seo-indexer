# Comandos

Este documento lista os comandos principais da CLI `nsi` e suas flags.

## Resumo geral

| Comando                        | Descrição                                                |
| ------------------------------ | -------------------------------------------------------- |
| `nsi --version`                | Mostra a versão da CLI a partir do `package.json`.       |
| `nsi -v`                       | Mostra a versão da CLI a partir do `package.json`.       |
| `nsi version`                  | Mostra a versão da CLI a partir do `package.json`.       |
| `nsi init`                     | Cria um arquivo local `nsi.config.json` de exemplo.      |
| `nsi project create <name>`    | Cria um projeto registrado no diretório do usuário.      |
| `nsi project list`             | Lista projetos registrados.                              |
| `nsi project use <name>`       | Define o projeto atual.                                  |
| `nsi project show [name]`      | Mostra os dados de um projeto.                           |
| `nsi project path [name]`      | Mostra o caminho do arquivo de configuração.             |
| `nsi project remove <name>`    | Remove um projeto do registro.                           |
| `nsi config home`              | Mostra o diretório de configuração do usuário.           |
| `nsi config global`            | Mostra o caminho do arquivo global.                      |
| `nsi config list`              | Mostra a configuração do projeto atual.                  |
| `nsi config get <key>`         | Lê uma chave da configuração do projeto.                 |
| `nsi config set <key> <value>` | Atualiza uma chave simples da configuração do projeto.   |
| `nsi validate`                 | Valida configuração, output e providers.                 |
| `nsi plan`                     | Exibe estimativas de URLs e arquivos.                    |
| `nsi generate`                 | Gera robots, sitemap index, sitemaps e logs da execução. |

## `nsi init`

Cria um arquivo local de configuração.

```bash
nsi init
```

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

| Flag                  | Descrição                                                        |
| --------------------- | ---------------------------------------------------------------- |
| `--site-url <url>`    | URL pública canônica do site.                                    |
| `--output-dir <path>` | Diretório onde os arquivos serão gerados.                        |
| `--from <path>`       | Cria o projeto a partir de um arquivo de configuração existente. |
| `--no-set-current`    | Não define o projeto criado como atual.                          |
| `--force`             | Sobrescreve o arquivo do projeto se ele já existir.              |

## `nsi validate`

```bash
nsi validate
```

| Flag                   | Descrição                  |
| ---------------------- | -------------------------- |
| `-c, --config <path>`  | Usa um arquivo local.      |
| `-p, --project <name>` | Usa um projeto registrado. |

## `nsi plan`

```bash
nsi plan
```

| Flag                   | Descrição                  |
| ---------------------- | -------------------------- |
| `-c, --config <path>`  | Usa um arquivo local.      |
| `-p, --project <name>` | Usa um projeto registrado. |

## `nsi generate`

```bash
nsi generate
```

| Flag                   | Descrição                                             |
| ---------------------- | ----------------------------------------------------- |
| `-c, --config <path>`  | Usa um arquivo local.                                 |
| `-p, --project <name>` | Usa um projeto registrado.                            |
| `-s, --sitemap <name>` | Gera apenas um sitemap específico.                    |
| `--dry-run`            | Simula geração sem escrever arquivos.                 |
| `--force`              | Ignora checkpoint incompleto e começa do zero.        |
| `--no-resume`          | Desabilita retomada automática apenas nessa execução. |

## `nsi config get <key>`

Lê uma chave usando dot notation.

```bash
nsi config get siteUrl
nsi config get output.directory
```

## `nsi config set <key> <value>`

Atualiza uma chave simples da configuração.

```bash
nsi config set siteUrl https://example.org
nsi config set output.directory ./dist/sitemaps
nsi config set limits.urlsPerSitemap 50000
```

Valores JSON são aceitos:

```bash
nsi config set output.clean true
```
