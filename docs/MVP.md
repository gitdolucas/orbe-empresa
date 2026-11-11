# Empresa — Plano Completo do MVP

**Projeto:** Empresa / Brazil Business Graph  
**Versão:** 1.0  
**Data:** 11 de novembro de 2026  
**Status:** Planejamento  
**Stack:** TypeScript, Next.js, Vercel, PostgreSQL  
**Modelo:** API REST + MCP + infraestrutura de eventos  
**Mercado inicial:** Brasil  
**Idioma:** Português brasileiro (pt-BR), exceto código e identificadores técnicos, que utilizarão inglês americano (en-US).

---

# 1. Visão geral

## 1.1. O que estamos construindo

O **Empresa** será uma infraestrutura de dados e inteligência empresarial brasileira, projetada para fornecer informações confiáveis, contextualizadas e verificáveis a softwares, desenvolvedores e agentes de inteligência artificial.

O projeto não pretende ser apenas mais uma API de consulta de CNPJ.

Seu objetivo é construir uma camada de contexto empresarial capaz de responder:

- Quem é esta empresa?
- O que ela declara fazer?
- O que ela aparentemente faz na prática?
- Quais evidências sustentam essas informações?
- O que mudou em seus registros?
- Quando essas mudanças foram observadas?
- Como outros softwares podem utilizar essas informações?

A longo prazo, o produto deverá funcionar como uma infraestrutura compartilhada por CRMs, ERPs, SaaS, plataformas de compliance e agentes de IA.

## 1.2. Proposta de valor

**Dados empresariais brasileiros enriquecidos com contexto, histórico e evidências, prontos para integração.**

O Empresa combinará informações cadastrais oficiais, histórico de alterações e análise de atividades econômicas observadas.

A principal diferenciação será separar:

1. **Identidade oficial:** informações registradas nas fontes governamentais.
2. **Atividade declarada:** CNAEs e ocupações oficialmente cadastrados.
3. **Atividade observada:** produtos e serviços identificados a partir de evidências públicas.
4. **Histórico:** evolução dos registros entre versões conhecidas.
5. **Eventos:** alterações estruturadas que outros sistemas poderão consumir.

## 1.3. Objetivos do MVP

O primeiro MVP deverá:

- Demonstrar a viabilidade técnica da infraestrutura.
- Oferecer uma experiência pública sem cadastro.
- Disponibilizar dados reais com proveniência.
- Identificar alterações entre snapshots oficiais.
- Demonstrar classificação de atividades observadas.
- Expor informações via REST API e MCP.
- Atrair desenvolvedores por meio do X e GitHub.
- Validar interesse comercial antes de expandir a infraestrutura.

**Objetivo comercial:** encontrar pelo menos um cliente disposto a pagar por uma capacidade recorrente, e não apenas por consultas ocasionais.

---

# 2. Problema de mercado

## 2.1. Fragmentação dos dados brasileiros

Informações empresariais brasileiras estão distribuídas entre diferentes fontes, incluindo Receita Federal, IBGE e portais governamentais.

Essas fontes podem apresentar:

- Formatos heterogêneos.
- Atualizações em frequências diferentes.
- Dificuldades de integração.
- Ausência de histórico facilmente consultável.
- Identificadores e classificações que exigem normalização.

Isso obriga desenvolvedores a implementar integrações e rotinas próprias.

## 2.2. Limitações do CNAE

O CNAE representa a atividade econômica declarada, mas nem sempre descreve adequadamente as atividades efetivamente exercidas.

Uma empresa pode:

- Utilizar uma classificação muito abrangente.
- Possuir CNAEs secundários pouco considerados por ferramentas de busca.
- Ter alterado suas atividades sem atualizar imediatamente os registros.
- Oferecer diferentes produtos e serviços.
- Apresentar informações comerciais que não correspondem claramente à atividade principal.

Essa situação merece atenção especial em pequenos negócios e MEIs, mas sua frequência real deverá ser medida antes de fazermos afirmações quantitativas.

**Importante:** divergência entre atividade observada e CNAE não comprova irregularidade.

