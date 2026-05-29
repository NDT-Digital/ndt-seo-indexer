# NDT SEO Indexer

> Looking for English documentation? See [`docs/English/README.md`](docs/English/README.md).

CLI configurável da **NDT Digital** para gerar `sitemap.xml`, sitemap indexes, `robots.txt` e sitemaps XML em lote para projetos com SEO programático.

O objetivo do projeto é separar a geração de sitemaps da aplicação principal. A API ou front-end do produto continua responsável por renderizar as páginas públicas, enquanto o **NDT SEO Indexer** lê fontes configuradas, monta URLs públicas e grava arquivos prontos para publicação.

## Principais recursos

- CLI-first, com alias curto `nsi`.
- Registro local de múltiplos projetos em `~/.ndt-seo-indexer`.
- Configuração por projeto, sem depender obrigatoriamente de `.env`.
- Geração de sitemap index.
- Geração de sitemaps em lotes para grandes volumes de URLs.
- Geração de `robots.txt` apontando para o sitemap principal.
- Suporte inicial a providers `static`, `postgres`, `csv` e `json`.
- Output inicial em filesystem.
- PostgreSQL com leitura por cursor para grandes volumes.
- Logs JSONL por execução.
- Checkpoint para retomar uma geração interrompida.
- Comandos de `validate`, `plan`, `generate`, `project`, `config` e `version`.

## Instalação

Instalação global da CLI:

```bash
npm install -g @ndt-digital/seo-indexer
```

Depois use:

```bash
nsi --help
nsi --version
nsi project create example --site-url https://example.com
```

Também é possível instalar como dependência de desenvolvimento:

```bash
npm install -D @ndt-digital/seo-indexer
```

Uso via `npx`:

```bash
npx @ndt-digital/seo-indexer --help
```

Durante o desenvolvimento do próprio repositório:

```bash
npm install
npm run cli -- --help
```

## Conceito principal

O indexer gera arquivos. Ele não envia páginas ao Google e não substitui o Google Search Console.

Fluxo esperado:

```txt
Fonte de dados
↓
NDT SEO Indexer
↓
sitemap.xml + robots.txt + sitemaps/*.xml
↓
Arquivos publicados no site ou storage
↓
Buscadores descobrem as URLs pelo robots.txt, sitemap index ou Search Console
```

## Primeiro uso local

Crie um projeto registrado:

```bash
nsi project create example --site-url https://example.com
```

Isso cria uma estrutura no diretório do usuário:

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

Veja os projetos registrados:

```bash
nsi project list
```

Valide o projeto atual:

```bash
nsi validate
```

Veja o plano de geração:

```bash
nsi plan
```

Gere os arquivos:

```bash
nsi generate
```

## Uso com arquivo local

Também é possível usar um arquivo local sem registrar projeto:

```bash
nsi init
nsi validate --config nsi.config.json
nsi plan --config nsi.config.json
nsi generate --config nsi.config.json
```

## Configuração básica

Exemplo de configuração estática:

```json
{
  "project": "example",
  "siteUrl": "https://example.com",
  "output": {
    "driver": "filesystem",
    "directory": "./dist/sitemaps",
    "clean": true
  },
  "sitemapIndex": {
    "filename": "sitemap.xml"
  },
  "limits": {
    "urlsPerSitemap": 50000
  },
  "sitemaps": [
    {
      "name": "static",
      "type": "static",
      "filename": "sitemaps/static.xml",
      "urls": [
        { "path": "/", "priority": 1, "changefreq": "weekly" },
        { "path": "/about", "priority": 0.6, "changefreq": "monthly" }
      ]
    }
  ]
}
```

## Exemplo com PostgreSQL sem `.env`

Para não depender de `.env`, informe a conexão diretamente no arquivo de projeto:

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

Para ambientes em que você queira esconder a conexão, ainda é possível usar `connectionStringEnv`, mas isso é opcional.

## Arquivos gerados

Uma geração típica cria:

```txt
dist/sitemaps/
  robots.txt
  sitemap.xml
  sitemaps/
    static.xml
    records-1.xml
    records-2.xml
```

O arquivo `sitemap.xml` é um sitemap index que aponta para os demais arquivos. O `robots.txt` aponta para o `sitemap.xml` principal.

## Observabilidade

O comando `nsi generate` cria logs JSONL por execução, mostra progresso resumido no terminal e mantém um checkpoint do último arquivo concluído para retomar execuções interrompidas.

Por padrão, projetos registrados gravam logs em:

```txt
~/.ndt-seo-indexer/projects/<project>/logs/
```

A CLI registra início, conclusão, erros e cada arquivo de sitemap gerado. URLs individuais não são logadas para evitar arquivos gigantes.

Veja mais em [`docs/PT-BR/observability.md`](docs/PT-BR/observability.md).

## Comandos principais

| Comando                        | Uso                                                     |
| ------------------------------ | ------------------------------------------------------- |
| `nsi --version`                | Mostra a versão da CLI.                                 |
| `nsi -v`                       | Mostra a versão da CLI.                                 |
| `nsi version`                  | Mostra a versão da CLI.                                 |
| `nsi init`                     | Cria um `nsi.config.json` local de exemplo.             |
| `nsi project create <name>`    | Cria um projeto registrado no diretório do usuário.     |
| `nsi project list`             | Lista projetos registrados.                             |
| `nsi project use <name>`       | Define o projeto atual.                                 |
| `nsi project show [name]`      | Mostra dados de um projeto registrado.                  |
| `nsi project path [name]`      | Mostra o caminho do arquivo de configuração do projeto. |
| `nsi project remove <name>`    | Remove um projeto do registro.                          |
| `nsi config list`              | Mostra a configuração do projeto atual.                 |
| `nsi config get <key>`         | Lê um valor da configuração do projeto.                 |
| `nsi config set <key> <value>` | Atualiza um valor simples da configuração do projeto.   |
| `nsi validate`                 | Valida configuração, output e providers.                |
| `nsi plan`                     | Exibe estimativa de URLs e arquivos.                    |
| `nsi generate`                 | Gera sitemaps, sitemap index, robots e logs.            |

## Documentação

- [`docs/PT-BR/architecture.md`](docs/PT-BR/architecture.md)
- [`docs/PT-BR/configuration.md`](docs/PT-BR/configuration.md)
- [`docs/PT-BR/commands.md`](docs/PT-BR/commands.md)
- [`docs/PT-BR/providers.md`](docs/PT-BR/providers.md)
- [`docs/PT-BR/usage.md`](docs/PT-BR/usage.md)
- [`docs/PT-BR/observability.md`](docs/PT-BR/observability.md)
- [`docs/PT-BR/repository-metadata.md`](docs/PT-BR/repository-metadata.md)

## Desenvolvimento

```bash
npm install
npm run check
npm test
npm run cli -- --help
```

## Licença

MIT
