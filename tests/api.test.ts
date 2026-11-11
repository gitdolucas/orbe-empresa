import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import app from '../src/server/api';
import { POST as mcpPost } from '../src/app/api/mcp/route';
beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'test');
  vi.stubEnv('DATABASE_URL', '');
  vi.stubEnv('API_RATE_LIMIT', '1000');
  vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
  vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
});
afterEach(() => vi.unstubAllEnvs());
describe('REST contract', () => {
  it('returns a real minimized record with explicit provenance', async () => {
    const response = await app.request('/api/v1/companies/19131243000197');
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.data.legalName).toBe('OPEN KNOWLEDGE BRASIL');
    expect(body.meta.datasetPeriod).toBeNull();
    expect(body.meta.contentHash).toHaveLength(64);
    expect(response.headers.get('X-Request-Id')).toBeTruthy();
  });
  it('validates input before calling upstream', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch');
    const response = await app.request('/api/v1/companies/invalid');
    expect(response.status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
    fetch.mockRestore();
  });
  it('distinguishes missing coverage from nonexistence', async () => {
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 404 }));
    const response = await app.request('/api/v1/companies/12345678000195');
    expect(response.status).toBe(404);
    expect((await response.json()).error.code).toBe('NOT_IN_COVERAGE');
    fetch.mockRestore();
  });
  it('reports unavailable history without invented events', async () => {
    const response = await app.request('/api/v1/companies/19131243000197/changes');
    const body = await response.json();
    expect(body.data).toEqual([]);
    expect(body.meta.comparisonAvailable).toBe(false);
  });
  it('fails closed in production when distributed limiting is absent', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const response = await app.request('/api/v1/health');
    expect(response.status).toBe(503);
    expect((await response.json()).error.code).toBe('RATE_LIMIT_UNAVAILABLE');
  });
});
describe('authenticated read-only MCP', () => {
  it('remains explicitly unavailable until configured', async () => {
    vi.stubEnv('MCP_ENABLED', 'false');
    expect(
      (await mcpPost(new Request('http://localhost/api/mcp', { method: 'POST', body: '{}' })))
        .status,
    ).toBe(503);
  });
  it('rejects missing bearer token', async () => {
    vi.stubEnv('MCP_ENABLED', 'true');
    vi.stubEnv('MCP_API_KEY', 'test-only-key');
    expect(
      (await mcpPost(new Request('http://localhost/api/mcp', { method: 'POST', body: '{}' })))
        .status,
    ).toBe(401);
  });
  it('initializes a stateless MCP session and exposes read-only tools', async () => {
    vi.stubEnv('MCP_ENABLED', 'true');
    vi.stubEnv('MCP_API_KEY', 'test-only-key');
    const request = (body: unknown) =>
      new Request('http://localhost/api/mcp', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-only-key',
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
        },
        body: JSON.stringify(body),
      });
    const response = await mcpPost(
      request({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-03-26',
          capabilities: {},
          clientInfo: { name: 'test', version: '1' },
        },
      }),
    );
    expect(response.status).toBe(200);
    expect((await response.json()).result.serverInfo.name).toBe('empresa');
    const toolsResponse = await mcpPost(
      request({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }),
    );
    const tools = (await toolsResponse.json()).result.tools;
    expect(tools).toHaveLength(4);
    expect(
      tools.every((t: { annotations: { readOnlyHint: boolean } }) => t.annotations.readOnlyHint),
    ).toBe(true);
    const call = await mcpPost(
      request({
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: { name: 'get_company', arguments: { cnpj: '19131243000197' } },
      }),
    );
    const result = (await call.json()).result;
    expect(JSON.parse(result.content[0].text).data.cnpj).toBe('19131243000197');
  });
});
