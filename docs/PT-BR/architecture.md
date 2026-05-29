# Arquitetura

O **NDT SEO Indexer** é uma CLI para geração de sitemaps em escala. Ele foi desenhado para ser independente dos produtos que consomem os arquivos gerados.

A aplicação principal de cada produto continua responsável por renderizar as páginas públicas. O indexer apenas gera a lista de URLs em XML e o `robots.txt` para facilitar a descoberta por mecanismos de busca.

## Visão geral

```txt
CLI
↓
Application use cases
↓
Domain contracts
↓
Providers
↓
Writers de XML/TXT
↓
Output writer
```

## Camadas

### CLI

Recebe comandos como `project create`, `validate`, `plan`, `generate` e `version`.

A CLI não contém regras de geração de XML. Ela interpreta argumentos, resolve o projeto/configuração e chama os casos de uso da aplicação.

### Application

Contém os fluxos principais:

- validar projeto;
- planejar geração;
- gerar sitemaps;
- mapear linhas de dados para URLs;
- coordenar checkpoint, observabilidade e output.

### Domain

Define contratos e tipos centrais:

- `ProjectConfig`;
- `SitemapConfig`;
- `SitemapUrl`;
- `UrlProvider`;
- `OutputWriter`;
- `GenerationObserver`;
- `GenerationCheckpoint`.

### Infrastructure

Implementa acesso real a arquivos, banco e serialização:

- carregamento de configuração;
- registro local de projetos;
- providers `static`, `postgres`, `csv` e `json`;
- output `filesystem`;
- escrita de sitemap, sitemap index e robots;
- logs JSONL;
- checkpoint em arquivo.

## Registro local de projetos

O indexer mantém um registro local no diretório do usuário:

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

O arquivo global `nsi.config.json` é o registro da CLI, não o sitemap do produto. Cada projeto tem sua própria configuração completa.

## Providers

Providers são fontes de linhas que serão convertidas em URLs. A camada principal não precisa saber se os dados vieram de PostgreSQL, CSV, JSON ou configuração estática.

Providers iniciais:

- `static`;
- `postgres`;
- `csv`;
- `json`.

## Outputs

O primeiro output é `filesystem`.

Ele grava arquivos como:

```txt
robots.txt
sitemap.xml
sitemaps/static.xml
sitemaps/records-1.xml
sitemaps/records-2.xml
```

Futuramente podem existir outputs como S3, Cloudflare R2 e MinIO sem alterar o fluxo principal.

## Observabilidade

A geração possui uma camada de observabilidade separada do core. O caso de uso emite eventos como `generation_started`, `sitemap_file_created`, `robots_created` e `generation_completed`. Adaptadores de infraestrutura transformam esses eventos em logs JSONL e visualização resumida no console.

## Checkpoints

A camada de aplicação registra checkpoints de geração por projeto. O checkpoint fica separado do log JSONL e permite retomar uma execução interrompida a partir do último arquivo XML concluído. Se a configuração mudar ou os arquivos esperados não existirem, a execução reinicia do zero sem travar a CLI.
