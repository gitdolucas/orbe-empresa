# Estado de entrega — Empresa

Data: 11/11/2026. Beta publicada em [orbe-empresa-pi.vercel.app](https://orbe-empresa-pi.vercel.app), no projeto pessoal `lucas-limas-projects-633d32f2/orbe-empresa`. Busca por CNPJ e API disponíveis. Neon Postgres e Upstash Redis provisionados no mesmo espaço pessoal, planos gratuitos, região `iad1`, conectados somente à produção. Migração aplicada e amostra importada; persistência, limitação distribuída e consultas públicas verificadas. MVP completo e lançamento comercial ainda pendentes.

| Requisito                    | Estado                              | Evidência / limite                                                                                        |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------- |
| F01 Consulta por CNPJ        | Implementado                        | BrasilAPI, validação, amostra real, proveniência explícita                                                |
| F02 Identidade               | Implementado                        | CNPJ básico, estabelecimento e matriz/filial                                                              |
| F03 Snapshots                | Implementado                        | Imutabilidade, hash, schema e fonte; amostra com uma observação por empresa                               |
| F04 Mudanças                 | Motor implementado                  | Cinco eventos, idempotência, transações; faltam dois snapshots oficiais autênticos                        |
| F05 Atividades               | Beta assistida                      | Duas atividades OKBR, evidências reais, confiança média; avaliação humana e métrica de precisão pendentes |
| F06 REST                     | Implementado                        | Cinco endpoints, erros estruturados, testes                                                               |
| F07 Interface                | Implementado                        | Responsiva, pública, URLs compartilháveis                                                                 |
| F08 Documentação             | Implementado                        | pt-BR, exemplos em inglês, fontes e limites                                                               |
| F09 Proteção/observabilidade | Implementado; configuração pendente | Redis, limites, logs, métricas agregadas, Sentry/analytics opcionais; contas e alertas pendentes          |
| MCP                          | Implementado, desativado por padrão | Read-only, Bearer, limites, testes de protocolo                                                           |
| PostgreSQL                   | Neon remoto provisionado e validado | `orbe-empresa-postgres`; migração, três empresas, três snapshots e duas evidências verificadas              |
| Redis                        | Upstash remoto provisionado         | `orbe-empresa-redis`; plano gratuito, upgrade automático desligado; ping e contador distribuído verificados |
| Vercel                       | Publicado no espaço pessoal         | Next.js, Node 24, raiz do repo; GitHub `gitdolucas/orbe-empresa`, branch `main`, deploy automático            |
| Validação comercial          | Pendente                            | Entrevistas, integrações, uso recorrente e piloto pago                                                    |

## Antes de considerar o MVP tecnicamente concluído

1. Concluído: provisionar Neon e Upstash, aplicar migrações e seed; verificar persistência e contadores remotos. A validação completa de concorrência distribuída permanece posterior.
2. Obter pelo menos duas competências oficiais genuínas do mesmo conjunto de CNPJs; normalizar, importar e revisar alterações.
3. Submeter a amostra de atividades à avaliação humana; medir precisão e qualidade de associação. A meta de 90% ainda não foi medida.
4. Configurar Sentry/analytics, definir orçamento, retenção, atualização e alertas operacionais.
5. Concluído: verificar health, endpoints, consulta pública desktop/mobile e limite Redis. Testes contínuos e validação sob carga permanecem posteriores.
6. Revisar condições de reutilização das fontes para o uso comercial pretendido.

MCP pode permanecer beta posterior conforme plano. Nenhuma alteração histórica simulada aparece no produto. Sem cobertura nacional prometida.

## Verificação local concluída

- Build de produção Next.js aprovado.
- TypeScript e formatação aprovados.
- 33 testes de domínio, API, configuração Redis e MCP aprovados.
- 2 fluxos E2E Playwright aprovados: desktop e mobile.
- Auditoria npm sem vulnerabilidades conhecidas na execução.
- Axe: zero violações automáticas; contraste sobre gradientes conferido visualmente.
- Capturas: [desktop](screenshots/desktop.png) e [mobile](screenshots/mobile.png).

Conexões reais com Neon e Upstash verificadas: três empresas, três snapshots, duas atividades e duas evidências persistidas; leitura de perfil, ping Redis e decremento do contador entre chamadas aprovados. Sentry permanece sem configuração. Esses testes não constituem teste de carga nem garantia de disponibilidade.

## Verificação em produção com os bancos conectados

- Health HTTP 200: `storage: postgresql`, `rateLimit: redis`, MCP desativado.
- Cadastro, histórico, alterações e atividades da OKBR: HTTP 200; CNPJ inválido: HTTP 400.
- Consulta Petrobras (`33000167000101`), fora da amostra: HTTP 200, persistida no Postgres e reutilizada na chamada seguinte sem novo snapshot. Banco com quatro empresas após esse teste; amostra versionada continua com três.
- Busca por formulário no desktop; nova consulta no mobile, recarga do perfil e ausência de overflow verificadas no site público.
- Limite remoto com chave isolada: duas chamadas permitidas, terceira bloqueada, tempo de nova tentativa positivo.
- CI GitHub Actions aprovada, incluindo 33 testes, build e dois fluxos E2E.

## Revisão visual — referência Cara Certa

- Paleta clara com preto e lima, Schibsted Grotesk e Geist Mono auto-hospedadas.
- Navegação horizontal; sidebar, gráfico decorativo e banners removidos.
- Home apresenta título, busca, exemplos e diagrama SVG ilustrativo com pausa e movimento reduzido. Nenhum perfil aparece sem ação do visitante.
- Consulta abre página própria; retorno à home restaura a tela simples.
- Dados adicionais e proveniência em expansões; histórico, atividades e JSON em abas.
- Fluxos desktop/mobile atualizados e aprovados; home e perfil sem violações automáticas Axe.
- Direção e evidências documentadas em [`DESIGN.md`](../DESIGN.md).
