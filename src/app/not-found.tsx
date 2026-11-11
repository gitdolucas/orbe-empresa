import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="page-container empty-panel">
      <span className="eyebrow">404 / NÃO ENCONTRADO</span>
      <h1>Este caminho não existe.</h1>
      <p>Confira o endereço ou consulte um CNPJ válido no explorador.</p>
      <Link className="button button-primary" href="/">
        Voltar ao explorador
      </Link>
    </div>
  );
}