## 2.3. Limitações das APIs tradicionais

Uma API cadastral convencional responde:

> Qual é o CNAE desta empresa?

O Empresa deverá permitir perguntas mais avançadas:

> Quais serviços esta empresa aparentemente oferece, independentemente de sua classificação principal?

Ou:

> O que mudou nos registros desta empresa entre duas publicações oficiais?

Essa diferença fundamenta o posicionamento do produto.

---

# 3. Público-alvo

## 3.1. Desenvolvedores e pequenos SaaS

Necessidades:

- Consultar dados empresariais.
- Enriquecer cadastros.
- Normalizar informações.
- Integrar contexto a agentes.
- Reduzir manutenção de integrações.

## 3.2. CRMs e plataformas comerciais

Necessidades:

- Identificar atividades econômicas.
- Segmentar empresas.
- Encontrar potenciais clientes.
- Acompanhar alterações cadastrais.

## 3.3. ERPs e sistemas de fornecedores

Necessidades:

- Validar dados cadastrais.
- Identificar mudanças.
- Manter informações sincronizadas.
- Apoiar processos de revisão de fornecedores.

## 3.4. Agentes de inteligência artificial

Necessidades:

- Consultar dados estruturados.
- Acessar informações verificáveis.
- Interpretar evidências.
- Identificar alterações.
- Apoiar fluxos automatizados.

## 3.5. Cliente inicial prioritário

O cliente comercial inicial será um desenvolvedor ou pequeno SaaS B2B que já mantém cadastros empresariais e precisa enriquecê-los ou monitorá-los.

Esse público deverá ser validado por entrevistas e pilotos.

---

# 4. Escopo do MVP

## 4.1. Funcionalidades obrigatórias — P0

### F01 — Consulta empresarial

Consulta por CNPJ, retornando:

- CNPJ.
- Razão social.
- Nome fantasia, quando disponível.
- Situação cadastral.
- Data de abertura.
- CNAE principal.
- CNAEs secundários.
- Município e UF.
- Fonte.
- Competência do dataset.
- Data de coleta.

### F02 — Identidade empresarial

Cada estabelecimento terá uma identidade estável baseada no CNPJ completo.

O sistema também distinguirá:

- Pessoa jurídica identificada pelo CNPJ básico.
- Estabelecimento identificado pelo CNPJ completo.
- Matriz e filiais, quando disponíveis.

Essa separação evita confundir dados da organização com dados de seus estabelecimentos.

### F03 — Histórico de snapshots

O sistema armazenará versões dos dados empresariais.

Cada snapshot deverá registrar:

- Identificador da entidade.
- Dataset de origem.
- Data de referência.
- Data de ingestão.
- Conteúdo normalizado.
- Hash do conteúdo.
- Versão do schema.

### F04 — Detecção de mudanças

Comparação entre snapshots consecutivos para identificar alterações relevantes.

Tipos iniciais:

- `company.status.changed`
- `company.address.changed`
- `company.primary_activity.changed`
- `company.secondary_activities.changed`
- `company.trade_name.changed`

O sistema não deverá emitir eventos duplicados ao reprocessar o mesmo dataset.

### F05 — Atividade econômica observada

Analisar informações públicas de empresas selecionadas para identificar produtos e serviços aparentemente oferecidos.

O resultado deverá incluir:

- Atividades observadas.
- Categoria comercial.
- Possível correspondência com CNAEs.
- Evidências.
- Fonte e data das evidências.
- Nível de confiança.
- Estado da análise.

Estados possíveis:

- Compatível.
- Possível divergência.
- Evidência insuficiente.
- Não analisado.

A classificação deverá considerar CNAEs principais e secundários, além das ocupações permitidas quando aplicável ao MEI.

Não deverá produzir conclusões automáticas de irregularidade.

### F06 — API REST

Disponibilizar consultas empresariais, histórico, alterações e atividades observadas.

### F07 — Interface pública

Landing page e explorador interativo sem cadastro.

### F08 — Documentação

Documentação em português brasileiro, com exemplos técnicos em inglês.

