# Providers

Providers são fontes de linhas que serão convertidas em URLs de sitemap.

A camada principal da aplicação não sabe se os dados vieram de PostgreSQL, CSV, JSON ou configuração estática. Ela só recebe linhas e aplica o mapeamento configurado.

## Provider `static`

Use para páginas fixas.

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

## Provider `postgres`

Use para grandes volumes vindos de PostgreSQL.

```json
{
  "name": "records",
  "type": "postgres",
  "filenamePattern": "sitemaps/records-{page}.xml",
  "batchSize": 40000,
  "urlPattern": "/records/:slug",
  "lastmodField": "updated_at",
  "source": {
    "connectionString": "postgres://user:password@localhost:5432/database",
    "fetchSize": 5000,
    "query": "SELECT slug, updated_at FROM seo_indexable_records WHERE is_indexable = true ORDER BY slug",
    "countQuery": "SELECT COUNT(*) FROM seo_indexable_records WHERE is_indexable = true"
  }
}
```

O provider usa cursor no PostgreSQL para evitar carregar todo o resultado em memória.

### Campos do source PostgreSQL

| Campo                 | Obrigatório | Descrição                                          |
| --------------------- | ----------- | -------------------------------------------------- |
| `connectionString`    | Não         | String de conexão direta.                          |
| `connectionStringEnv` | Não         | Nome da variável de ambiente que contém a conexão. |
| `query`               | Sim         | Query que retorna os registros.                    |
| `countQuery`          | Não         | Query para estimar total de registros.             |
| `fetchSize`           | Não         | Quantidade de linhas por fetch do cursor.          |

Use `connectionString` se quiser que tudo esteja no arquivo de configuração. Use `connectionStringEnv` se quiser esconder credenciais fora do arquivo.

## Provider `csv`

Use para arquivos CSV com cabeçalho.

```json
{
  "name": "pages",
  "type": "csv",
  "filenamePattern": "sitemaps/pages-{page}.xml",
  "batchSize": 40000,
  "urlPattern": "/pages/:slug",
  "lastmodField": "updated_at",
  "source": {
    "file": "./pages.csv",
    "delimiter": ","
  }
}
```

Exemplo de CSV:

```csv
slug,updated_at
first-page,2026-01-01T00:00:00.000Z
second-page,2026-01-02T00:00:00.000Z
```

## Provider `json`

Use para arquivos JSON.

```json
{
  "name": "pages",
  "type": "json",
  "filenamePattern": "sitemaps/pages-{page}.xml",
  "batchSize": 40000,
  "urlPattern": "/pages/:slug",
  "lastmodField": "updated_at",
  "source": {
    "file": "./pages.json",
    "itemsPath": "items"
  }
}
```

Exemplo de JSON:

```json
{
  "items": [
    { "slug": "first-page", "updated_at": "2026-01-01T00:00:00.000Z" },
    { "slug": "second-page", "updated_at": "2026-01-02T00:00:00.000Z" }
  ]
}
```

## Padrão de linha

Cada linha pode retornar:

| Campo                               | Função                         |
| ----------------------------------- | ------------------------------ |
| `loc`                               | URL absoluta pronta.           |
| `path`                              | Caminho relativo ao `siteUrl`. |
| campos do `urlPattern`              | Valores substituídos na URL.   |
| campo definido em `lastmodField`    | Valor usado em `<lastmod>`.    |
| campo definido em `changefreqField` | Valor usado em `<changefreq>`. |
| campo definido em `priorityField`   | Valor usado em `<priority>`.   |

## Recomendação para bases grandes

Para bases grandes, prefira uma tabela intermediária de SEO, com registros já filtrados e prontos para indexação.

Exemplo:

```txt
seo_indexable_records
```

Campos sugeridos:

```txt
slug
updated_at
is_indexable
priority
source
created_at
```

Isso evita gerar sitemaps para páginas fracas, duplicadas ou sem valor para busca.
