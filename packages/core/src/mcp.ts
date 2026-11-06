import { describeEntry, describeResult } from '@/format';
import type { Finder } from '@/index';
import type { EntryKind } from '@/types';

type JsonRpcRequest = {
  jsonrpc: '2.0';
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
};

type JsonRpcResponse = {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string };
};

const protocolVersion = '2025-06-18';

const instructions =
  'Find the right Cargo (getcargo.ai) action, extractor, native step or preset tool for a GTM job described in plain English. Call find_action first, then get_action for the full input schema. Every result includes a cargo-ai command with --dry-run, which is free: run it before spending credits.';

const tools = [
  {
    name: 'find_action',
    description:
      'Search the whole Cargo catalog (connector actions, extractors, native workflow steps and preset tools) for a job described in plain English, such as "sync accounts to hubspot". Exact names always rank first, then actions of an integration you name, then keyword matches, then similar meaning. Each result says why it matched, its credit price and the command to run it.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'The job in plain English, or an exact action name or id.' },
        limit: { type: 'number', description: 'How many results to return. Defaults to 5, at most 20.' },
        kind: { type: 'string', enum: ['connector', 'native', 'tool', 'extractor'], description: 'Only return this kind.' },
        integration: { type: 'string', description: 'Only return actions of this integration slug, such as hubspot.' }
      },
      required: ['query']
    }
  },
  {
    name: 'get_action',
    description: 'Get one catalog entry by id (such as hubspot.upsertRecords): every input field, price, and the command to run it.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'The id returned by find_action.' } },
      required: ['id']
    }
  }
];

const textResult = (value: unknown, isError = false) => ({
  content: [{ type: 'text', text: JSON.stringify(value, null, 2) }],
  isError
});

const callTool = (finder: Finder, name: string, input: Record<string, unknown>) => {
  if (name === 'find_action') {
    const query = String(input.query ?? '');
    const limit = Math.min(Math.max(Number(input.limit ?? 5), 1), 20);
    const results = finder.search(query, {
      limit,
      kind: input.kind as EntryKind | undefined,
      integration: input.integration as string | undefined
    });
    return textResult({ query, results: results.map(describeResult) });
  }
  if (name === 'get_action') {
    const entry = finder.get(String(input.id ?? ''));
    return entry ? textResult(describeEntry(entry)) : textResult({ error: `No catalog entry with id ${input.id}` }, true);
  }
  return textResult({ error: `Unknown tool ${name}` }, true);
};

export const handleMcpMessage = (finder: Finder, request: JsonRpcRequest): JsonRpcResponse | undefined => {
  if (request.id === undefined || request.id === null) {
    return undefined;
  }
  const reply = (result: unknown): JsonRpcResponse => ({ jsonrpc: '2.0', id: request.id ?? null, result });
  if (request.method === 'initialize') {
    return reply({
      protocolVersion,
      capabilities: { tools: {} },
      serverInfo: { name: 'cargo-find', version: '0.1.0' },
      instructions
    });
  }
  if (request.method === 'ping') {
    return reply({});
  }
  if (request.method === 'tools/list') {
    return reply({ tools });
  }
  if (request.method === 'tools/call') {
    const parameters = request.params ?? {};
    return reply(callTool(finder, String(parameters.name), (parameters.arguments as Record<string, unknown>) ?? {}));
  }
  return { jsonrpc: '2.0', id: request.id, error: { code: -32601, message: `Method not found: ${request.method}` } };
};