### F09 — Proteção e observabilidade

Implementar rate limiting, cache, logs, monitoramento e limites de consumo.

## 4.2. Funcionalidades desejáveis — P1

- Servidor MCP remoto de leitura.
- SDK TypeScript.
- Exportação de JSON.
- Comparação visual entre snapshots.
- Compartilhamento de URLs de consultas.
- Formulário opcional de interesse comercial.
- Exemplos de integração com agentes.

## 4.3. Fora do MVP — P2

- Busca nacional por nome ou CNAE.
- Cobertura completa de todos os CNPJs.
- Monitoramento contratado em produção.
- Webhooks comerciais.
- Billing automatizado.
- Grafo avançado de relacionamentos.
- Análise fiscal e jurídica automatizada.
- Integrações com PNCP.
- Integrações com marketplaces.
- Classificação automática de milhões de empresas.

---

# 5. Fontes de dados

## 5.1. Receita Federal

Fonte principal para informações cadastrais.

Dados de interesse:

- Empresas.
- Estabelecimentos.
- Sócios, somente quando necessários e juridicamente adequados.
- CNAEs.
- Municípios.
- Naturezas jurídicas.
- Situações cadastrais.

**Estratégia:** importar um subconjunto controlado dos dados oficiais.

Antes da ingestão, verificar formato, competência, integridade, condições de reutilização e implicações de proteção de dados.

## 5.2. IBGE

Utilizado para normalização territorial.

Informações:

- Código do município.
- Nome.
- UF.
- Identificadores territoriais.

## 5.3. Presença digital das empresas

Possíveis fontes de evidência:

- Sites oficiais.
- Páginas de serviços.
- Catálogos públicos.
- Portfólios.
- Descrições comerciais publicamente disponíveis.

A coleta deverá respeitar condições de uso, permissões, limitações técnicas e legislação aplicável.

Não serão utilizadas fontes que exijam contornar autenticação ou mecanismos de proteção.

## 5.4. Estratégia de cobertura

O MVP não prometerá cobertura nacional.

Começará com um conjunto controlado de empresas que permita demonstrar:

- Consultas cadastrais reais.
- Snapshots históricos autênticos.
- Alterações verificáveis.
- Classificações de atividade observada com evidências.

**Meta experimental:** avaliar manualmente até 100 empresas, incluindo pequenos negócios e MEIs.

Para a demonstração de histórico, será necessário obter pelo menos dois snapshots genuínos e comparáveis. Se isso não for possível, o recurso permanecerá indisponível até existirem dados suficientes.

---

# 6. Classificação de atividade econômica observada

## 6.1. Objetivo

Criar uma taxonomia de atividades comerciais observadas, independente da classificação oficial.

Exemplos:

- Desenvolvimento de software.
- Consultoria de tecnologia.
- Marketing digital.
- Comércio eletrônico.
- Serviços de manutenção.
- Construção civil.
- Serviços educacionais.

## 6.2. Pipeline

1. Identificar a empresa.
2. Localizar fontes comerciais associadas a ela.
3. Verificar a associação entre fonte e empresa.
4. Extrair descrições de produtos e serviços.
5. Normalizar as descrições.
6. Classificar as atividades.
7. Comparar com CNAEs cadastrados.
8. Registrar evidências e confiança.
9. Encaminhar resultados incertos para revisão.

## 6.3. Modelo de classificação

Começar com uma abordagem híbrida:

- Regras determinísticas para casos claros.
- Taxonomia controlada de atividades.
- Modelo de linguagem para extração semântica quando necessário.
- Revisão manual para amostras e casos incertos.

Não utilizar LLM em todas as consultas. O enriquecimento deverá ser processado previamente e armazenado.

## 6.4. Confiança

O nível de confiança deverá considerar:

- Qualidade da fonte.
- Associação da fonte ao CNPJ.
- Atualidade da evidência.
- Clareza da descrição.
- Concordância entre evidências.
- Presença de informações contraditórias.

Inicialmente, utilizar categorias como alta, média, baixa e inconclusiva.

