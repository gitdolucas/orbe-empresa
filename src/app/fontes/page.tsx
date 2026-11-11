import Link from 'next/link';
import { ArrowUpRight, Database, Fingerprint, GitBranch, ShieldCheck } from 'lucide-react';
import { getExamples } from '@/server/repository';
export const metadata = { title: 'Fontes e metodologia' };
export default function Sources() {
  return (
    <div className="page-container docs-page sources-page">
      <div className="eyebrow">
        <Database size={14} />
        FONTES E METODOLOGIA
      </div>
      <h1>
        Confiança começa
        <br />
        <span>pela origem.</span>
      </h1>
      <p className="page-intro">
        Informação oficial, observação e inferência têm papéis diferentes.
        <br />
        Aqui, cada uma tem seu lugar e sua fonte.
      </p>
      <div className="source-summary">
        <div>
          <strong>{getExamples().length}</strong>
          <span>Empresas na amostra inicial</span>
        </div>
        <div>
          <strong>API pública</strong>
          <span>Origem cadastral inicial</span>
        </div>
        <div>
          <strong>Qualitativa</strong>
          <span>Confiança das análises</span>
        </div>
      </div>
      <div className="source-cards">
        <article>
          <ShieldCheck size={24} />
          <span className="section-number">01 / CADASTRO</span>
          <h2>Identidade oficial</h2>
          <p>
            Dados cadastrais obtidos via BrasilAPI / Minha Receita, derivados do cadastro da Receita
            Federal. O payload original é normalizado e somente campos empresariais necessários são
            armazenados.
          </p>
          <p>
            Competência não informada pelo intermediário permanece ausente. A data de coleta indica
            quando a aplicação consultou a API, sem atestar atualização cadastral.
          </p>
          <a href="https://brasilapi.com.br/docs" target="_blank" rel="noreferrer">
            Documentação BrasilAPI <ArrowUpRight size={14} />
          </a>
          <a href="https://dadosabertos.rfb.gov.br/CNPJ/" target="_blank" rel="noreferrer">
            Dados abertos da Receita Federal <ArrowUpRight size={14} />
          </a>
        </article>
        <article>
          <GitBranch size={24} />
          <span className="section-number">02 / TEMPO</span>
          <h2>Histórico autêntico</h2>
          <p>
            Snapshots registram conteúdo, hash SHA-256, referência, ingestão e versão do schema.
            Dados existentes não são substituídos por reprocessamentos.
          </p>
          <p>
            A amostra inicial tem uma observação por CNPJ. Não contém dois snapshots oficiais
            comparáveis; por isso, não apresentamos alterações históricas. A infraestrutura de
            importação e comparação está preparada para recebê-los.
          </p>
          <Link href="/empresa/19131243000197?tab=history">
            Explorar observações disponíveis <ArrowUpRight size={14} />
          </Link>
        </article>
        <article>
          <Fingerprint size={24} />
          <span className="section-number">03 / CONTEXTO</span>
          <h2>Atividades com evidências</h2>
          <p>
            A amostra Open Knowledge Brasil utiliza o site oficial, cuja página de apoio publica
            razão social e CNPJ. As atividades são extraídas de sua página de serviços, com fonte,
            trecho e data de coleta.
          </p>
          <p>
            O método inicial usa taxonomia controlada e revisão assistida. Os CNAEs secundários
            entram na comparação. Confiança é qualitativa; não representa probabilidade estatística
            calibrada.
          </p>
          <a href="https://ok.org.br/apoie/" target="_blank" rel="noreferrer">
            Ver associação entre site e CNPJ <ArrowUpRight size={14} />
          </a>
          <a
            href="https://ok.org.br/eixos-de-atuacao/prestacao-de-servicos/"
            target="_blank"
            rel="noreferrer"
          >
            Ver fonte das atividades <ArrowUpRight size={14} />
          </a>
        </article>
      </div>
      <section className="methodology-section">
        <span className="eyebrow small-eyebrow">TRANSPARÊNCIA POR PADRÃO</span>
        <h2>Os limites também fazem parte dos dados.</h2>
        <div className="methodology-grid">
          <div>
            <h3>Cobertura experimental</h3>
            <p>
              Sem promessa de cobertura nacional. CNPJs fora da amostra são consultados no provedor
              quando disponível e persistidos no repositório configurado.
            </p>
          </div>
          <div>
            <h3>Sem conclusões de irregularidade</h3>
            <p>
              Possível divergência entre atividades observadas e CNAEs não constitui conclusão
              fiscal ou jurídica.
            </p>
          </div>
          <div>
            <h3>Dados pessoais minimizados</h3>
            <p>
              O MVP descarta sócios, CPF, e-mail e telefone do payload de origem. Logs não armazenam
              o CNPJ consultado nem IP em texto aberto.
            </p>
          </div>
          <div>
            <h3>Implantação e serviços</h3>
            <p>
              Publicação depende de Vercel, Postgres e Redis configurados. MCP exige habilitação
              explícita e chave de acesso. Monitoramento comercial e billing ficam fora deste MVP.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
