import Link from 'next/link';
import { ArrowRight, BookOpen, Braces, Code2, ShieldCheck } from 'lucide-react';
import { JsonViewer } from '@/components/json-viewer';
export const metadata = { title: 'Documentação' };
const endpoints = [
  ['/companies/:cnpj', 'Identidade oficial, CNAEs, atividades observadas e proveniência.'],
  ['/companies/:cnpj/history', 'Snapshots imutáveis e disponibilidade de comparação.'],
  ['/companies/:cnpj/changes', 'Eventos entre versões oficiais consecutivas.'],
  ['/companies/:cnpj/activities', 'Classificações, confiança qualitativa e evidências.'],
  ['/health', 'Estado do serviço e adaptadores configurados.'],
];
export default function Documentation() {
  return (
    <div className="page-container docs-page">
      <div className="eyebrow">
        <BookOpen size={14} />
        DOCUMENTAÇÃO
      </div>
      <h1>
        Contexto pronto
        <br />
        <span>para o seu código.</span>
      </h1>
      <p className="page-intro">
        Uma API REST simples para conhecer empresas brasileiras.
        <br />
        Mesmos dados, mesmas fontes, em todas as interfaces.
      </p>
      <div className="docs-layout">
        <nav className="docs-toc" aria-label="Nesta página">
          <p>NESTA PÁGINA</p>
          <a href="#quickstart">Primeira consulta</a>
          <a href="#endpoints">Endpoints</a>
          <a href="#provenance">Proveniência</a>
          <a href="#errors">Erros e limites</a>
          <a href="#mcp">Integração MCP</a>
        </nav>
        <div className="docs-content">
          <section id="quickstart">
            <div className="section-number">01 / COMEÇAR</div>
            <h2>Sua primeira consulta</h2>
            <p>
              O explorador é público e não exige cadastro. A API possui limites de consumo por
              janela e limite global diário. Use o domínio onde a aplicação está publicada.
            </p>
            <pre className="code-block">
              <code>{`# Replace BASE_URL with your Empresa deployment\nBASE_URL="http://localhost:3000"\ncurl "$BASE_URL/api/v1/companies/19131243000197"`}</code>
            </pre>
            <p>
              Os identificadores aceitam CNPJ numérico e alfanumérico, com ou sem pontuação. As
              propriedades JSON utilizam inglês.
            </p>
            <JsonViewer
              data={{
                data: { cnpj: '19131243000197', legalName: 'OPEN KNOWLEDGE BRASIL' },
                meta: {
                  source: 'Estrutura ilustrativa: a resposta completa inclui metadados reais',
                  datasetPeriod: null,
                },
              }}
            />
            <p className="caption">
              Exemplo reduzido de estrutura. Consulte o endpoint para obter a resposta completa e
              suas datas de coleta.
            </p>
          </section>
          <section id="endpoints">
            <div className="section-number">02 / API REST</div>
            <h2>Endpoints</h2>
            <p>
              Base da API: <code>/api/v1</code>. Respostas em JSON, com <code>data</code> e{' '}
              <code>meta</code>.
            </p>
            <div className="endpoint-list">
              {endpoints.map(([path, description]) => (
                <div key={path}>
                  <span className="method-badge">GET</span>
                  <div>
                    <code>{path}</code>
                    <p>{description}</p>
                  </div>
                </div>
              ))}
            </div>
            <h3>Exemplo TypeScript</h3>
            <pre className="code-block">
              <code>{`const response = await fetch(\n  \`\u0024{baseUrl}/api/v1/companies/19131243000197\`\n);\nif (!response.ok) {\n  const { error } = await response.json();\n  throw new Error(error.message);\n}\nconst { data, meta } = await response.json();\nconsole.log(data.legalName, meta.retrievedAt);`}</code>
            </pre>
          </section>
          <section id="provenance">
            <div className="section-number">03 / QUALIDADE</div>
            <h2>A fonte faz parte da resposta.</h2>
            <p>
              Cada consulta identifica fonte, URL, coleta, competência quando informada, hash do
              conteúdo e versão do schema. Data de coleta não equivale à data de atualização do
              cadastro.
            </p>
            <p>
              A amostra inicial utiliza BrasilAPI, que consulta dados cadastrais via Minha Receita.
              Essa resposta não informa competência do dataset; portanto <code>datasetPeriod</code>{' '}
              é <code>null</code>.
            </p>
            <p>
              O histórico distingue observações via API de snapshots oficiais. Eventos são emitidos
              apenas entre snapshots oficiais da mesma fonte, em ordem cronológica. Reprocessamentos
              não duplicam snapshots ou eventos.
            </p>
            <Link className="inline-link" href="/fontes">
              Ler fontes e metodologia <ArrowRight size={14} />
            </Link>
          </section>
          <section id="errors">
            <div className="section-number">04 / CONSUMO RESPONSÁVEL</div>
            <h2>Erros e limites</h2>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>HTTP</th>
                    <th>Código</th>
                    <th>O que significa</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['400', 'INVALID_CNPJ', 'Identificador inválido.'],
                    ['404', 'NOT_IN_COVERAGE', 'Ausente da cobertura; não comprova inexistência.'],
                    ['429', 'RATE_LIMIT_EXCEEDED', 'Aguarde o período indicado em Retry-After.'],
                    ['500', 'INTERNAL_ERROR', 'Erro interno sem exposição de detalhes.'],
                    ['503', 'SERVICE_UNAVAILABLE', 'Fonte, persistência ou proteção indisponível.'],
                  ].map((row) => (
                    <tr key={row[0]}>
                      {row.map((cell, index) => (
                        <td key={index}>{index === 1 ? <code>{cell}</code> : cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              Padrão: 30 requisições por minuto por origem e 5.000 por dia no total. Limites
              configuráveis no servidor. Em desenvolvimento local, o limite é compartilhado; em
              produção Vercel, a origem usa apenas o cabeçalho confiável da plataforma.
            </p>
            <p>
              Observe <code>X-RateLimit-Remaining</code>, <code>Retry-After</code> e{' '}
              <code>X-Request-Id</code>. Postgres guarda consultas já coletadas. Redis aplica
              contadores distribuídos; sua ausência em produção retorna 503.
            </p>
          </section>
          <section id="mcp">
            <div className="section-number">05 / AGENTES</div>
            <h2>
              <Braces size={25} />
              MCP de leitura <span className="beta-badge">BETA</span>
            </h2>
            <p>
              Adaptador remoto Streamable HTTP em <code>/api/mcp</code>. Desabilitado por padrão até
              a configuração de chave Bearer e limites. A aplicação não distribui chaves
              automaticamente.
            </p>
            <div className="tool-grid">
              {[
                'get_company',
                'get_company_history',
                'get_company_changes',
                'get_company_activities',
              ].map((tool) => (
                <code key={tool}>
                  <Code2 size={14} />
                  {tool}
                </code>
              ))}
            </div>
            <pre className="code-block">
              <code>{`{\n  "mcpServers": {\n    "empresa": {\n      "url": "https://YOUR_DOMAIN/api/mcp",\n      "headers": {\n        "Authorization": "Bearer YOUR_API_KEY"\n      }\n    }\n  }\n}`}</code>
            </pre>
            <div className="info-callout">
              <ShieldCheck size={20} />
              <div>
                <strong>Mesmas regras. Mais possibilidades.</strong>
                <p>
                  Ferramentas somente de leitura, resultados com fontes e erros estruturados. Não
                  realiza análise fiscal ou jurídica.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