Não apresentar percentuais como probabilidades estatísticas sem calibração empírica.

## 6.5. Validação

Criar um conjunto de avaliação manual.

Métricas:

- Precisão por atividade.
- Cobertura.
- Taxa de falsos positivos.
- Qualidade da associação entre empresa e fonte.
- Percentual de resultados inconclusivos.
- Concordância com avaliadores humanos.

**Critério inicial:** buscar precisão de pelo menos 90% nas classificações emitidas com confiança alta, medida em amostra revisada. É uma meta experimental, não um desempenho garantido.

---

# 7. Arquitetura técnica

## 7.1. Stack

| Camada | Tecnologia |
|---|---|
| Linguagem | TypeScript |
| Framework | Next.js App Router |
| Hospedagem | Vercel |
| Interface | Tailwind CSS + shadcn/ui |
| API | Hono |
| Validação | Zod |
| MCP | SDK oficial TypeScript |
| Banco | Neon PostgreSQL |
| ORM | Drizzle ORM |
| Cache | Upstash Redis |
| Rate limiting | Upstash + proteções da Vercel |
| Testes unitários | Vitest |
| Testes E2E | Playwright |
| Observabilidade | Sentry + Vercel Analytics |
| Ingestão | Workers TypeScript |
| CI/CD | GitHub Actions + Vercel |

## 7.2. Princípios arquiteturais

- TypeScript end-to-end.
- Monólito modular no início.
- REST-first e MCP-ready.
- Regras de negócio independentes do transporte.
- Schemas tipados.
- Processamento idempotente.
- Proveniência obrigatória.
- Separação entre ingestão e consulta.
- Evolução incremental.
- Evitar dependência excessiva de fornecedores.

## 7.3. Componentes

**Frontend**

Landing page, explorador de empresas, histórico, comparação de alterações e documentação.

**API Gateway**

Validação, rate limiting, tratamento de erros e roteamento.

**Company Service**

Consultas e normalização empresarial.

**Snapshot Engine**

Armazenamento e comparação de versões.

**Change Engine**

Detecção e persistência de eventos.

**Activity Intelligence**

Extração, classificação e avaliação de atividades observadas.

**Data Ingestion**

Importação e normalização das fontes.

**MCP Adapter**

Exposição das capacidades internas para agentes.

## 7.4. Hospedagem

A Vercel hospedará:

- Aplicação Next.js.
- API REST.
- MCP remoto, quando habilitado.
- Documentação.

Processos pesados de importação serão executados separadamente, evitando depender de funções HTTP de curta duração.

---

# 8. Estrutura do repositório

```text
empresa/
├── src/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── empresas/
│   │   │   └── [cnpj]/page.tsx
│   │   ├── documentacao/
│   │   │   └── page.tsx
│   │   └── api/
│   │       ├── v1/[[...route]]/route.ts
│   │       └── mcp/route.ts
│   │
│   ├── components/
│   │   ├── company-search.tsx
│   │   ├── company-profile.tsx
│   │   ├── company-history.tsx
│   │   ├── change-timeline.tsx
│   │   ├── activity-analysis.tsx
│   │   └── json-viewer.tsx
│   │
│   ├── server/
│   │   ├── api/
│   │   ├── companies/
│   │   ├── snapshots/
│   │   ├── changes/
│   │   ├── activities/
│   │   ├── sources/
│   │   ├── mcp/
│   │   └── security/
│   │
│   ├── db/
│   │   ├── schema.ts
│   │   └── client.ts
│   │
│   └── lib/
│       ├── validation.ts
│       └── errors.ts
│
├── scripts/
│   ├── import-companies.ts
│   ├── compare-snapshots.ts
│   └── enrich-activities.ts
│
├── tests/
├── drizzle/
├── public/
├── package.json
└── README.md
```

---

# 9. Modelo de dados

## 9.1. Tabelas principais

### `companies`

Identidade empresarial e dados cadastrais atuais conhecidos.

Campos principais:

- `id`
- `cnpj`
- `rootCnpj`
- `legalName`
- `tradeName`
- `registrationStatus`
- `primaryCnae`
- `cityCode`
- `state`
- `createdAt`
- `updatedAt`

