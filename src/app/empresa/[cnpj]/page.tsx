import { Suspense } from 'react';
import { Explorer } from '@/components/explorer';
import { getExamples, getRecord } from '@/server/repository';
import { isValidCnpj, normalizeCnpj } from '@/lib/cnpj';
import { notFound } from 'next/navigation';
export const dynamic = 'force-dynamic';
export default async function CompanyPage({ params }: { params: Promise<{ cnpj: string }> }) {
  const { cnpj: raw } = await params;
  const cnpj = normalizeCnpj(raw);
  if (!isValidCnpj(cnpj)) notFound();
  const initialRecord = await getRecord(cnpj);
  return (
    <Suspense fallback={<div className="loading-panel">Carregando empresa…</div>}>
      <Explorer
        key={cnpj}
        initialRecord={initialRecord}
        initialCnpj={cnpj}
        examples={getExamples()}
      />
    </Suspense>
  );
}
