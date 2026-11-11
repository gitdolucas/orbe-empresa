# Estado de entrega — Empresa

Data: 11/11/2026. Beta local; lançamento público ainda pendente.

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
| PostgreSQL                   | Adaptador e migração prontos        | Falta provisionamento e teste em banco remoto                                                             |
| Vercel                       | Estrutura compatível                | Falta vínculo com projeto e implantação                                                                   |
| Validação comercial          | Pendente                            | Entrevistas, integrações, uso recorrente e piloto pago                                                    |

## Antes de considerar o MVP tecnicamente concluído

1. Provisionar Neon e Upstash, aplicar migrações e seed; validar transações e limites em ambiente remoto.
2. Obter pelo menos duas competências oficiais genuínas do mesmo conjunto de CNPJs; normalizar, importar e revisar alterações.
3. Submeter a amostra de atividades à avaliação humana; medir precisão e qualidade de associação. A meta de 90% ainda não foi medida.
4. Configurar Sentry/analytics, definir orçamento, retenção, atualização e alertas operacionais.
5. Implantar na Vercel, verificar domínio, health, limites e E2E em produção.
6. Revisar condições de reutilização das fontes para o uso comercial pretendido.

MCP pode permanecer beta posterior conforme plano. Nenhuma alteração histórica simulada aparece no produto. Sem cobertura nacional prometida.

## Verificação local concluída

- Build de produção Next.js aprovado.
- TypeScript e formatação aprovados.
- 30 testes de domínio, API e MCP aprovados.
- 2 fluxos E2E Playwright aprovados: desktop e mobile.
- Auditoria npm sem vulnerabilidades conhecidas na execução.
- Axe: zero violações automáticas; contraste sobre gradientes conferido visualmente.
- Capturas: [desktop](screenshots/desktop.png) e [mobile](screenshots/mobile.png).

Conexões reais com Neon, Upstash e Sentry não foram exercitadas: faltam credenciais. O beta local não comprova comportamento distribuído nem disponibilidade de produção.

## Revisão visual — referência Cara Certa

- Paleta clara com preto e lima, Schibsted Grotesk e Geist Mono auto-hospedadas.
- Navegação horizontal; sidebar, gráfico decorativo e banners removidos.
- Home apresenta apenas título, busca e exemplos. Nenhum perfil aparece sem ação do visitante.
- Consulta abre página própria; retorno à home restaura a tela simples.
- Dados adicionais e proveniência em expansões; histórico, atividades e JSON em abas.
- Fluxos desktop/mobile atualizados e aprovados; home e perfil sem violações automáticas Axe.
- Direção e evidências documentadas em [`DESIGN.md`](../DESIGN.md).