### `company_snapshots`

Histórico de versões.

- `id`
- `companyId`
- `sourceId`
- `datasetPeriod`
- `contentHash`
- `data`
- `observedAt`
- `ingestedAt`

### `company_changes`

Eventos detectados.

- `id`
- `companyId`
- `previousSnapshotId`
- `currentSnapshotId`
- `eventType`
- `field`
- `previousValue`
- `currentValue`
- `detectedAt`

### `observed_activities`

Atividades inferidas a partir de evidências.

- `id`
- `companyId`
- `activityCode`
- `activityName`
- `confidenceLevel`
- `classificationStatus`
- `modelVersion`
- `analyzedAt`

### `activity_evidence`

Evidências de classificação.

- `id`
- `observedActivityId`
- `sourceUrl`
- `sourceType`
- `excerpt`
- `collectedAt`
- `contentHash`

### `data_sources`

Origem e rastreabilidade.

- `id`
- `name`
- `sourceType`
- `datasetPeriod`
- `retrievedAt`
- `licenseReference`

### `api_usage`

Métricas agregadas de utilização.

- `id`
- `operation`
- `requestCount`
- `errorCount`
- `recordedAt`

## 9.2. Regras de integridade

- CNPJ normalizado e validado.
- Identificadores únicos.
- Snapshots imutáveis.
- Eventos idempotentes.
- Relacionamentos com chaves estrangeiras.
- Índices por CNPJ e entidade.
- Preservação de metadados de origem.
- Retenção mínima de informações pessoais.
- Não sobrescrever histórico com dados recentes.

---

# 10. API REST

## 10.1. Endpoints

```http
GET /api/v1/companies/:cnpj
GET /api/v1/companies/:cnpj/history
GET /api/v1/companies/:cnpj/changes
GET /api/v1/companies/:cnpj/activities
GET /api/v1/health
```

## 10.2. Exemplo de resposta

```json
{
  "data": {
    "cnpj": "12345678000195",
    "legalName": "Example Company Ltda",
    "registrationStatus": "ACTIVE",
    "declaredActivities": [
      {
        "code": "6201501",
        "primary": true
      }
    ],
    "observedActivities": [
      {
        "name": "Software development",
        "confidenceLevel": "HIGH",
        "classificationStatus": "COMPATIBLE"
      }
    ]
  },
  "meta": {
    "source": "RFB_OPEN_DATA",
    "datasetPeriod": "2026-10",
    "retrievedAt": "2026-11-11T12:00:00Z"
  }
}
```

Exemplo fictício, utilizado apenas para especificar o contrato.

## 10.3. Erros

| Código HTTP | Situação |
|---|---|
| 400 | Identificador inválido |
| 404 | Registro não encontrado na cobertura disponível |
| 429 | Limite excedido |
| 500 | Erro interno |
| 503 | Serviço temporariamente indisponível |

A resposta deverá distinguir registro ausente do dataset de registro comprovadamente inexistente.

---

# 11. MCP

## 11.1. Ferramentas iniciais

```text
get_company
get_company_history
get_company_changes
get_company_activities
```

## 11.2. Regras

- Ferramentas somente de leitura.
- Schemas Zod.
- Respostas compactas.
- Referências às fontes.
- Indicação de atualidade.
- Limites de consumo.
- Tratamento de erros estruturado.

O MCP utilizará os mesmos serviços internos da API REST.

O endpoint público não deverá oferecer consumo anônimo ilimitado.

---

# 12. Interface e experiência do usuário

## 12.1. Idioma

Toda a experiência pública será em português brasileiro.

Isso inclui:

- Landing page.
- Navegação.
- Formulários.
- Mensagens.
- Documentação.
- Tutoriais.
- Comunicação comercial.
- Posts no X.

Código, nomes de funções, variáveis, propriedades JSON e identificadores técnicos utilizarão inglês americano.

## 12.2. Identidade visual

Direção:

