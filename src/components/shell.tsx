'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowUpRight, Asterisk, Menu, X } from 'lucide-react';
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Empresa — início">
      <span className="brand-mark">
        <Asterisk size={29} strokeWidth={2} />
      </span>
      <span>
        empresa<span className="brand-period">.</span>
      </span>
    </Link>
  );
}
export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(),
    [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    function escape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [open]);
  const links = [
    { href: '/', label: 'Explorar' },
    { href: '/documentacao', label: 'API e documentação' },
    { href: '/fontes', label: 'Fontes' },
  ];
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Pular para o conteúdo
      </a>
      <header className="site-header">
        <div className="header-inner">
          <Brand />
          <nav className="desktop-nav" aria-label="Navegação principal">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={pathname === link.href ? 'page' : undefined}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <Link className="header-cta" href="/#consulta">
            Consultar CNPJ <ArrowUpRight size={16} />
          </Link>
          <button
            className="mobile-toggle icon-button"
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>
        <nav id="mobile-navigation" className="mobile-nav" aria-label="Menu móvel" hidden={!open}>
          {links.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
              {link.label}
              <ArrowUpRight size={15} />
            </Link>
          ))}
        </nav>
      </header>
      <main id="main">{children}</main>
      <footer className="footer">
        <span>Dados abertos. Contexto claro.</span>
        <div>
          <span className="footer-beta">BETA</span>
          <Link href="/fontes">
            Fontes e metodologia <ArrowUpRight size={13} />
          </Link>
        </div>
      </footer>
    </div>
  );
}
