import type { Metadata } from 'next';
import { Shell } from '@/components/shell';
import '@fontsource-variable/schibsted-grotesk';
import '@fontsource-variable/geist-mono';
import './globals.css';
import { ProductAnalytics } from '@/components/analytics';
export const metadata: Metadata = {
  title: { default: 'Empresa — contexto empresarial aberto', template: '%s · Empresa' },
  description:
    'Conheça a empresa. Entenda o que mudou. Dados empresariais brasileiros com fontes, histórico e evidências verificáveis.',
  applicationName: 'Empresa',
  robots: { index: true, follow: true },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth">
      <body>
        <Shell>{children}</Shell>
        {process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED === 'true' ? <ProductAnalytics /> : null}
      </body>
    </html>
  );
}
