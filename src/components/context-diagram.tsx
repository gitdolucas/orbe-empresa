'use client';

import { useId, useState, type CSSProperties } from 'react';
import { Pause, Play } from 'lucide-react';
import styles from './context-diagram.module.css';

const sources = [
  {
    title: 'Cadastro público',
    short: 'Cadastro',
    detail: 'CNPJ · CNAEs · situação',
    mobile: 'CNPJ · CNAEs',
    icon: 'registry',
  },
  {
    title: 'Evidências públicas',
    short: 'Evidências',
    detail: 'Sites · documentos · fontes',
    mobile: 'Sites · fontes',
    icon: 'evidence',
  },
  {
    title: 'Coletas no tempo',
    short: 'Coletas',
    detail: 'Fonte · data · versão',
    mobile: 'Data · versão',
    icon: 'time',
  },
] as const;

const outcomes = [
  { title: 'Quem é', detail: 'Identidade e cadastro', mobile: 'Identidade', icon: 'identity' },
  {
    title: 'O que faz',
    detail: 'Atividades com evidências',
    mobile: 'Atividades',
    icon: 'activity',
  },
  {
    title: 'O que mudou',
    detail: 'Histórico, quando disponível',
    mobile: 'Histórico',
    icon: 'history',
  },
] as const;

function Glyph({ name, x, y }: { name: string; x: number; y: number }) {
  const paths: Record<string, string> = {
    registry: 'M4 20V4h12v16M1 20h18M8 8h4M8 12h4M8 16h4',
    evidence: 'M6 2h8l4 4v14H6zM14 2v5h4M9 11h6M9 15h6M2 6v16h12',
    time: 'M4 6a8 8 0 1 1-1 10M4 1v5h5M12 6v6l4 2',
    identity: 'M3 20V8l8-5 8 5v12zM8 20v-6h6v6M7 9h1M14 9h1',
    activity: 'M2 16l6-6 4 4 8-10M14 4h6v6',
    history: 'M5 3v18M5 6h13M5 12h9M5 18h13',
  };
  return (
    <g
      transform={`translate(${x} ${y})`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name]} />
    </g>
  );
}

