import { type Context, createWorker } from '@cargo-ai/worker-sdk';
import { cors } from 'hono/cors';
import { describeEntry, describeResult, type EntryKind, handleMcpMessage } from '@/index';
import { getFinder } from './finder';
import { page } from './page';

type Bindings = { DATA_BASE_URL?: string };

const defaultDataBaseUrl = 'https://cdn.jsdelivr.net/gh/Benonii/cargo-find@main/packages/core/data';

const { app } = createWorker({
  title: 'cargo-find',
  description:
    'Find the right Cargo action, extractor, native step or preset tool for a GTM job in plain English. Exact names rank first, then actions of a named integration, then keywords, then meaning.'
});

app.use('*', cors({ origin: '*', allowHeaders: ['Content-Type', 'Mcp-Session-Id', 'Mcp-Protocol-Version'] }));

const dataBaseUrl = (context: Context): string =>
  (context.env as Bindings | undefined)?.DATA_BASE_URL ?? defaultDataBaseUrl;

const kinds = new Set(['connector', 'native', 'tool', 'extractor']);

app.get('/api/search', async (context) => {
  const query = context.req.query('q')?.trim() ?? '';
  if (query.length === 0) {
    return context.json({ error: 'Pass the job in plain English as ?q=' }, 400);
  }
  const requested = Number(context.req.query('limit') ?? 5);
  const limit = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), 20) : 5;
  const kind = context.req.query('kind');
  const finder = await getFinder(dataBaseUrl(context));
  const results = finder.search(query, {
    limit,
    kind: kind && kinds.has(kind) ? (kind as EntryKind) : undefined,
    integration: context.req.query('integration')
  });
  return context.json({ query, semantic: finder.semantic, results: results.map(describeResult) });
});

app.get('/api/actions/:id', async (context) => {
  const identifier = context.req.param('id');
  const finder = await getFinder(dataBaseUrl(context));
  const entry = finder.get(identifier);
  return entry ? context.json(describeEntry(entry)) : context.json({ error: `No entry with id ${identifier}` }, 404);
});

app.get('/api/status', async (context) => {
  const finder = await getFinder(dataBaseUrl(context));
  return context.json({
    entries: finder.catalog.entries.length,
    snapshotAt: finder.catalog.generatedAt,
    cliVersion: finder.catalog.cliVersion,
    semantic: finder.semantic
  });
});

app.post('/mcp', async (context) => {
  const finder = await getFinder(dataBaseUrl(context));
  let body: unknown;
  try {
    body = await context.req.json();
  } catch {
    return context.json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }, 400);
  }
  const messages = Array.isArray(body) ? body : [body];
  const responses = messages
    .map((message) => handleMcpMessage(finder, message))
    .filter((response) => response !== undefined);
  if (responses.length === 0) {
    return context.body(null, 202);
  }
  return context.json(Array.isArray(body) ? responses : responses[0]);
});

app.get('/', (context) => context.html(page));

app.get('/mcp', (context) => context.json({ error: 'Use POST with JSON-RPC (MCP streamable HTTP).' }, 405));

export default app;
