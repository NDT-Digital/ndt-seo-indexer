# Observabilidade

O `nsi generate` possui observabilidade inicial com logs JSONL, progresso no console e checkpoints por projeto.

## Logs JSONL

Cada execução cria um arquivo `.jsonl` dentro da pasta do projeto:

```txt
~/.ndt-seo-indexer/projects/<project>/logs/
```

Exemplo:

```txt
generate-2026-05-29T22-30-15-123Z-a8f31c.jsonl
```

Cada linha é um evento JSON independente.

## Eventos principais

| Evento                            | Descrição                                               |
| --------------------------------- | ------------------------------------------------------- |
| `generation_started`              | Início da geração.                                      |
| `generation_resumed`              | Execução retomada a partir de checkpoint.               |
| `generation_checkpoint_restarted` | Checkpoint inválido foi ignorado e a geração reiniciou. |
| `sitemap_started`                 | Início de um sitemap configurado.                       |
| `sitemap_file_created`            | Arquivo XML de sitemap gerado.                          |
| `sitemap_completed`               | Sitemap configurado concluído.                          |
| `sitemap_index_created`           | Sitemap index gerado.                                   |
| `robots_created`                  | `robots.txt` gerado.                                    |
| `generation_completed`            | Geração concluída.                                      |
| `generation_failed`               | Erro que interrompeu a geração.                         |

URLs individuais não são logadas para evitar arquivos gigantes.

## Console

O console mostra progresso resumido, sem imprimir uma linha por URL.

Exemplo:

```txt
[22:30:15] NSI generate started · project=example · sitemaps=records · output=./dist/sitemaps
[22:30:16] Sitemap started · records · batch=50000 · files=1427
[22:31:02] records · files=42/1427 · 2.9% · urls=2.100.000 · size=294 MB · estimated=10.1 GB · latest=sitemaps/records-42.xml
[23:10:44] Sitemap index created · sitemap.xml · files=1427
[23:10:44] Robots created · robots.txt · sitemap=sitemap.xml
[23:10:44] Generate completed · urls=71.314.047 · files=1429 · size=10.4 GB · duration=40m 19s
```

## Checkpoints

O checkpoint fica em:

```txt
~/.ndt-seo-indexer/projects/<project>/checkpoints/generate-state.json
```

Ele permite continuar a geração a partir do último arquivo concluído.

Use `--force` para ignorar checkpoint e começar do zero:

```bash
nsi generate --force
```

Use `--no-resume` para desativar retomada apenas naquela execução:

```bash
nsi generate --no-resume
```

## Configuração

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

| Campo                                | Descrição                                          |
| ------------------------------------ | -------------------------------------------------- |
| `logging.enabled`                    | Habilita ou desabilita logs em arquivo.            |
| `logging.directory`                  | Diretório opcional para salvar logs JSONL.         |
| `logging.logGeneratedFiles`          | Reservado para controlar logs por arquivo gerado.  |
| `logging.console.enabled`            | Habilita ou desabilita saída visual no terminal.   |
| `logging.console.useColors`          | Controla uso de cores ANSI.                        |
| `logging.console.singleLineProgress` | Atualiza progresso na mesma linha quando possível. |
