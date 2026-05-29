# Architecture

O **NDT SEO Indexer** é uma CLI para geração de sitemaps em escala. Ele foi desenhado para ser independente dos produtos que consomem os arquivos gerados.

A aplicação principal de cada produto continua responsável por renderizar as páginas públicas. O indexer apenas gera a lista de URLs em XML para facilitar a descoberta por mecanismos de busca.

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
Sitemap writer
↓
Output writer
```

## Camadas

### CLI

Recebe comandos como `project create`, `validate`, `plan` e `generate`.

A CLI não contém regras de geração de XML. Ela apenas interpreta argumentos e chama casos de uso da aplicação.

### Application

Contém os fluxos principais:

- validar projeto;
- planejar geração;
- gerar sitemaps;
- mapear linhas de dados para URLs.

### Domain

Define contratos e tipos centrais:

- `ProjectConfig`;
- `SitemapConfig`;
- `SitemapUrl`;
- `UrlProvider`;
- `OutputWriter`.

### Infrastructure

Implementa acesso real a arquivos, banco e XML:

- carregamento de configuração;
- registro local de projetos;
- providers `static`, `postgres`, `csv` e `json`;
- output `filesystem`;
- escrita de sitemap e sitemap index.

## Registro local de projetos

O indexer mantém um registro local no diretório do usuário:

```txt
~/.ndt-seo-indexer/
  nsi.config.json
  projects/
    example/
      example.nsi.config.json
      dist/
```

O arquivo global `nsi.config.json` não é o arquivo de sitemap do produto. Ele é o registro da CLI, contendo:

```json
{
  "version": 1,
  "currentProject": "example",
  "projects": [
    {
      "name": "example",
      "configPath": "/home/user/.ndt-seo-indexer/projects/example/example.nsi.config.json",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

Cada projeto tem sua própria configuração completa.

## Por que ter um registro de projetos?

Porque a NDT Digital pode ter vários sistemas com SEO programático:

```txt
project-a
project-b
project-c
```

Com o registro local, você pode alternar o projeto atual:

```bash
nsi project use project-a
nsi generate
```

Ou executar diretamente:

```bash
nsi generate --project project-b
```

## Providers

Providers são fontes de URLs.

A camada principal não precisa saber se os dados vieram de PostgreSQL, CSV, JSON ou configuração estática. Ela só recebe linhas e transforma em URLs.

Providers iniciais:

- `static`;
- `postgres`;
- `csv`;
- `json`.

## Outputs

O primeiro output é `filesystem`.

Ele grava arquivos como:

```txt
sitemap.xml
sitemaps/static.xml
sitemaps/records-1.xml
sitemaps/records-2.xml
```

Futuramente podem existir outputs como S3, Cloudflare R2 e MinIO sem alterar o fluxo principal.

## Responsabilidade do indexer

O indexer deve:

- carregar configuração;
- ler fontes de dados;
- montar URLs;
- dividir em lotes;
- gerar XML;
- gravar arquivos.

O indexer não deve:

- decidir sozinho regras comerciais complexas;
- substituir APIs de produto;
- enviar páginas automaticamente para o Google;
- garantir indexação.

## Recomendação para grandes bases

Para bases grandes, não é recomendado ler dados brutos sem filtro de qualidade.

O ideal é que o produto mantenha uma tabela ou fonte intermediária com URLs indexáveis, por exemplo:

```txt
seo_indexable_records
```

Essa tabela deve conter apenas registros que realmente podem virar páginas públicas úteis.

## Observabilidade

A geração possui uma camada de observabilidade separada do core. O caso de uso emite eventos de domínio da execução, como `generation_started`, `sitemap_file_created` e `generation_completed`. Adaptadores de infraestrutura transformam esses eventos em logs JSONL e visualização resumida no console.

Essa separação mantém o fluxo de geração desacoplado do formato de log, permitindo adicionar novos destinos futuramente sem alterar as regras centrais de geração de sitemaps.

## Checkpoints

A camada de aplicação registra checkpoints de geração por projeto. O checkpoint fica separado do log JSONL e permite retomar uma execução interrompida a partir do último arquivo XML concluído. Se a configuração mudar ou os arquivos esperados não existirem, a execução reinicia do zero sem travar a CLI.
