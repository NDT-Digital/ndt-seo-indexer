# Observabilidade e logs

O NDT SEO Indexer possui uma camada simples de observabilidade para acompanhar execuções longas de `generate` sem poluir o terminal e sem criar arquivos de log excessivos.

## Objetivo

A geração de sitemaps em escala pode criar centenas ou milhares de arquivos XML. Por isso, a CLI registra eventos relevantes da execução, mas não registra cada URL individual nem cada linha lida do provider.

## Logs em JSONL

Cada execução do comando `nsi generate` cria um arquivo JSONL dentro da pasta `logs` do projeto.

Para projetos registrados, a estrutura padrão fica assim:

```txt
~/.ndt-seo-indexer/projects/<project>/
  <project>.nsi.config.json
  dist/
  logs/
    generate-2026-05-29T22-30-15-123Z-a8f31c.jsonl
```

Quando o projeto usa um arquivo local, a pasta `logs` é criada ao lado do diretório configurado em `output.directory`.

JSONL significa que cada linha do arquivo é um JSON independente. Isso facilita leitura manual, auditoria e processamento posterior por scripts.

## Eventos registrados

A CLI registra eventos de alto nível:

| Evento                  | Descrição                                    |
| ----------------------- | -------------------------------------------- |
| `generation_started`    | Início da execução de geração.               |
| `sitemap_started`       | Início da geração de um sitemap configurado. |
| `sitemap_file_created`  | Arquivo XML de sitemap criado.               |
| `sitemap_completed`     | Conclusão de um sitemap configurado.         |
| `sitemap_index_created` | Criação do sitemap index principal.          |
| `generation_completed`  | Conclusão geral da geração.                  |
| `generation_failed`     | Falha geral da geração.                      |

A CLI não registra:

- cada URL processada;
- cada linha retornada pelo banco;
- cada lote interno de leitura do provider.

## Exemplo de log

```json
{
  "timestamp": "2026-05-29T22:31:02.421Z",
  "runId": "a8f31c",
  "project": "example",
  "event": "sitemap_file_created",
  "level": "info",
  "sitemap": "records",
  "file": "sitemaps/records-42.xml",
  "fileIndex": 42,
  "totalFiles": 1427,
  "urlCount": 50000,
  "totalUrlsProcessed": 2100000,
  "fileSizeBytes": 7342210,
  "totalBytesWritten": 308372820,
  "dryRun": false
}
```

## Console durante a execução

O console mostra uma visualização resumida e legível, com progresso atualizado em linha única quando o terminal suporta isso.

Exemplo:

```txt
[22:30:15] NSI generate started · project=example · sitemaps=records · output=./dist/sitemaps
[22:30:16] Sitemap started · records · batch=50000 · files=1427
[22:31:02] records · files=42/1427 · 2.9% · urls=2.100.000 · size=294 MB · estimated=10.1 GB · latest=sitemaps/records-42.xml
[23:10:44] Sitemap index created · sitemap.xml · files=1427
[23:10:44] Generate completed · urls=71.314.047 · files=1428 · size=10.4 GB · duration=40m 19s
```

O console não imprime uma linha por URL e evita listar todos os arquivos ao final quando a geração possui muitos sitemaps.

## Configuração

A seção `logging` é opcional. Quando omitida, a CLI usa os padrões automáticos.

```json
{
  "logging": {
    "enabled": true,
    "directory": "C:\\Users\\user\\.ndt-seo-indexer\\projects\\example\\logs",
    "logGeneratedFiles": true,
    "console": {
      "enabled": true,
      "useColors": true,
      "singleLineProgress": true
    }
  }
}
```

| Campo                                | Descrição                                          |
| ------------------------------------ | -------------------------------------------------- |
| `logging.enabled`                    | Habilita ou desabilita logs em arquivo.            |
| `logging.directory`                  | Diretório opcional para salvar os arquivos JSONL.  |
| `logging.logGeneratedFiles`          | Reservado para controlar logs por arquivo gerado.  |
| `logging.console.enabled`            | Habilita ou desabilita saída visual no terminal.   |
| `logging.console.useColors`          | Controla uso de cores ANSI no terminal.            |
| `logging.console.singleLineProgress` | Atualiza progresso na mesma linha quando possível. |

## Boas práticas

- Não commitar arquivos da pasta `logs`.
- Usar os logs JSONL para auditoria de execuções grandes.
- Usar o console para acompanhamento em tempo real.
- Em execuções muito grandes, preferir analisar o arquivo JSONL final em vez de depender do histórico do terminal.
