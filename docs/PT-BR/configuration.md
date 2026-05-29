# Configuração

Por padrão, a CLI pode trabalhar com um projeto registrado ou com um arquivo local.

Arquivo local padrão:

```txt
nsi.config.json
```

Também é possível informar outro arquivo:

```bash
nsi generate --config ./configs/example.nsi.config.json
```

## Campos raiz

| Campo                   | Descrição                                                       |
| ----------------------- | --------------------------------------------------------------- |
| `project`               | Identificador do projeto usado em logs e mensagens.             |
| `siteUrl`               | URL pública canônica do site.                                   |
| `output`                | Configuração do driver de saída.                                |
| `sitemapIndex.filename` | Nome do sitemap index. Padrão: `sitemap.xml`.                   |
| `limits.urlsPerSitemap` | Limite padrão de URLs por sitemap. Padrão recomendado: `50000`. |
| `logging`               | Configuração opcional de logs e console.                        |
| `sitemaps`              | Lista de definições de sitemap.                                 |

## Output filesystem

```json
{
  "output": {
    "driver": "filesystem",
    "directory": "./dist/sitemaps",
    "clean": true
  }
}
```

| Campo       | Descrição                                          |
| ----------- | -------------------------------------------------- |
| `driver`    | Atualmente apenas `filesystem`.                    |
| `directory` | Diretório onde os arquivos serão gerados.          |
| `clean`     | Remove a pasta de saída antes de uma geração nova. |

## Mapeamento de URLs

Uma linha pode fornecer uma URL absoluta:

```json
{ "loc": "https://example.com/page" }
```

Ou um path relativo:

```json
{ "path": "/page" }
```

Ou campos usados por `urlPattern`:

```json
{
  "urlPattern": "/records/:slug"
}
```

Com uma linha:

```json
{ "slug": "first-record" }
```

A URL gerada será:

```txt
https://example.com/records/first-record
```

## Provider PostgreSQL

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

O provider usa cursor no PostgreSQL para evitar carregar todo o resultado em memória.

## `batchSize` e `fetchSize`

| Campo       | Função                                                           |
| ----------- | ---------------------------------------------------------------- |
| `batchSize` | Quantas URLs entram em cada sitemap XML. Não ultrapasse `50000`. |
| `fetchSize` | Quantas linhas o PostgreSQL entrega por vez ao provider.         |

Para grandes bases, uma configuração comum é:

```json
{
  "batchSize": 50000,
  "source": {
    "fetchSize": 10000
  }
}
```

## Logging

A seção `logging` é opcional. Quando omitida, a CLI usa padrões seguros.

```json
{
  "logging": {
    "enabled": true,
    "logGeneratedFiles": true,
    "console": {
      "enabled": true,
      "useColors": true,
      "singleLineProgress": true
    }
  }
}
```

## Arquivos gerados

A geração completa cria:

```txt
robots.txt
sitemap.xml
sitemaps/static.xml
sitemaps/records-1.xml
sitemaps/records-2.xml
```

O `robots.txt` aponta para o `sitemap.xml`. O `sitemap.xml` aponta para os sitemaps gerados.
