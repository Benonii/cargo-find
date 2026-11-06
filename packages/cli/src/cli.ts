#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { describeEntry, describeResult, type EntryKind, handleMcpMessage } from '@/index';
import { loadFinder } from '@/node';

const help = `cargo-find: find the right Cargo action for a GTM job

Usage
  cargo-find "<job in plain English>" [--limit 5] [--kind connector|native|tool|extractor] [--integration hubspot] [--json]
  cargo-find get <id> [--json]
  cargo-find mcp          Run as an MCP server over stdio

Examples
  cargo-find "sync accounts to hubspot"
  cargo-find "who starred my github repo" --json
  cargo-find get hubspot.upsertRecords`;

const here = dirname(fileURLToPath(import.meta.url));
const bundledData = join(here, '..', 'data');
const finder = loadFinder(existsSync(bundledData) ? bundledData : undefined);

const commandArguments = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const position = commandArguments.indexOf(`--${name}`);
  return position === -1 ? undefined : commandArguments[position + 1];
};
const hasFlag = (name: string): boolean => commandArguments.includes(`--${name}`);
const valueFlags = new Set(['--limit', '--kind', '--integration']);
const positional = commandArguments.filter(
  (argument, index) => !argument.startsWith('--') && !valueFlags.has(commandArguments[index - 1] ?? '')
);

const print = (value: unknown) => process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);

const runMcp = () => {
  const reader = createInterface({ input: process.stdin });
  reader.on('line', (line) => {
    if (line.trim().length === 0) {
      return;
    }
    try {
      const response = handleMcpMessage(finder, JSON.parse(line));
      if (response) {
        process.stdout.write(`${JSON.stringify(response)}\n`);
      }
    } catch {
      process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } })}\n`);
    }
  });
};

const runSearch = (query: string) => {
  const results = finder.search(query, {
    limit: Number(flag('limit') ?? 5),
    kind: flag('kind') as EntryKind | undefined,
    integration: flag('integration')
  });
  if (hasFlag('json')) {
    print({ query, results: results.map(describeResult) });
    return;
  }
  if (results.length === 0) {
    process.stdout.write(`No match for "${query}". Try fewer words or name the integration.\n`);
    return;
  }
  results.forEach((result, index) => {
    const described = describeResult(result);
    const integration = described.integration ? `${described.integration}, ` : '';
    process.stdout.write(`\n${index + 1}. ${described.name}  ${described.id}\n`);
    process.stdout.write(`   ${integration}${described.kind}, ${described.price}\n`);
    process.stdout.write(`   matched on ${described.matchedOn}: ${described.reason}\n`);
    if (described.usage) {
      process.stdout.write(`   $ ${described.usage}\n`);
    }
  });
  process.stdout.write('\n');
};

const runGet = (identifier: string) => {
  const entry = finder.get(identifier);
  if (!entry) {
    process.stderr.write(`No catalog entry with id ${identifier}\n`);
    process.exitCode = 1;
    return;
  }
  print(describeEntry(entry));
};

if (positional.length === 0 || hasFlag('help')) {
  process.stdout.write(`${help}\n`);
} else if (positional[0] === 'mcp') {
  runMcp();
} else if (positional[0] === 'get') {
  runGet(positional[1] ?? '');
} else {
  runSearch(positional.join(' '));
}
