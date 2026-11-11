import { Suspense } from 'react';
import { Explorer } from '@/components/explorer';
import { getExamples } from '@/server/repository';
export default function Home() {
  return (
    <Suspense fallback={<div className="loading-panel">Carregando consulta…</div>}>
      <Explorer key="search" initialRecord={null} examples={getExamples()} />
    </Suspense>
  );
}
