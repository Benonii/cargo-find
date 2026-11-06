import { writeFileSync } from 'node:fs';
import type { Catalog, CatalogEntry, CreditPrice, InputField } from '../packages/core/src/types';

type JsonSchema = {
  properties?: Record<string, { title?: string; description?: string }>;
  required?: string[];
};

type RawAction = {
  name: string;
  description?: string;
  config?: { schema?: JsonSchema; jsonSchema?: JsonSchema };
};

type RawIntegration = {
  slug: string;
  name: string;
  category?: string;
  actions?: Record<string, RawAction>;
  extractors?: Record<string, RawAction>;
};

type RawListedAction = {
  name: string;
  description?: string;
  integrationName?: string;
  category?: string;
  credits?: CreditPrice[];
  action: Record<string, string>;
};

const runCli = (commandArguments: string[]): unknown => {
  const result = Bun.spawnSync(['cargo-ai', ...commandArguments], { stdout: 'pipe', stderr: 'pipe' });
  if (result.exitCode !== 0) {
    throw new Error(`cargo-ai ${commandArguments.join(' ')} failed: ${result.stderr.toString()}`);
  }
  return JSON.parse(result.stdout.toString());
};

const readInputs = (action: RawAction): InputField[] => {
  const schema = action.config?.jsonSchema ?? action.config?.schema;
  const required = new Set(action.config?.schema?.required ?? schema?.required ?? []);
  return Object.entries(schema?.properties ?? {}).map(([name, property]) => ({
    name,
    title: property.title,
    description: property.description,
    required: required.has(name)
  }));
};

const versionOutput = Bun.spawnSync(['cargo-ai', '--version'], { stdout: 'pipe' }).stdout.toString().trim();
const integrations = (runCli(['connection', 'integration', 'list']) as { integrations: RawIntegration[] })
  .integrations;
const listed = (runCli(['orchestration', 'action', 'list']) as { results: RawListedAction[] }).results;

const integrationBySlug = new Map(integrations.map((integration) => [integration.slug, integration]));
const entries: CatalogEntry[] = [];

for (const item of listed) {
  const kind = item.action.kind;
  if (kind === 'connector') {
    const integration = integrationBySlug.get(item.action.integrationSlug);
    const raw = integration?.actions?.[item.action.actionSlug];
    entries.push({
      id: `${item.action.integrationSlug}.${item.action.actionSlug}`,
      kind: 'connector',
      slug: item.action.actionSlug,
      name: item.name,
      description: item.description ?? '',
      integration: {
        slug: item.action.integrationSlug,
        name: integration?.name ?? item.integrationName ?? item.action.integrationSlug,
        category: integration?.category ?? item.category ?? 'other'
      },
      inputs: raw ? readInputs(raw) : [],
      credits: item.credits ?? [],
      action: item.action
    });
  }
  if (kind === 'native') {
    entries.push({
      id: `native.${item.action.actionSlug}`,
      kind: 'native',
      slug: item.action.actionSlug,
      name: item.name,
      description: item.description ?? '',
      inputs: [],
      credits: item.credits ?? [],
      action: item.action
    });
  }
  if (kind === 'tool' && item.action.templateSlug) {
    entries.push({
      id: `tool.${item.action.templateSlug}`,
      kind: 'tool',
      slug: item.action.templateSlug,
      name: item.name,
      description: item.description ?? '',
      inputs: [],
      credits: item.credits ?? [],
      action: item.action
    });
  }
}

const actionIdentifiers = new Set(entries.map((entry) => entry.id));

for (const integration of integrations) {
  for (const [slug, extractor] of Object.entries(integration.extractors ?? {})) {
    const identifier = `${integration.slug}.${slug}`;
    entries.push({
      id: actionIdentifiers.has(identifier) ? `${identifier}.extractor` : identifier,
      kind: 'extractor',
      slug,
      name: extractor.name,
      description: extractor.description ?? '',
      integration: { slug: integration.slug, name: integration.name, category: integration.category ?? 'other' },
      inputs: readInputs(extractor),
      credits: []
    });
  }
}

const catalog: Catalog = {
  generatedAt: new Date().toISOString(),
  cliVersion: versionOutput,
  entries: entries.sort((left, right) => left.id.localeCompare(right.id))
};

writeFileSync('packages/core/data/catalog.json', `${JSON.stringify(catalog)}\n`);
console.log(`Wrote ${catalog.entries.length} entries from cargo-ai ${versionOutput}`);