- Visual moderno e minimalista.
- Fundo escuro como opção inicial.
- Tipografia legível.
- Azul e ciano como cores de destaque.
- Componentes consistentes.
- Layout responsivo.
- Estética voltada a desenvolvedores.

## 12.3. Landing page

### Seção principal

**Título:**

Conheça a empresa. Entenda o que mudou.

**Subtítulo:**

Consulte dados empresariais brasileiros, explore históricos cadastrais e descubra atividades econômicas com evidências verificáveis.

**CTA:**

Explorar uma empresa

### Seções adicionais

1. Consulta interativa.
2. Perfil empresarial.
3. Histórico de alterações.
4. Atividades declaradas versus observadas.
5. Exemplos de API.
6. Integração com agentes.
7. Fontes e metodologia.
8. Convite para acesso antecipado.

## 12.4. Explorador

O usuário poderá:

- Informar um CNPJ.
- Selecionar empresas de exemplo.
- Visualizar dados cadastrais.
- Consultar histórico disponível.
- Comparar versões.
- Visualizar atividades observadas.
- Consultar evidências.
- Copiar respostas JSON.

Dados ausentes deverão ser apresentados explicitamente.

Não serão utilizados eventos fictícios como se fossem dados reais.

---

# 13. Segurança e privacidade

## 13.1. Proteções

- Rate limiting por IP e critérios adicionais.
- Limite global diário.
- Cache.
- Validação de entrada.
- Timeouts.
- Proteção contra abuso.
- Limites de tamanho de resposta.
- Logs estruturados.
- Monitoramento de custos.

## 13.2. LGPD

O sistema deverá observar princípios de:

- Finalidade.
- Necessidade.
- Transparência.
- Segurança.
- Qualidade dos dados.
- Retenção proporcional.

Informações pessoais de sócios e outros indivíduos não serão incluídas no MVP sem necessidade comprovada e análise jurídica adequada.

## 13.3. Classificação responsável

A plataforma não deverá:

- Acusar empresas de irregularidade automaticamente.
- Confundir inferência com fato oficial.
- Apresentar confiança artificialmente elevada.
- Omitir fontes e datas.
- Tratar CNAE principal como descrição completa das atividades.

---

# 14. Estratégia de lançamento

## 14.1. Canal principal

X, com comunicação em português brasileiro.

Canais complementares:

- GitHub.
- Comunidades de desenvolvimento.
- LinkedIn.
- Documentação pública.
- Conteúdo técnico.

## 14.2. Posicionamento

**Não é apenas mais uma API de CNPJ.**

É uma infraestrutura de contexto empresarial com histórico, eventos e atividades observadas.

## 14.3. Conteúdo inicial

### Post 1 — Construindo em público

Estou construindo uma infraestrutura de dados empresariais brasileiros para desenvolvedores e agentes de IA.

A ideia vai além da consulta de CNPJ:

- Histórico cadastral.
- Detecção de alterações.
- Atividades econômicas observadas.
- Evidências verificáveis.
- API REST e MCP.

Vou compartilhar a evolução do projeto por aqui.

### Post 2 — Problema do CNAE

O CNAE de uma empresa nem sempre descreve tudo o que ela realmente faz.

Isso afeta buscas, CRMs, prospecção e agentes de IA.

Estou experimentando uma forma de combinar dados oficiais com evidências públicas para identificar atividades econômicas observadas.

Sem substituir o cadastro oficial e sem presumir irregularidades.

### Post 3 — Demonstração

Mostrar uma empresa real, dois snapshots e uma alteração verificável.

### Post 4 — Lançamento

Publicar:

- URL da demo.
- Vídeo curto.
- Exemplo REST.
- Demonstração MCP, se disponível.
- Link para documentação.

## 14.4. Vídeo

Duração sugerida: 20–30 segundos.

Roteiro:

1. Abrir a landing page.
2. Selecionar uma empresa.
3. Mostrar informações oficiais.
4. Abrir histórico.
5. Destacar uma alteração real.
6. Mostrar atividades observadas e evidências.
7. Copiar JSON.
8. Encerrar com convite para experimentar.

