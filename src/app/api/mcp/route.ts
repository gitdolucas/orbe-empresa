import { timingSafeEqual } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { z } from 'zod';
import {
  findCompany,
  companyResponse,
  historyResponse,
  ServiceError,
} from '@/server/company-service';
import { enforceLimits } from '@/server/security';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  if (process.env.MCP_ENABLED !== 'true' || !process.env.MCP_API_KEY)
    return Response.json(
      { error: { code: 'MCP_DISABLED', message: 'MCP em beta posterior. Consulte a API REST.' } },
      { status: 503 },
    );
  const token = request.headers.get('authorization')?.replace(/^Bearer /, '') ?? '';
  const expected = process.env.MCP_API_KEY;
  if (
    Buffer.byteLength(token) !== Buffer.byteLength(expected) ||
    !timingSafeEqual(Buffer.from(token), Buffer.from(expected))
  )
    return Response.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin)
    return Response.json({ error: { code: 'ORIGIN_DENIED' } }, { status: 403 });
  try {
    const limit = await enforceLimits(request);
    if (!limit.allowed)
      return Response.json(
        { error: { code: 'RATE_LIMIT_EXCEEDED' } },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
      );
    const body = await request.text();
    if (body.length > 16384)
      return Response.json({ error: { code: 'REQUEST_TOO_LARGE' } }, { status: 413 });
    const parsed = JSON.parse(body);
    if (Array.isArray(parsed))
      return Response.json({ error: { code: 'BATCH_UNSUPPORTED' } }, { status: 400 });
    const server = new McpServer({ name: 'empresa', version: '0.1.0' });
    const tools = [
      ['get_company', 'Consulta cadastro empresarial com fonte.'],
      ['get_company_history', 'Consulta snapshots disponíveis.'],
      ['get_company_changes', 'Consulta alterações oficiais verificadas.'],
      ['get_company_activities', 'Consulta atividades observadas e evidências.'],
    ] as const;
    for (const [name, description] of tools)
      server.registerTool(
        name,
        {
          description,
          inputSchema: { cnpj: z.string().min(14).max(18) },
          annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
        },
        async ({ cnpj }) => {
          try {
            const record = await findCompany(cnpj);
            const result =
              name === 'get_company'
                ? companyResponse(record)
                : name === 'get_company_history'
                  ? historyResponse(record)
                  : name === 'get_company_changes'
                    ? { data: record.changes, meta: historyResponse(record).meta }
                    : { data: record.observedActivities, meta: companyResponse(record).meta };
            return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
          } catch (error) {
            return {
              isError: true,
              content: [
                {
                  type: 'text' as const,
                  text: JSON.stringify({
                    error: {
                      code: error instanceof ServiceError ? error.code : 'INTERNAL_ERROR',
                      message:
                        error instanceof ServiceError
                          ? error.userMessage
                          : 'Operação indisponível.',
                    },
                  }),
                },
              ],
            };
          }
        },
      );
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    await server.connect(transport);
    const replay = new Request(request.url, { method: 'POST', headers: request.headers, body });
    const response = await transport.handleRequest(replay);
    // JSON response mode is fully materialized before closing the stateless server.
    const result = await response.arrayBuffer();
    await server.close();
    return new Response(result, { status: response.status, headers: response.headers });
  } catch (error) {
    const status =
      error instanceof ServiceError ? error.status : error instanceof SyntaxError ? 400 : 500;
    return Response.json(
      {
        error: {
          code:
            error instanceof ServiceError
              ? error.code
              : status === 400
                ? 'INVALID_JSON'
                : 'MCP_ERROR',
        },
      },
      { status },
    );
  }
}
export function GET() {
  return Response.json(
    {
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Use POST com autenticação Bearer. MCP em beta.',
      },
    },
    { status: 405, headers: { Allow: 'POST' } },
  );
}
export const DELETE = GET;
