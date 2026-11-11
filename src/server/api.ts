import { Hono } from 'hono';
import { after } from 'next/server';
import { recordUsage, reportError } from './observability';
import { companyResponse, findCompany, historyResponse, ServiceError } from './company-service';
import { enforceLimits, getRedis } from './security';
const app = new Hono().basePath('/api/v1');
app.use('*', async (c, next) => {
  const started = Date.now(),
    requestId = crypto.randomUUID();
  c.header('X-Request-Id', requestId);
  try {
    const limit = await enforceLimits(c.req.raw);
    c.header('X-RateLimit-Remaining', String(limit.remaining));
    if (!limit.allowed) {
      c.header('Retry-After', String(limit.retryAfter));
      return c.json(
        {
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Limite de consultas atingido. Aguarde antes de tentar novamente.',
          },
        },
        429,
      );
    }
    await next();
    const body = await c.res.clone().text();
    if (Buffer.byteLength(body) > 1048576)
      return c.json(
        {
          error: {
            code: 'RESPONSE_TOO_LARGE',
            message: 'Resposta excedeu o limite disponível neste beta.',
          },
        },
        503,
      );
  } finally {
    const route = c.req.path.match(
      /^\/api\/v1\/companies\/[^/]+(?:\/(history|changes|activities))?$/,
    );
    const operation = route
      ? `/companies/:cnpj${route[1] ? `/${route[1]}` : ''}`
      : c.req.path === '/api/v1/health'
        ? '/health'
        : '/not-found';
    console.info(
      JSON.stringify({
        level: 'info',
        requestId,
        operation,
        status: c.res.status,
        durationMs: Date.now() - started,
      }),
    );
    if (process.env.DATABASE_URL) {
      const status = c.res.status;
      try {
        after(() => recordUsage(operation, status));
      } catch {
        await recordUsage(operation, status);
      }
    }
  }
});
app.get('/health', (c) =>
  c.json({
    data: {
      status: 'ok',
      service: 'empresa',
      version: '0.1.0',
      storage: process.env.DATABASE_URL ? 'postgresql' : 'local',
      rateLimit: getRedis() ? 'redis' : 'memory',
      mcp: process.env.MCP_ENABLED === 'true' ? 'enabled' : 'disabled',
    },
  }),
);
app.get('/companies/:cnpj/:resource?', async (c) => {
  const resource = c.req.param('resource');
  if (resource && !['history', 'changes', 'activities'].includes(resource))
    return c.json({ error: { code: 'NOT_FOUND', message: 'Endpoint não encontrado.' } }, 404);
  const record = await findCompany(c.req.param('cnpj'));
  const profile = companyResponse(record);
  c.header('Cache-Control', 'private, max-age=0');
  if (resource === 'history') return c.json(historyResponse(record));
  if (resource === 'changes')
    return c.json({
      data: record.changes,
      meta: { ...profile.meta, ...historyResponse(record).meta },
    });
  if (resource === 'activities')
    return c.json({
      data: record.observedActivities,
      meta: {
        ...profile.meta,
        status: record.observedActivities.length ? 'ANALYZED' : 'NOT_ANALYZED',
        notice: 'Atividades observadas são inferências e não indicam irregularidade.',
      },
    });
  return c.json(profile);
});
app.notFound((c) =>
  c.json({ error: { code: 'NOT_FOUND', message: 'Endpoint não encontrado.' } }, 404),
);
app.onError((error, c) => {
  if (error instanceof ServiceError) {
    if (error.retryAfter) c.header('Retry-After', String(error.retryAfter));
    return c.json(
      { error: { code: error.code, message: error.userMessage } },
      error.status as 400 | 404 | 429 | 503,
    );
  }
  console.error(JSON.stringify({ level: 'error', code: 'INTERNAL_ERROR', errorType: error.name }));
  try {
    after(() => reportError(new Error('INTERNAL_ERROR'), '/api/v1'));
  } catch {}
  return c.json(
    { error: { code: 'INTERNAL_ERROR', message: 'Não foi possível concluir a operação.' } },
    500,
  );
});
export default app;
