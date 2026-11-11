'use client';
import { Analytics } from '@vercel/analytics/react';
export function ProductAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => {
        const url = new URL(event.url);
        if (url.pathname.startsWith('/empresa/')) url.pathname = '/empresa/[cnpj]';
        url.search = '';
        url.hash = '';
        return { ...event, url: url.toString() };
      }}
    />
  );
}
