'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Braces,
  Building2,
  CheckCheck,
  ChevronRight,
  Clock3,
  Copy,
  Database,
  ExternalLink,
  Fingerprint,
  History,
  Info,
  LoaderCircle,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import type { CompanyRecord, CompanyResponse, ObservedActivity } from '@/lib/company';
import { formatCnpj, formatDate, formatPeriod, isValidCnpj, normalizeCnpj } from '@/lib/cnpj';
import { Button } from './ui/button';
import { JsonViewer } from './json-viewer';
import { ContextDiagram } from './context-diagram';
type Example = {
  cnpj: string;
  name: string;
  city: string;
  state: string;
  status: string;
  activity: string;
  observedCount: number;
};
type Tab = 'overview' | 'history' | 'activities' | 'json';
const tabs = [
  { id: 'overview', label: 'Visão geral', icon: Building2 },
  { id: 'history', label: 'Histórico', icon: History },
  { id: 'activities', label: 'Atividades observadas', icon: Fingerprint },
  { id: 'json', label: 'JSON', icon: Braces },
] as const;
function companyName(name: string) {
  return name === 'OPEN KNOWLEDGE BRASIL'
    ? 'Open Knowledge Brasil'
    : name === 'BANCO DO BRASIL SA'
      ? 'Banco do Brasil'
      : name === 'MAGAZINE LUIZA S/A'
        ? 'Magazine Luiza'
        : name;
}
export function Explorer({
  initialRecord,
  examples,
  initialCnpj,
}: {
  initialRecord: CompanyRecord | null;
  examples: Example[];
  initialCnpj?: string;
}) {
  const router = useRouter();
  const params = useSearchParams(),
    [record, setRecord] = useState(initialRecord),
    [input, setInput] = useState(initialCnpj ? formatCnpj(initialCnpj) : ''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [tab, setTab] = useState<Tab>('overview'),
    [shared, setShared] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null),
    resultRef = useRef<HTMLDivElement>(null),
    abortRef = useRef<AbortController | null>(null);
  useEffect(() => {
    const target = params.get('tab');
    if (tabs.some((t) => t.id === target)) setTab(target as Tab);
  }, [params]);
  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  }, []);
  const lookup = useCallback(
    async (raw: string, scroll = true) => {
      const cnpj = normalizeCnpj(raw);
      if (!isValidCnpj(cnpj)) {
        setError('CNPJ inválido. Confira os 14 caracteres e os dígitos verificadores.');
        inputRef.current?.focus();
        return;
      }
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setBusy(true);
      setError('');
      setInput(formatCnpj(cnpj));
      try {
        // Persist the first lookup before requesting related resources on other instances.
        const profileResponse = await fetch(`/api/v1/companies/${cnpj}`, {
          signal: controller.signal,
        });
        const profile: CompanyResponse & { error?: { message: string } } =
          await profileResponse.json();
        if (!profileResponse.ok)
          throw new Error(profile.error?.message ?? 'Consulta indisponível. Tente novamente.');
        const responses = await Promise.all(
          ['/history', '/changes'].map((suffix) =>
            fetch(`/api/v1/companies/${cnpj}${suffix}`, { signal: controller.signal }),
          ),
        );
        const [history, changes] = await Promise.all(
          responses.map(async (response) => {
            if (!response.ok)
              throw new Error('Não foi possível carregar histórico. Tente novamente.');
            return response.json();
          }),
        );
        const { observedActivities, ...company } = profile.data;
        // Keep cached route state tied to its own CNPJ. Home only navigates.
        if (initialCnpj === cnpj) {
          setRecord({
            company,
            observedActivities,
            snapshots: history.data,
            changes: changes.data,
          });
          setTab('overview');
          router.replace(`/empresa/${cnpj}`, { scroll: false });
        } else {
          setInput(initialCnpj ? formatCnpj(initialCnpj) : '');
          router.push(`/empresa/${cnpj}`, { scroll: false });
        }
        if (scroll)
          setTimeout(
            () => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
            50,
          );
      } catch (reason) {
        if ((reason as Error).name !== 'AbortError') setError((reason as Error).message);
      } finally {
        if (abortRef.current === controller) setBusy(false);
      }
    },
    [router, initialCnpj],
  );
  useEffect(() => {
    if (initialCnpj && !initialRecord) void lookup(initialCnpj, false);
    return () => abortRef.current?.abort();
  }, [initialCnpj, initialRecord, lookup]);
  function selectTab(next: Tab) {
    setTab(next);
    const path = record ? `/empresa/${record.company.cnpj}` : '/';
    window.history.replaceState(null, '', `${path}${next === 'overview' ? '' : `?tab=${next}`}`);
  }
  async function share() {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/empresa/${record!.company.cnpj}${tab === 'overview' ? '' : `?tab=${tab}`}`,
      );
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      setError('Copie o endereço da página para compartilhar.');
    }
  }
  const company = record?.company,
    snapshot = record?.snapshots.at(-1),
    primary = company?.declaredActivities.find((a) => a.primary);
  const response =
    company && record && snapshot
      ? {
          data: { ...company, observedActivities: record.observedActivities },
          meta: {
            ...snapshot.source,
            snapshotId: snapshot.id,
            contentHash: snapshot.contentHash,
            schemaVersion: snapshot.schemaVersion,
          },
        }
      : null;
  const isDetail = Boolean(company || initialCnpj);
  const searchForm = (
    <section id="consulta" className="search-section" aria-label="Consulta empresarial">
      <form
        className="search-form"
        onSubmit={(event) => {
          event.preventDefault();
          void lookup(input);
        }}
      >
        <label htmlFor="cnpj">CNPJ da empresa</label>
        <div className="search-field">
          <Search size={19} />
          <input
            ref={inputRef}
            id="cnpj"
            placeholder="00.000.000/0000-00"
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setError('');
            }}
            autoComplete="off"
            spellCheck={false}
            maxLength={18}
            aria-invalid={!!error}
            aria-describedby={error ? 'search-error' : 'search-help'}
          />
          <kbd>⌘ K</kbd>
        </div>
        <Button type="submit" disabled={busy}>
          {busy ? <LoaderCircle size={17} className="spin" /> : null}
          {busy ? 'Consultando…' : 'Consultar empresa'}
          {!busy ? <ArrowUpRight size={17} /> : null}
        </Button>
      </form>
      <p className="search-caption" id="search-help">
        Consulta pública, sem cadastro.
      </p>
      {error ? (
        <div id="search-error" className="error-message" role="alert">
          <Info size={17} />
          {error}
        </div>
      ) : null}
    </section>
  );
  return (
    <div className={`page-container ${isDetail ? 'result-page' : 'home-page'}`}>
      {!isDetail ? (
        <>
          <section className="hero" aria-labelledby="hero-title">
            <p className="eyebrow">CONTEXTO EMPRESARIAL · BRASIL</p>
            <div className="hero-layout">
              <div className="hero-copy">
                <h1 id="hero-title">
                  Conheça a empresa.
                  <br />
                  <span>Além do CNPJ.</span>
                </h1>
              </div>
              <div className="hero-action">
                <p className="hero-description">
                  Dados empresariais, atividades e histórico. Com fontes para você ir além do
                  cadastro.
                </p>
                {searchForm}
              </div>
            </div>
          </section>
          <section className="examples-section" aria-label="Empresas de exemplo">
            <p>Quer experimentar?</p>
            <div className="example-list">
              {examples.map((example) => (
                <button
                  key={example.cnpj}
                  onClick={() => void lookup(example.cnpj)}
                  disabled={busy}
                >
                  {companyName(example.name)}
                  <ArrowUpRight size={14} />
                </button>
              ))}
            </div>
          </section>
          <ContextDiagram />
        </>
      ) : (
        <div className="result-search">
          <Link href="/" className="back-link">
            <ArrowLeft size={14} />
            Nova consulta
          </Link>
          {searchForm}
        </div>
      )}
      {company && record && snapshot ? (
        <section
          ref={resultRef}
          className="company-section"
          aria-label="Perfil da empresa"
          aria-busy={busy}
        >
          <div className="company-header">
            <div className="company-heading">
              <p className="eyebrow">PERFIL EMPRESARIAL</p>
              <h1>{companyName(company.legalName)}</h1>
              <div className="company-subtitle">
                <span className="mono">{formatCnpj(company.cnpj)}</span>
                <span
                  className={`badge ${company.registrationStatus === 'ATIVA' ? 'badge-green' : 'badge-neutral'}`}
                >
                  <span className="status-dot" />
                  {company.registrationStatus}
                </span>
                <span>
                  {company.address.city}, {company.address.state}
                </span>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={share}>
              {shared ? <CheckCheck size={15} /> : <Copy size={15} />}
              <span>{shared ? 'Link copiado' : 'Compartilhar'}</span>
            </Button>
          </div>
          <div className="company-panel">
            <div className="profile-tabs" role="tablist" aria-label="Dados da empresa">
              {tabs.map(({ id, label }, index) => (
                <button
                  key={id}
                  type="button"
                  id={`tab-${id}`}
                  role="tab"
                  aria-controls={`panel-${id}`}
                  aria-selected={tab === id}
                  tabIndex={tab === id ? 0 : -1}
                  onClick={() => selectTab(id)}
                  onKeyDown={(event) => {
                    if (['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) {
                      event.preventDefault();
                      const next =
                        event.key === 'Home'
                          ? 0
                          : event.key === 'End'
                            ? tabs.length - 1
                            : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) %
                              tabs.length;
                      selectTab(tabs[next].id);
                      document.getElementById(`tab-${tabs[next].id}`)?.focus();
                    }
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <div
              role="tabpanel"
              id={`panel-${tab}`}
              aria-labelledby={`tab-${tab}`}
              className="tab-content"
              tabIndex={0}
            >
              {tab === 'overview' ? (
                <>
                  <div className="overview-grid">
                    <div className="identity-data">
                      <h2 className="panel-title">O essencial.</h2>
                      <dl className="data-grid">
                        <div className="data-wide">
                          <dt>Razão social</dt>
                          <dd>{company.legalName}</dd>
                        </div>
                        <div>
                          <dt>Data de abertura</dt>
                          <dd>{formatDate(company.openedAt)}</dd>
                        </div>
                        <div>
                          <dt>Estabelecimento</dt>
                          <dd>
                            {company.establishmentType === 'HEADQUARTERS' ? 'Matriz' : 'Filial'}
                          </dd>
                        </div>
                        <div className="data-wide">
                          <dt>Endereço</dt>
                          <dd>
                            {company.address.street}, {company.address.number}
                            <small>
                              {company.address.city}/{company.address.state} · CEP{' '}
                              {company.address.postalCode}
                            </small>
                          </dd>
                        </div>
                      </dl>
                      <details className="additional-data">
                        <summary>
                          Mais dados cadastrais
                          <ChevronRight size={15} />
                        </summary>
                        <dl className="data-grid">
                          <div className="data-wide">
                            <dt>Nome fantasia</dt>
                            <dd>{company.tradeName ?? 'Não informado'}</dd>
                          </div>
                          <div>
                            <dt>Natureza jurídica</dt>
                            <dd>{company.legalNature ?? 'Não informada'}</dd>
                          </div>
                          <div>
                            <dt>CNPJ básico · pessoa jurídica</dt>
                            <dd className="mono">{company.rootCnpj}</dd>
                          </div>
                          <div className="data-wide">
                            <dt>Complemento e bairro</dt>
                            <dd>
                              {company.address.complement ?? 'Sem complemento'} ·{' '}
                              {company.address.district}
                            </dd>
                          </div>
                        </dl>
                      </details>
                    </div>
                    <div className="context-data">
                      <h2 className="panel-title">Atividade declarada.</h2>
                      <div className="primary-activity">
                        <span className="activity-code">CNAE {primary?.code}</span>
                        <strong>{primary?.name}</strong>
                      </div>
                      <details className="secondary-details">
                        <summary>
                          {company.declaredActivities.filter((a) => !a.primary).length} atividades
                          secundárias
                          <ChevronRight size={15} />
                        </summary>
                        <ul>
                          {company.declaredActivities
                            .filter((a) => !a.primary)
                            .map((a) => (
                              <li key={a.code}>
                                <code>{a.code}</code>
                                {a.name}
                              </li>
                            ))}
                        </ul>
                      </details>
                      <button className="activity-link" onClick={() => selectTab('activities')}>
                        {record.observedActivities.length
                          ? 'Ver atividades com evidências'
                          : 'Consultar análise de atividades'}
                        <ArrowUpRight size={15} />
                      </button>
                    </div>
                  </div>
                  <details className="provenance-details">
                    <summary>
                      <ShieldCheck size={16} />
                      <span>Fonte e atualidade dos dados</span>
                      <span className="provenance-date">
                        Coleta: {formatDate(snapshot.source.retrievedAt)}
                      </span>
                      <ChevronRight size={15} />
                    </summary>
                    <div>
                      <p>
                        Fonte:{' '}
                        <a href={snapshot.source.url} target="_blank" rel="noreferrer">
                          {snapshot.source.kind === 'PUBLIC_API'
                            ? 'BrasilAPI / Receita Federal'
                            : snapshot.source.name}
                          <ArrowUpRight size={12} />
                        </a>
                      </p>
                      <p>
                        Competência: {formatPeriod(snapshot.source.datasetPeriod)}. Data de coleta
                        não equivale à atualização do cadastro.
                      </p>
                      <Link href="/fontes">
                        Entender a metodologia
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </details>
                </>
              ) : null}
              {tab === 'history' ? <HistoryPanel record={record} /> : null}
              {tab === 'activities' ? (
                <ActivitiesPanel activities={record.observedActivities} />
              ) : null}
              {tab === 'json' ? (
                <JsonViewer data={response} filename={`empresa-${company.cnpj}.json`} />
              ) : null}
            </div>
          </div>
        </section>
      ) : isDetail && busy ? (
        <div className="loading-panel" role="status">
          <LoaderCircle className="spin" size={24} />
          Buscando dados empresariais…
        </div>
      ) : null}
    </div>
  );
}

function HistoryPanel({ record }: { record: CompanyRecord }) {
  const [previous, setPrevious] = useState(''),
    [current, setCurrent] = useState('');
  const comparable = record.snapshots.filter((s) => s.source.kind === 'OFFICIAL_DATASET');
  const prev = comparable.find((s) => s.id === previous),
    next = comparable.find((s) => s.id === current);
  const sameSource = prev
    ? comparable.filter((snapshot) => snapshot.source.id === prev.source.id)
    : [];
  const valid =
    prev &&
    next &&
    prev.source.id === next.source.id &&
    prev.source.datasetPeriod! < next.source.datasetPeriod! &&
    sameSource.indexOf(next) === sameSource.indexOf(prev) + 1;
  const changes = record.changes.filter(
    (c) => c.previousSnapshotId === previous && c.currentSnapshotId === current,
  );
  return (
    <div className="history-panel">
      <div className="panel-subheading">
        <History size={17} />
        <h4>Histórico verificável</h4>
        <span className="muted-tag">
          {record.snapshots.length} OBSERVAÇÃO{record.snapshots.length === 1 ? '' : 'ÕES'}
        </span>
      </div>
      {comparable.length < 2 ? (
        <div className="info-callout">
          <Clock3 size={21} />
          <div>
            <strong>A história começa com dados verificáveis.</strong>
            <p>
              Precisamos de dois snapshots oficiais autênticos e comparáveis para detectar
              alterações. A coleta atual é uma observação via API e não permite reconstruir mudanças
              passadas.
            </p>
          </div>
        </div>
      ) : (
        <div className="comparison-controls">
          <label>
            Versão anterior
            <select value={previous} onChange={(e) => setPrevious(e.target.value)}>
              <option value="">Selecione</option>
              {comparable.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.source.datasetPeriod}
                </option>
              ))}
            </select>
          </label>
          <ArrowRight size={18} />
          <label>
            Versão seguinte
            <select value={current} onChange={(e) => setCurrent(e.target.value)}>
              <option value="">Selecione</option>
              {comparable.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.source.datasetPeriod}
                </option>
              ))}
            </select>
          </label>
          {previous && current && !valid ? (
            <p role="alert">
              Escolha versões oficiais consecutivas da mesma fonte, em ordem cronológica.
            </p>
          ) : null}
        </div>
      )}
      {valid ? (
        <div className="diff-list">
          {changes.length ? (
            changes.map((c) => (
              <div key={c.id} className="diff-card">
                <code>{c.eventType}</code>
                <div>
                  <pre>{JSON.stringify(c.previousValue, null, 2)}</pre>
                  <ArrowRight size={16} />
                  <pre>{JSON.stringify(c.currentValue, null, 2)}</pre>
                </div>
              </div>
            ))
          ) : (
            <p>
              Sem alterações registradas entre estas versões. O diff é calculado entre snapshots
              consecutivos.
            </p>
          )}
        </div>
      ) : null}
      <div className="timeline">
        {[...record.snapshots].reverse().map((s) => (
          <div className="timeline-item" key={s.id}>
            <span className="timeline-icon">
              <Database size={15} />
            </span>
            <div>
              <span className="timeline-date">{formatDate(s.source.retrievedAt, true)}</span>
              <h5>
                {s.source.kind === 'OFFICIAL_DATASET'
                  ? 'Snapshot oficial importado'
                  : 'Primeira observação cadastral via API'}
              </h5>
              <p>{s.source.name}</p>
              <p>Competência: {formatPeriod(s.source.datasetPeriod)}</p>
              <details>
                <summary>Ver integridade e origem</summary>
                <dl className="integrity-data">
                  <dt>Hash SHA-256</dt>
                  <dd>{s.contentHash}</dd>
                  <dt>Schema</dt>
                  <dd>v{s.schemaVersion}</dd>
                  <dt>Ingestão</dt>
                  <dd>{formatDate(s.ingestedAt, true)}</dd>
                  <dt>Fonte</dt>
                  <dd>
                    <a href={s.source.url} target="_blank" rel="noreferrer">
                      Abrir fonte <ExternalLink size={12} />
                    </a>
                  </dd>
                </dl>
              </details>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
function ActivitiesPanel({ activities }: { activities: ObservedActivity[] }) {
  const statuses = {
    COMPATIBLE: 'Compatível',
    POSSIBLE_DIVERGENCE: 'Possível divergência',
    INSUFFICIENT_EVIDENCE: 'Evidência insuficiente',
    NOT_ANALYZED: 'Não analisado',
  };
  const confidences = { HIGH: 'Alta', MEDIUM: 'Média', LOW: 'Baixa', INCONCLUSIVE: 'Inconclusiva' };
  return (
    <div className="activities-panel">
      <div className="panel-subheading">
        <Sparkles size={17} />
        <h4>O que as evidências mostram</h4>
        <span className="muted-tag">ATIVIDADE OBSERVADA</span>
      </div>
      <p className="section-description">
        Inferências sobre produtos e serviços públicos, consideradas junto aos CNAEs principais e
        secundários.
      </p>
      {activities.length ? (
        activities.map((activity) => (
          <article className="activity-card" key={activity.id}>
            <div className="activity-heading">
              <div>
                <span className="eyebrow small-eyebrow">{activity.category}</span>
                <h5>{activity.activityName}</h5>
              </div>
              <span
                className={`badge ${activity.classificationStatus === 'COMPATIBLE' ? 'badge-green' : 'badge-neutral'}`}
              >
                {statuses[activity.classificationStatus]}
              </span>
            </div>
            <div className="activity-meta">
              <span>
                Confiança <strong>{confidences[activity.confidenceLevel]}</strong>
              </span>
              <span>
                CNAEs relacionados{' '}
                <code>{activity.possibleCnaes.join(', ') || 'Não definidos'}</code>
              </span>
              <span>Análise {formatDate(activity.analyzedAt)}</span>
            </div>
            <details className="evidence-details">
              <summary>
                <ShieldCheck size={15} />
                {activity.evidence.length}{' '}
                {activity.evidence.length > 1 ? 'evidências verificáveis' : 'evidência verificável'}
                <ChevronRight size={15} />
              </summary>
              {activity.evidence.map((e) => (
                <div className="evidence" key={e.sourceUrl + e.contentHash}>
                  <blockquote>{e.excerpt}</blockquote>
                  <a href={e.sourceUrl} target="_blank" rel="noreferrer">
                    {new URL(e.sourceUrl).hostname}
                    {new URL(e.sourceUrl).pathname}
                    <ArrowUpRight size={13} />
                  </a>
                  <p>
                    Coleta: {formatDate(e.collectedAt)} ·{' '}
                    {e.sourceType === 'OFFICIAL_WEBSITE' ? 'Site oficial' : 'Fonte pública'}
                  </p>
                  <p>{e.association}</p>
                  <small>SHA-256: {e.contentHash}</small>
                </div>
              ))}
              <p className="review-note">
                Método: {activity.modelVersion} · Revisão: {activity.reviewedBy}
              </p>
            </details>
          </article>
        ))
      ) : (
        <div className="empty-panel">
          <Fingerprint size={28} />
          <h3>Não analisado</h3>
          <p>
            Ainda não existem evidências revisadas para este CNPJ. Ausência de análise não indica
            ausência de atividades.
          </p>
        </div>
      )}
      <div className="responsibility-note">
        <Info size={15} />
        <p>
          Atividades observadas são inferências. Uma possível divergência com o CNAE não comprova
          irregularidade. Confiança qualitativa, sem percentuais estatísticos.
        </p>
      </div>
    </div>
  );
}
