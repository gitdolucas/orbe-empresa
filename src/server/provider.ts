import { z } from 'zod';
import type { Company, Source } from '@/lib/company';
import { isValidCnpj } from '@/lib/cnpj';
import {
  reserveProviderRequest,
  recordProviderFailure,
  ProviderPolicyError,
} from './provider-policy';
const providerSchema = z.object({
  cnpj: z.string(),
  razao_social: z.string(),
  nome_fantasia: z.string().nullish(),
  descricao_situacao_cadastral: z.string(),
  data_inicio_atividade: z.string().nullable(),
  identificador_matriz_filial: z.number(),
  natureza_juridica: z.string().nullable(),
  logradouro: z.string(),
  numero: z.string(),
  complemento: z.string().nullish(),
  bairro: z.string(),
  municipio: z.string(),
  codigo_municipio_ibge: z.number().nullable(),
  uf: z.string(),
  cep: z.string(),
  cnae_fiscal: z.number(),
  cnae_fiscal_descricao: z.string(),
  cnaes_secundarios: z.array(z.object({ codigo: z.number(), descricao: z.string() })),
});
export async function fetchCompany(cnpj: string): Promise<{ company: Company; source: Source }> {
  if (!isValidCnpj(cnpj)) throw new Error('INVALID_CNPJ');
  await reserveProviderRequest(cnpj);
  const url = `https://brasilapi.com.br/api/cnpj/v1/${cnpj}`;
  let response: Response;
  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: { Accept: 'application/json', 'User-Agent': 'Empresa-MVP/0.1' },
      cache: 'no-store',
    });
  } catch {
    throw new ProviderPolicyError(503, await recordProviderFailure(cnpj, 503));
  }
  if (!response.ok) {
    const status = response.status === 404 ? 404 : response.status === 429 ? 429 : 503;
    const delay = await recordProviderFailure(cnpj, status, response.headers.get('Retry-After'));
    throw new ProviderPolicyError(status, delay);
  }
  const length = Number(response.headers.get('content-length') ?? 0);
  if (length > 150000) throw new Error('PROVIDER_RESPONSE_TOO_LARGE');
  const body = await response.text();
  if (body.length > 150000) throw new Error('PROVIDER_RESPONSE_TOO_LARGE');
  const parsed = providerSchema.safeParse(JSON.parse(body));
  if (!parsed.success || parsed.data.cnpj !== cnpj) throw new Error('PROVIDER_UNAVAILABLE');
  const data = parsed.data,
    now = new Date().toISOString();
  // Explicit allowlist: personal partners, phone numbers and emails are discarded.
  return {
    company: {
      cnpj,
      rootCnpj: cnpj.slice(0, 8),
      legalName: data.razao_social,
      tradeName: data.nome_fantasia || null,
      registrationStatus: data.descricao_situacao_cadastral,
      openedAt: data.data_inicio_atividade,
      establishmentType: data.identificador_matriz_filial === 1 ? 'HEADQUARTERS' : 'BRANCH',
      legalNature: data.natureza_juridica,
      address: {
        street: data.logradouro,
        number: data.numero,
        complement: data.complemento || null,
        district: data.bairro,
        city: data.municipio,
        cityCode: data.codigo_municipio_ibge ? String(data.codigo_municipio_ibge) : null,
        state: data.uf,
        postalCode: data.cep,
      },
      declaredActivities: [
        {
          code: String(data.cnae_fiscal).padStart(7, '0'),
          name: data.cnae_fiscal_descricao,
          primary: true,
        },
        ...data.cnaes_secundarios
          .filter((a) => a.codigo > 0)
          .map((a) => ({
            code: String(a.codigo).padStart(7, '0'),
            name: a.descricao,
            primary: false,
          })),
      ],
    },
    source: {
      id: 'brasilapi-cnpj-v1',
      name: 'BrasilAPI · dados cadastrais da Receita Federal via Minha Receita',
      url,
      kind: 'PUBLIC_API',
      datasetPeriod: null,
      referenceDate: now,
      retrievedAt: now,
      licenseReference:
        'https://github.com/BrasilAPI/BrasilAPI — verificar condições e fonte original antes de redistribuição em escala',
    },
  };
}