---

# 15. Roadmap

## Semana 1 — Fundação

- [ ] Criar projeto Next.js.
- [ ] Configurar TypeScript.
- [ ] Configurar Tailwind e shadcn/ui.
- [ ] Configurar Vercel.
- [ ] Configurar Neon.
- [ ] Configurar Drizzle.
- [ ] Criar schemas.
- [ ] Implementar validação de CNPJ.
- [ ] Selecionar fontes oficiais.
- [ ] Importar dados iniciais.

**Entrega:** consulta empresarial funcional.

## Semana 2 — Histórico

- [ ] Criar armazenamento de snapshots.
- [ ] Obter versões comparáveis.
- [ ] Implementar diff engine.
- [ ] Criar eventos estruturados.
- [ ] Garantir idempotência.
- [ ] Implementar endpoints REST.
- [ ] Criar testes unitários.

**Entrega:** histórico e mudanças verificáveis.

## Semana 3 — Inteligência e interface

- [ ] Criar taxonomia inicial.
- [ ] Selecionar empresas para análise.
- [ ] Coletar evidências autorizadas.
- [ ] Implementar classificação.
- [ ] Criar revisão manual.
- [ ] Construir landing page.
- [ ] Criar explorador empresarial.
- [ ] Criar timeline.
- [ ] Criar visualização de atividades.
- [ ] Criar JSON viewer.

**Entrega:** demonstração integrada.

## Semana 4 — MCP e lançamento

- [ ] Implementar ferramentas MCP.
- [ ] Configurar limites.
- [ ] Criar documentação.
- [ ] Configurar analytics.
- [ ] Executar testes E2E.
- [ ] Revisar segurança.
- [ ] Preparar exemplos no GitHub.
- [ ] Criar imagem Open Graph.
- [ ] Gravar vídeo.
- [ ] Publicar no X.
- [ ] Coletar feedback.

**Entrega:** beta pública.

---

# 16. Orçamento

## 16.1. Custos mensais estimados

| Serviço | Estimativa |
|---|---:|
| Vercel | R$ 120–180 |
| Neon | R$ 0–100 |
| Upstash | R$ 0–30 |
| Monitoramento | R$ 0–50 |
| Domínio e auxiliares | R$ 10–30 |
| Total | R$ 130–390 |

Valores para planejamento, não cotações.

Não incluem:

- Desenvolvimento.
- Tributos.
- Provedores pagos de dados.
- Processamento intensivo de IA.
- Importações massivas.
- Campanhas pagas.

**Orçamento inicial sugerido:** até R$ 500 para o primeiro mês, desde que o escopo permaneça limitado.

## 16.2. Esforço

Estimativa inicial: 60–100 horas.

A obtenção de snapshots históricos e a validação de atividades observadas representam as maiores incertezas.

---

# 17. Métricas

## 17.1. Produto

- Consultas concluídas.
- Taxa de erro.
- Latência p95.
- Uso de histórico.
- Visualizações de evidências.
- Cliques na documentação.
- Custo por operação.

## 17.2. Qualidade

- Cobertura cadastral.
- Atualidade das fontes.
- Eventos duplicados.
- Precisão das mudanças.
- Precisão da classificação de atividades.
- Falsos positivos.
- Resultados inconclusivos.

## 17.3. Negócio

Metas experimentais para os primeiros 30 dias:

| Métrica | Meta |
|---|---:|
| Visitantes únicos | 300 |
| Consultas concluídas | 100 |
| Desenvolvedores interessados | 15 |
| Integrações experimentais | 5 |
| Conversas comerciais | 5 |
| Pilotos pagos ou compromissos | 1–2 |

Essas metas não representam previsões.

---

# 18. Riscos

## R01 — Produto facilmente replicável

**Mitigação:** priorizar histórico, evidências, qualidade e integração operacional.

## R02 — Ausência de demanda pagante

**Mitigação:** entrevistas e pilotos antes de expandir.

## R03 — Dados desatualizados

**Mitigação:** metadados de competência e política explícita de atualização.

## R04 — Classificação incorreta

