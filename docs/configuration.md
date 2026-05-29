# Configuration

O NDT SEO Indexer aceita dois modos de configuração:

1. arquivo local passado por `--config`;
2. projeto registrado no diretório do usuário.

## Arquivo local

O modo mais simples é criar um arquivo local:

```bash
nsi init
```

Isso cria:

```txt
nsi.config.json
```

Depois você pode executar:

```bash
nsi validate --config nsi.config.json
nsi plan --config nsi.config.json
nsi generate --config nsi.config.json
```

## Projeto registrado

Para trabalhar com múltiplos projetos, use:

```bash
nsi project create example --site-url https://example.com
```

A CLI cria:

```txt
~/.ndt-seo-indexer/
  nsi.config.json
  projects/
    example/
      example.nsi.config.json
      dist/
```

Depois, os comandos podem ser executados sem `--config`:

```bash
nsi validate
nsi plan
nsi generate
```

Ou apontando para um projeto específico:

```bash
nsi generate --project example
```

## Prioridade de carregamento

Quando você executa `validate`, `plan` ou `generate`, a CLI procura a configuração nesta ordem:

1. `--config <path>`;
2. `--project <name>`;
3. projeto atual salvo em `~/.ndt-seo-indexer/nsi.config.json`;
4. arquivo local `nsi.config.json`, se existir.

## Campos raiz

| Campo                   | Obrigatório | Descrição                                           |
| ----------------------- | ----------- | --------------------------------------------------- |
| `project`               | Sim         | Identificador do projeto usado nos logs.            |
| `siteUrl`               | Sim         | URL pública canônica do site.                       |
| `output`                | Sim         | Configuração de saída dos arquivos.                 |
| `sitemapIndex.filename` | Não         | Nome do sitemap index. Padrão: `sitemap.xml`.       |
| `limits.urlsPerSitemap` | Não         | Limite padrão de URLs por sitemap. Padrão: `40000`. |
| `sitemaps`              | Sim         | Lista de definições de sitemap.                     |

## Output

Nesta versão, o driver suportado é `filesystem`.

```json
{
  "output": {
    "driver": "filesystem",
    "directory": "./dist/sitemaps",
    "clean": true
  }
}
```

| Campo       | Descrição                                      |
| ----------- | ---------------------------------------------- |
| `driver`    | Driver de saída. Nesta versão: `filesystem`.   |
| `directory` | Diretório onde os arquivos serão gravados.     |
| `clean`     | Se `true`, limpa o diretório antes da geração. |

## Sitemap estático

```json
{
  "name": "static",
  "type": "static",
  "filename": "sitemaps/static.xml",
  "urls": [
    { "path": "/", "priority": 1, "changefreq": "weekly" },
    { "path": "/about", "priority": 0.6, "changefreq": "monthly" }
  ]
}
```

## Sitemap PostgreSQL

Com conexão dentro do arquivo:

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

Com variável de ambiente, opcionalmente:

```json
{
  "source": {
    "connectionStringEnv": "DATABASE_URL",
    "query": "SELECT slug, updated_at FROM seo_indexable_records ORDER BY slug"
  }
}
```

O uso de `connectionStringEnv` é opcional. Para um fluxo totalmente configurável pelo arquivo, use `connectionString`.

## Mapeamento de URL

Uma linha pode fornecer `loc` completo:

```json
{ "loc": "https://example.com/page" }
```

Ou pode fornecer `path`:

```json
{ "path": "/page" }
```

Ou pode usar `urlPattern`:

```json
{
  "urlPattern": "/records/:slug"
}
```

Com uma linha:

```json
{ "slug": "abc-123" }
```

A URL gerada será:

```txt
https://example.com/records/abc-123
```

## Campos de data, frequência e prioridade

| Campo               | Descrição                                       |
| ------------------- | ----------------------------------------------- |
| `lastmodField`      | Nome do campo da linha usado como `lastmod`.    |
| `changefreqField`   | Nome do campo da linha usado como `changefreq`. |
| `priorityField`     | Nome do campo da linha usado como `priority`.   |
| `defaultChangefreq` | Frequência padrão quando a linha não informar.  |
| `defaultPriority`   | Prioridade padrão quando a linha não informar.  |

## Alterando configurações via CLI

Ler uma chave:

```bash
nsi config get siteUrl
```

Alterar uma chave:

```bash
nsi config set siteUrl https://example.org
```

Alterar diretório de saída:

```bash
nsi config set output.directory ./dist/generated-sitemaps
```

Valores JSON também são aceitos:

```bash
nsi config set limits.urlsPerSitemap 20000
nsi config set output.clean true
```

Para alterações grandes, como editar a lista de `sitemaps`, recomenda-se abrir o arquivo diretamente:

```bash
nsi project path
```
