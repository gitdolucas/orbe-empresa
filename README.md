# Empresa

Infraestrutura de contexto empresarial brasileiro. Interface pública em pt-BR; código e contratos em inglês.

**Estado:** beta publicada em [orbe-empresa-pi.vercel.app](https://orbe-empresa-pi.vercel.app), no espaço pessoal de Lucas Lima na Vercel, com Neon Postgres e Upstash Redis gratuitos conectados à produção. Busca por CNPJ e API disponíveis; health HTTP 200, nova consulta persistida e limitação Redis verificados. Não representa MVP completo nem validação comercial. O plano original está em [`docs/MVP.md`](docs/MVP.md); pendências concretas em [`docs/STATUS.md`](docs/STATUS.md).

## Executar

Requer Node.js 22+ e npm.

```bash
cd empresa # se estiver na raiz orbe-org
npm ci
npm run dev
```

Abra http://localhost:3000. Não precisa de conta nem de credenciais para a amostra inicial e o armazenamento local. CNPJs fora da amostra exigem rede para a BrasilAPI. Consultas coletadas permanecem em `.runtime/companies.json`, ignorado pelo Git. Esse adaptador é exclusivo de desenvolvimento em uma instância; não utilizar em produção distribuída.

## Implementado

- Explorador responsivo com atalhos, exemplos reais, validação de CNPJ numérico/alfanumérico, URLs compartilháveis e estados de erro.
- Identidade da pessoa jurídica (`rootCnpj`) separada do estabelecimento (`cnpj`), matriz/filial, CNAEs, endereço e proveniência.
- API REST Hono/Zod: cadastro, histórico, alterações, atividades e health.
- Snapshots imutáveis, serialização canônica, hash SHA-256 e cinco tipos de evento idempotentes.
- Comparação visual de versões oficiais consecutivas e timeline das observações.
- Duas atividades observadas da Open Knowledge Brasil, com fonte pública verificada, trechos, hash, confiança média e validação humana explicitamente pendente.
- JSON copiável e exportável; documentação e metodologia públicas.
- Postgres com Drizzle, migração SQL, importador normalizado e comandos de coleta/revisão.
- Limites distribuídos Redis/Upstash, limite global diário, timeout do provedor, logs estruturados e cabeçalhos de segurança.
- MCP Streamable HTTP somente de leitura, autenticado, desabilitado por padrão.
- Testes Vitest e Playwright, CI GitHub Actions.

## Direção visual

Referência: [Cara Certa](https://cara-certa.com.br). Interface clara, tipografia Schibsted Grotesk, acento lima e navegação horizontal. A home mostra consulta, exemplos e um diagrama SVG ilustrativo de como cadastro, evidências e coletas formam contexto empresarial. A animação tem pausa, respeita movimento reduzido e adapta o fluxo ao mobile; o perfil abre após seleção explícita. Dados complementares e proveniência ficam em expansões. Ver [DESIGN.md](DESIGN.md).

## Verdade dos dados

Três CNPJs coletados em 11/11/2026 via BrasilAPI / Minha Receita: Open Knowledge Brasil, Banco do Brasil e Magazine Luiza. Os payloads foram minimizados: não persistimos sócios, CPF, e-mail ou telefone.

A fonte intermediária não fornece competência do dataset. `datasetPeriod` é `null`; coleta não significa atualização cadastral. A amostra contém **uma observação por empresa, nenhum par de snapshots oficiais e nenhum evento histórico**. Não fabricamos versões para simular esse recurso.

Evidências: https://ok.org.br/eixos-de-atuacao/prestacao-de-servicos/. Associação CNPJ/domínio: https://ok.org.br/apoie/. Conteúdo do site sob CC BY 4.0, salvo indicação específica. Hash de evidência corresponde ao trecho UTF-8 armazenado. A análise usa taxonomia curada e conferência assistida, não avaliação humana independente nem modelo probabilístico calibrado.

Para recolher a amostra e as evidências (com rede):

```bash
npm run collect:examples
npm run collect:evidence
```

Esses comandos atualizam os arquivos rastreados da amostra. Não atualizam automaticamente o banco de produção. Execute o seed apenas na implantação inicial; use novas observações/importações para evolução posterior.

## Produção: Vercel + Neon + Upstash

Projeto existente: `lucas-limas-projects-633d32f2/orbe-empresa`, conectado a `gitdolucas/orbe-empresa`, branch `main`. Next.js, Node.js 24 e `npm ci`; Root Directory na raiz deste repositório. Pushes em `main` disparam deploy de produção.

Recursos pessoais existentes: Neon `orbe-empresa-postgres` (Free) e Upstash `orbe-empresa-redis` (Free), ambos em `iad1` e conectados somente à produção. Upgrade automático do Redis desligado. As integrações gerenciam `DATABASE_URL` com pooling e `KV_REST_API_URL`/`KV_REST_API_TOKEN`; o servidor também aceita o par `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`, que tem precedência quando completo. Pares incompletos não são combinados.

1. Configure o projeto Vercel com **Root Directory: `empresa`** caso o repositório seja `orbe-org`. Se publicar esta pasta como repositório separado, use a raiz.
2. Copie `.env.example` para `.env.local` no desenvolvimento. Em um novo projeto Vercel, conecte Neon e Upstash pelo Marketplace ou configure `DATABASE_URL` (conexão Neon com pooling) e um dos pares Redis acima.
3. Aplique a migração e importe a amostra num ambiente com essas variáveis disponíveis:

```bash
npm run db:migrate
npm run db:seed
npm run build
```

4. Publique pelo fluxo de Git da Vercel. Verifique `/api/v1/health`, consulta, histórico e limites após implantar.

**Sem Redis em `NODE_ENV=production`, a API responde 503 deliberadamente.** Sem Postgres, novas consultas na Vercel não persistem e respondem 503; os exemplos continuam legíveis na interface. O preview local usa limites compartilhados por instância. Fora da Vercel, o servidor não confia em cabeçalhos de encaminhamento arbitrários; todas as origens compartilham a mesma cota até configurar um proxy confiável.

O banco funciona como cache persistente da última observação. Reconsultar um CNPJ existente não dispara enriquecimento nem atualização automática; a atualidade fica explícita em `meta`. Rotinas de atualização devem importar novos snapshots. Não existe cron automático neste beta.

Credenciais não são versionadas. Banco remoto e Redis estão conectados ao projeto Vercel; monitoramento ainda precisa ser configurado. Logs estruturados estão implementados; Sentry está integrado para erros técnicos de servidor (`SENTRY_DSN`), sem request, usuário ou breadcrumbs. Vercel Analytics é opcional (`NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED=true`) e remove CNPJs e query strings das URLs. Retenção e alertas permanecem pendentes.

## Importar snapshots oficiais

O importador aceita um array JSON de `{ company, source }` já normalizados. Não baixa nem processa os grandes ZIPs brutos da Receita Federal. O operador deve verificar fonte, licença, integridade, competência e referências antes de importar. Exemplo de contrato em `docs/import-contract.json`; substitua seus campos por dados reais antes de usar.

```bash
npm run import:companies -- /absolute/path/to/verified-dataset.json
```

- `source.kind`: `OFFICIAL_DATASET` para datasets autênticos, `PUBLIC_API` para observações.
- `source.datasetPeriod`: `YYYY-MM` obrigatório para dataset oficial.
- `source.referenceDate`, `retrievedAt`: ISO UTC; são conceitos distintos.
- `source.id`: identidade estável da fonte, compartilhada entre suas competências.
- Ordem crescente por referência. Reimportação idêntica é no-op; tentativa de alterar release existente é rejeitada.
- Comparação somente entre versões oficiais consecutivas da mesma fonte. Todos os CNAEs secundários são considerados; sua ordem não cria eventos falsos.
- Transação e advisory lock por CNPJ no Postgres. Importação é atômica por entidade; um lote pode concluir parcialmente em falha operacional. Reexecute com segurança.

## Revisar atividades

Não há crawler arbitrário nem LLM executado por consulta. O comando de enriquecimento recebe atividades já revisadas pelo operador, inclui taxonomia, nível de confiança, estado, possíveis CNAEs e evidências. O campo `reviewedBy` identifica honestamente como a revisão foi feita.

```bash
npm run enrich:activities -- /absolute/path/to/reviewed-activities.json
```

Contrato: `{ "cnpj": "...", "activities": [...] }`, seguindo `observedActivitySchema` em `src/lib/company.ts`. Cada ID deve começar com `<cnpj>:`. `COMPATIBLE` exige correspondência com pelo menos um CNAE declarado. Uma divergência não implica irregularidade.

## API

```http
GET /api/v1/companies/:cnpj
GET /api/v1/companies/:cnpj/history
GET /api/v1/companies/:cnpj/changes
GET /api/v1/companies/:cnpj/activities
GET /api/v1/health
```

Erros: 400 identificador inválido, 404 fora da cobertura, 429 limite, 500 falha interna, 503 dependência indisponível. Consulte `/documentacao` para exemplos. Um 404 não declara que o CNPJ inexiste.

`API_RATE_LIMIT=30`: requisições/minuto/origem. `API_DAILY_LIMIT=5000`: requisições/dia no total. Limites incluem endpoints REST e MCP. O explorador usa até três requisições para um perfil (cadastro, histórico, alterações). Cotas diárias usam UTC. As chaves de origem são hashes rotativos diários; logs não incluem CNPJ ou IP bruto.

## MCP beta

Configure `MCP_ENABLED=true` e `MCP_API_KEY` forte no servidor. Endpoint: `POST /api/mcp`, com `Authorization: Bearer <key>`. Suporta `get_company`, `get_company_history`, `get_company_changes`, `get_company_activities`. Sem batches, sem sessões persistentes, somente leitura. Requer Redis em produção. Não compartilhe a chave em frontend público.

## Verificação

```bash
npm run typecheck
npm test
npm run test:e2e
npm run build
```

O Playwright usa Chromium instalado (`npx playwright install chromium`) ou `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. Os testes de diff usam fixtures sintéticas isoladas em testes, nunca apresentadas na aplicação.

## Estrutura

```text
src/app/          # Interface e transportes Next.js
src/components/   # Explorador, evidências, histórico, JSON e UI
src/server/       # Serviços, snapshots, persistência, limites e provedor
src/db/           # Schema e cliente Postgres
scripts/          # Coleta, ingestão normalizada, revisão, migração e seed
 data/            # Amostra real minimizada, com fonte e datas
 drizzle/         # Migrações SQL versionadas
 tests/           # Domínio, REST, MCP e fluxos E2E
 docs/            # Plano original, contrato e status de entrega
```