function Graph({ vertical = false }: { vertical?: boolean }) {
  const id = useId();
  const inputPaths = vertical
    ? [
        'M52 90V123Q52 139 68 139H98Q114 139 114 155V194',
        'M170 90V194',
        'M288 90V123Q288 139 272 139H242Q226 139 226 155V194',
      ]
    : [
        'M240 54H302Q322 54 322 74V88Q322 108 342 108H430',
        'M240 150H430',
        'M240 246H302Q322 246 322 226V212Q322 192 342 192H430',
      ];
  const outputPaths = vertical
    ? [
        'M114 402V441Q114 457 98 457H68Q52 457 52 473V512',
        'M170 402V512',
        'M226 402V441Q226 457 242 457H272Q288 457 288 473V512',
      ]
    : [
        'M690 108H778Q798 108 798 88V74Q798 54 818 54H880',
        'M690 150H880',
        'M690 192H778Q798 192 798 212V226Q798 246 818 246H880',
      ];
  const centerX = vertical ? 26 : 430;
  const centerY = vertical ? 194 : 38;
  const centerWidth = vertical ? 288 : 260;

  return (
    <svg
      className={vertical ? styles.vertical : styles.horizontal}
      viewBox={vertical ? '0 0 340 602' : '0 0 1120 300'}
      role="img"
      aria-labelledby={`${id}-title ${id}-description`}
    >
      <title id={`${id}-title`}>De dados públicos a contexto empresarial</title>
      <desc id={`${id}-description`}>
        Cadastro público, evidências de sites e documentos e coletas datadas se conectam em um
        perfil empresarial. Entenda quem é a empresa, o que faz e o que mudou. Histórico depende de
        versões comparáveis disponíveis. Diagrama ilustrativo, sem dados de uma empresa real.
      </desc>

      <g fill="none" strokeLinecap="round" aria-hidden="true">
        {[...inputPaths, ...outputPaths].map((path, index) => (
          <g key={path}>
            <path d={path} className={styles.track} />
            <path
              d={path}
              pathLength="100"
              className={styles.packet}
              style={
                {
                  '--delay': `${index < 3 ? index * 0.55 : 3.5 + (index - 3) * 0.55}s`,
                } as CSSProperties
              }
            />
          </g>
        ))}
      </g>

      {sources.map((source, index) => {
        const x = vertical ? index * 118 : 0;
        const y = vertical ? 0 : 22 + index * 96;
        return (
          <g key={source.icon} transform={`translate(${x} ${y})`} aria-hidden="true">
            <rect
              className={styles.sourceCard}
              x="0.5"
              y="0.5"
              width={vertical ? 103 : 239}
              height={vertical ? 89 : 63}
              rx="8"
            />
            <Glyph name={source.icon} x={vertical ? 41 : 17} y={vertical ? 12 : 20} />
            <text
              className={styles.nodeTitle}
              x="52"
              y={vertical ? 53 : 27}
              textAnchor={vertical ? 'middle' : 'start'}
            >
              {vertical ? source.short : source.title}
            </text>
            <text
              className={styles.nodeDetail}
              x="52"
              y={vertical ? 73 : 45}
              textAnchor={vertical ? 'middle' : 'start'}
            >
              {vertical ? source.mobile : source.detail}
            </text>
          </g>
        );
      })}

      <g transform={`translate(${centerX} ${centerY})`} aria-hidden="true">
        <rect
          className={styles.centerCard}
          x="0.5"
          y="0.5"
          width={centerWidth - 1}
          height={vertical ? 207 : 223}
          rx="12"
        />
        <path className={styles.centerRule} d={`M1 78H${centerWidth - 1}`} />
        <circle cx="37" cy="39" r="18" className={styles.brandDisc} />
        <path
          d="M37 28v22M27.5 33.5l19 11M27.5 44.5l19-11"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <text x="66" y="38" className={styles.brand}>
          empresa.
        </text>
        <text x="66" y="56" className={styles.centerSubtitle}>
          Um perfil. Mais contexto.
        </text>
        {['Identidade conectada', 'Atividades com fontes', 'Observações datadas'].map(
          (label, index) => (
            <g key={label} style={{ '--delay': `${2.2 + index * 0.55}s` } as CSSProperties}>
              <rect
                x="15"
                y={91 + index * 33}
                width={centerWidth - 30}
                height="28"
                rx="5"
                className={styles.rowHighlight}
              />
              <circle cx="30" cy={105 + index * 33} r="3" className={styles.rowDot} />
              <text x="43" y={109 + index * 33} className={styles.contextLabel}>
                {label}
              </text>
              <path
                d={`M${centerWidth - 39} ${105 + index * 33}l3 3 6-6`}
                className={styles.check}
              />
            </g>
          ),
        )}
        {!vertical ? (
          <text x="22" y="207" className={styles.sourceNote}>
            CADA INFORMAÇÃO, UMA ORIGEM.
          </text>
        ) : null}
      </g>

      {outcomes.map((outcome, index) => {
        const x = vertical ? index * 118 : 880;
        const y = vertical ? 512 : 22 + index * 96;
        return (
          <g
            key={outcome.icon}
            transform={`translate(${x} ${y})`}
            aria-hidden="true"
            style={{ '--delay': `${5.7 + index * 0.55}s` } as CSSProperties}
          >
            <rect
              className={styles.outcomeCard}
              x="0.5"
              y="0.5"
              width={vertical ? 103 : 239}
              height={vertical ? 89 : 63}
              rx="8"
            />
            <Glyph name={outcome.icon} x={vertical ? 41 : 17} y={vertical ? 12 : 20} />
            <text
              className={styles.nodeTitle}
              x="52"
              y={vertical ? 53 : 27}
              textAnchor={vertical ? 'middle' : 'start'}
            >
              {outcome.title}
            </text>
            <text
              className={styles.nodeDetail}
              x="52"
              y={vertical ? 73 : 45}
              textAnchor={vertical ? 'middle' : 'start'}
            >
              {vertical ? outcome.mobile : outcome.detail}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function ContextDiagram() {
  const [paused, setPaused] = useState(false);
  return (
    <figure
      className={styles.figure}
      data-paused={paused}
      aria-label="Como o Empresa conecta informações"
    >
      <figcaption className={styles.heading}>
        <div>
          <span className="eyebrow">DADOS CONECTADOS, CONTEXTO CLARO</span>
          <p>O cadastro é só o começo.</p>
        </div>
        <button
          type="button"
          className={styles.toggle}
          onClick={() => setPaused((value) => !value)}
          aria-label={paused ? 'Retomar animação do diagrama' : 'Pausar animação do diagrama'}
        >
          {paused ? <Play size={13} aria-hidden="true" /> : <Pause size={13} aria-hidden="true" />}
          <span>{paused ? 'Retomar' : 'Pausar'}</span>
        </button>
      </figcaption>
      <div className={styles.canvas}>
        <Graph />
        <Graph vertical />
      </div>
      <p className={styles.footnote}>
        Diagrama ilustrativo. Histórico depende de versões comparáveis disponíveis.
      </p>
    </figure>
  );
}
