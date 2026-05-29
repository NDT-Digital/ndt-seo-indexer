# Usage

Este guia mostra um fluxo completo de uso local do NDT SEO Indexer.

## 1. Criar um projeto registrado

```bash
nsi project create example --site-url https://example.com
```

A CLI cria o projeto em:

```txt
~/.ndt-seo-indexer/projects/example/example.nsi.config.json
```

E define esse projeto como atual.

## 2. Ver projetos

```bash
nsi project list
```

Saída esperada:

```txt
* example — /home/user/.ndt-seo-indexer/projects/example/example.nsi.config.json
```

## 3. Ver configuração

```bash
nsi config list
```

Ou abrir o arquivo diretamente:

```bash
nsi project path
```

## 4. Ajustar campos simples pela CLI

```bash
nsi config set siteUrl https://example.org
nsi config set output.directory ./dist/generated-sitemaps
nsi config set limits.urlsPerSitemap 40000
```

Para alterações grandes, como adicionar providers, edite o JSON diretamente.

## 5. Validar

```bash
nsi validate
```

Esse comando valida:

- formato da configuração;
- output configurado;
- providers configurados;
- estimativa de registros quando possível.

## 6. Planejar

```bash
nsi plan
```

Esse comando mostra uma estimativa:

```txt
Project: example
Site URL: https://example.org
Output: ./dist/generated-sitemaps

Sitemaps:
- static (static) | urls=2 | batch=40000 | files=1
```

## 7. Gerar

```bash
nsi generate
```

Isso gera os arquivos no diretório configurado.

## 8. Simular geração

```bash
nsi generate --dry-run
```

O `dry-run` calcula os arquivos e URLs sem escrever no filesystem.

## 9. Gerar apenas um sitemap

```bash
nsi generate --sitemap static
```

Útil para testar uma fonte específica.

## 10. Usar múltiplos projetos

Crie outro projeto:

```bash
nsi project create second-project --site-url https://second.example.com
```

Alternar projeto atual:

```bash
nsi project use second-project
```

Executar um projeto específico sem trocar o atual:

```bash
nsi generate --project example
```

## 11. Usar sem registro global

Também é possível usar apenas arquivo local:

```bash
nsi init --project local-example --site-url https://example.com
nsi validate --config nsi.config.json
nsi plan --config nsi.config.json
nsi generate --config nsi.config.json
```

## Resultado final

Os arquivos gerados precisam ser publicados pelo site, proxy ou storage.

Exemplo:

```txt
https://example.com/sitemap.xml
https://example.com/sitemaps/static.xml
https://example.com/sitemaps/records-1.xml
```

Depois, envie o `sitemap.xml` principal no Google Search Console.

## Retomando uma geração interrompida

Se `nsi generate` for interrompido no meio de uma geração grande, execute o mesmo comando novamente. A CLI tenta validar o checkpoint do projeto e continua a partir do próximo arquivo pendente. Para começar do zero, use `nsi generate --force`.
