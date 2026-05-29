# NDT SEO Indexer

CLI configurável da **NDT Digital** para gerar `sitemap.xml`, sitemap indexes e arquivos XML em lote para projetos com SEO programático.

O objetivo do projeto é separar a geração de sitemaps da aplicação principal. A API do produto continua responsável pelos dados de negócio, enquanto o **NDT SEO Indexer** lê fontes configuradas, monta URLs públicas e grava arquivos XML prontos para publicação.

## Principais recursos

- CLI-first, com alias curto `nsi`.
- Registro local de múltiplos projetos em `~/.ndt-seo-indexer`.
- Configuração por projeto, sem depender obrigatoriamente de `.env`.
- Geração de sitemap index.
- Geração de sitemaps em lotes.
- Suporte inicial a providers `static`, `postgres`, `csv` e `json`.
- Output inicial em filesystem.
- PostgreSQL com leitura por cursor para grandes volumes.
- Comandos de `validate`, `plan`, `generate`, `project` e `config`.
- Uso local por NPM, sem exigência inicial de Docker ou cron.

## Instalação

Como dependência de desenvolvimento em um projeto:

```bash
npm install -D @ndt-digital/seo-indexer
```

Uso via binário publicado:

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
sitemap.xml + sitemaps/*.xml
↓
Arquivos publicados no site ou storage
↓
Google lê pelo robots.txt/Search Console
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
    "urlsPerSitemap": 40000
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
  "batchSize": 40000,
  "urlPattern": "/records/:slug",
  "lastmodField": "updated_at",
  "defaultChangefreq": "weekly",
  "defaultPriority": 0.8,
  "source": {
    "connectionString": "postgres://user:password@localhost:5432/database",
    "fetchSize": 5000,
    "query": "SELECT slug, updated_at FROM seo_indexable_records WHERE is_indexable = true ORDER BY slug",
    "countQuery": "SELECT COUNT(*) FROM seo_indexable_records WHERE is_indexable = true"
  }
}
```

Para ambientes em que você queira esconder a conexão, ainda é possível usar `connectionStringEnv`, mas isso é opcional.

## Estrutura de saída

Uma geração típica cria:

```txt
dist/sitemaps/
  sitemap.xml
  sitemaps/
    static.xml
    records-1.xml
    records-2.xml
```

O arquivo `sitemap.xml` é um sitemap index que aponta para os demais arquivos.

## Comandos principais

| Comando                        | Uso                                                     |
| ------------------------------ | ------------------------------------------------------- |
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
| `nsi generate`                 | Gera os sitemaps.                                       |

## Desenvolvimento

```bash
npm install
npm run check
npm test
npm run cli -- --help
```

## Documentação

- `docs/architecture.md`
- `docs/configuration.md`
- `docs/commands.md`
- `docs/providers.md`
- `docs/usage.md`

## Licença

MIT