**Mitigação:** evidências, confiança, revisão manual e estado inconclusivo.

## R05 — Associação incorreta de sites

**Mitigação:** verificar identidade e não associar automaticamente domínios por semelhança de nome.

## R06 — Custos inesperados

**Mitigação:** limites, cache, processamento assíncrono e orçamento máximo.

## R07 — Riscos jurídicos

**Mitigação:** respeitar licenças, LGPD e evitar acusações de irregularidade.

## R08 — Escopo excessivo

**Mitigação:** preservar prioridades P0, P1 e P2, sem expandir antes da validação.

---

# 19. Critérios de conclusão

## 19.1. MVP tecnicamente concluído

- [ ] Aplicação pública na Vercel.
- [ ] Consulta de empresas reais.
- [ ] Dados com fonte e competência.
- [ ] Pelo menos dois snapshots autênticos para empresas demonstrativas.
- [ ] Alterações reais detectadas.
- [ ] Eventos idempotentes.
- [ ] Classificação observada com evidências.
- [ ] API REST documentada.
- [ ] Interface responsiva.
- [ ] Rate limiting funcional.
- [ ] Testes essenciais aprovados.
- [ ] MCP de leitura disponível ou explicitamente marcado como beta posterior.
- [ ] Nenhum dado simulado apresentado como real.

## 19.2. MVP comercialmente validado

- Pelo menos cinco conversas com compradores potenciais.
- Pelo menos três integrações experimentais relevantes.
- Evidência de uso recorrente.
- Pelo menos um compromisso concreto de pagamento ou piloto pago.

O cumprimento dos critérios técnicos não implica validação comercial.

---

# 20. Evolução após o MVP

## Fase 2 — Monitoramento contínuo

- Registro de empresas monitoradas.
- Atualizações periódicas.
- Assinaturas de eventos.
- Webhooks.
- Histórico ampliado.
- Planos pagos.

## Fase 3 — Business Graph

- Relacionamentos entre empresas.
- Matriz e filiais.
- Contratos públicos.
- Relações entre atividades e setores.
- Resolução de entidades entre fontes.
- Consultas por relacionamentos.

## Fase 4 — Infraestrutura para agentes

- MCP autenticado.
- SDKs.
- Organizações e permissões.
- Créditos e billing.
- Ferramentas compostas.
- Automação de processos autorizados.

## Fase 5 — Expansão de domínios

Possíveis módulos:

- Licitações públicas.
- Inteligência territorial.
- Educação.
- Meteorologia operacional.
- Regras e mudanças regulatórias.

Cada módulo deverá ser validado comercialmente antes do investimento.

---

# 21. Princípios permanentes

1. **Dados e eventos são o produto. REST e MCP são interfaces.**
2. Informações oficiais e inferências devem permanecer separadas.
3. Toda informação relevante deve possuir proveniência.
4. O histórico deve ser verificável e imutável.
5. A qualidade é mais importante que a quantidade de fontes.
6. A arquitetura deve ser simples até existir necessidade real de escala.
7. Nenhum recurso será desenvolvido apenas porque é tecnicamente interessante.
8. O produto deve resolver problemas recorrentes de outros softwares.
9. A experiência pública será em português brasileiro.
10. Código e identificadores técnicos serão em inglês americano.

---

# 22. Definição de sucesso

O Empresa terá cumprido o objetivo do primeiro MVP quando demonstrar que é possível transformar registros empresariais brasileiros em contexto estruturado, histórico verificável e atividades econômicas observadas com evidências.

O projeto terá demonstrado potencial comercial quando um desenvolvedor ou empresa decidir incorporar essas capacidades a um processo recorrente e aceitar pagar por isso.

**Visão de longo prazo:**

Construir uma infraestrutura brasileira de contexto empresarial que permita a softwares e agentes de IA compreender empresas, acompanhar mudanças e executar processos com informações confiáveis.

**Não queremos apenas responder quem uma empresa é. Queremos fornecer a infraestrutura que permita aos softwares compreender o que ela faz, o que mudou e por que isso importa.**