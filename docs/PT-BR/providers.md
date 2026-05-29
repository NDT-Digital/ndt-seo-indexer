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
  "batchSize": 50000,
  "urlPattern": "/records/:slug",
  "lastmodField": "updated_at",
  "source": {
    "connectionString": "postgres://user:password@localhost:5432/database",
    "fetchSize": 10000,
    "query": "SELECT slug, updated_at FROM seo_indexable_records ORDER BY slug",
    "countQuery": "SELECT COUNT(*) FROM seo_indexable_records"
  }
}
```

O provider usa cursor no PostgreSQL para evitar carregar todo o resultado em memória.

| Campo                 | Obrigatório | Descrição                                          |
| --------------------- | ----------- | -------------------------------------------------- |
| `connectionString`    | Não         | String de conexão direta.                          |
| `connectionStringEnv` | Não         | Nome da variável de ambiente que contém a conexão. |
| `query`               | Sim         | Query que retorna os registros.                    |
| `countQuery`          | Não         | Query para estimar total de registros.             |
| `fetchSize`           | Não         | Quantidade de linhas por fetch do cursor.          |

## Provider `csv`

Use para arquivos CSV com cabeçalho.

```json
{
  "name": "pages",
  "type": "csv",
  "filenamePattern": "sitemaps/pages-{page}.xml",
  "batchSize": 50000,
  "urlPattern": "/pages/:slug",
  "lastmodField": "updated_at",
  "source": {
    "file": "./pages.csv",
    "delimiter": ","
  }
}
```

## Provider `json`

Use para arquivos JSON.

```json
{
  "name": "pages",
  "type": "json",
  "filenamePattern": "sitemaps/pages-{page}.xml",
  "batchSize": 50000,
  "urlPattern": "/pages/:slug",
  "lastmodField": "updated_at",
  "source": {
    "file": "./pages.json",
    "itemsPath": "items"
  }
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
