'use client';
import { useState } from 'react';
import { Check, Copy, Download } from 'lucide-react';
import { Button } from './ui/button';
export function JsonViewer({
  data,
  filename = 'empresa.json',
}: {
  data: unknown;
  filename?: string;
}) {
  const [copied, setCopied] = useState(false),
    [error, setError] = useState('');
  const json = JSON.stringify(data, null, 2);
  async function copy() {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Cópia indisponível. Use Baixar JSON.');
    }
  }
  function download() {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="json-viewer">
      <div className="json-toolbar">
        <span>
          <i />
          Resposta JSON
        </span>
        <div>
          <Button variant="ghost" size="sm" onClick={download}>
            <Download size={14} />
            Baixar JSON
          </Button>
          <Button variant="outline" size="sm" onClick={copy}>
            {copied ? <Check size={14} /> : <Copy size={14} />}{' '}
            {copied ? 'Copiado!' : 'Copiar JSON'}
          </Button>
        </div>
      </div>
      {error ? <p role="status">{error}</p> : null}
      <pre tabIndex={0}>
        <code>{json}</code>
      </pre>
    </div>
  );
}
