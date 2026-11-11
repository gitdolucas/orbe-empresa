'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="page-container empty-panel">
      <h1>Consulta interrompida.</h1>
      <p>Não foi possível carregar os dados agora. Tente novamente.</p>
      <button className="button button-primary" onClick={reset}>
        Tentar novamente
      </button>
    </div>
  );
}
