import { createCargoApi } from '@cargo-ai/worker-sdk';
import { describeEntry, type Finder } from '@/index';

export type PlanMode = 'withFinder' | 'alone';

export type PlanEnvironment = { CARGO_API_TOKEN?: string; CARGO_API_URL?: string };

type PlannedStep = { title: string; actionId: string; why: string };

const basePrompt =
  'You turn a go-to-market goal into a Cargo workflow: an ordered list of 2 to 6 Cargo actions. Each step names exactly one action id in the form integrationSlug.actionSlug. Return the steps in the order the workflow runs them.';

const finderPrompt = `${basePrompt} Before choosing, split the goal into steps such as: source new records from a data provider, enrich them, filter or score them, write them to the destination, notify the team. For each step call find_action with a short plain-English query and compare the descriptions of the results. Use only action ids returned by the tools. Sourcing new leads means searching a data provider for people or companies, not looking up records inside a CRM, so query it as, for example, search people by job title or search companies by industry. When writing new records into a CRM, prefer an upsert action.`;

export const prompts: Record<PlanMode, string> = { withFinder: finderPrompt, alone: basePrompt };

const outputSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'steps'],
  properties: {
    summary: { type: 'string' },
    steps: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'actionId', 'why'],
        properties: { title: { type: 'string' }, actionId: { type: 'string' }, why: { type: 'string' } }
      }
    }
  }
};

const modelSettings = {
  integrationSlug: 'openAi',
  languageModelSlug: 'gpt-4.1-mini',
  temperature: 0.2,
  withReasoning: false
};

const windowMilliseconds = 10 * 60 * 1000;
const runsPerWindow = 40;
const recentRuns: number[] = [];

export const goalLimits = { minimum: 8, maximum: 300 };

export const hasCapacity = (): boolean => {
  const now = Date.now();
  while (recentRuns.length > 0 && now - (recentRuns[0] ?? now) > windowMilliseconds) {
    recentRuns.shift();
  }
  return recentRuns.length < runsPerWindow;
};

const createApi = (environment: PlanEnvironment) =>
  createCargoApi({ ...environment, CARGO_API_TOKEN: environment.CARGO_API_TOKEN ?? '' } as Parameters<
    typeof createCargoApi
  >[0]);

const startRun = async (environment: PlanEnvironment, goal: string, mode: PlanMode, mcpUrl: string) => {
  const api = createApi(environment);
  const result = await api.ai.message.create({
    parts: [{ type: 'text', text: goal }],
    systemPrompt: prompts[mode],
    maxSteps: mode === 'withFinder' ? 12 : 2,
    output: { type: 'jsonSchema', jsonSchema: outputSchema },
    mcpClients:
      mode === 'withFinder'
        ? [
            {
              kind: 'custom',
              name: 'cargo-find',
              url: mcpUrl,
              authentication: { issuedAt: new Date().toISOString(), accessToken: 'public' },
              disabledToolSlugs: []
            }
          ]
        : [],
    ...modelSettings
  } as Parameters<typeof api.ai.message.create>[0]);
  const uuid = result.assistantMessage?.uuid;
  if (!uuid) {
    throw new Error('Cargo did not start the agent run');
  }
  return uuid;
};

export const startPlan = async (environment: PlanEnvironment, goal: string, mcpUrl: string) => {
  recentRuns.push(Date.now());
  const [withFinder, alone] = await Promise.all([
    startRun(environment, goal, 'withFinder', mcpUrl),
    startRun(environment, goal, 'alone', mcpUrl)
  ]);
  return { withFinder, alone };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readSteps = (value: unknown): PlannedStep[] => {
  if (!isRecord(value) || !Array.isArray(value.steps)) {
    return [];
  }
  return value.steps.filter(isRecord).map((step) => ({
    title: String(step.title ?? ''),
    actionId: String(step.actionId ?? '').trim(),
    why: String(step.why ?? '')
  }));
};

const parseOutput = (text: string): { summary: string; steps: PlannedStep[] } => {
  try {
    const parsed: unknown = JSON.parse(text);
    return { summary: isRecord(parsed) ? String(parsed.summary ?? '') : '', steps: readSteps(parsed) };
  } catch {
    return { summary: text, steps: [] };
  }
};

const runningStatuses = new Set(['pending', 'generating']);

export const readPlan = async (environment: PlanEnvironment, uuid: string, finder: Finder) => {
  const api = createApi(environment);
  const { message } = (await api.ai.message.get(uuid)) as { message: Record<string, unknown> };
  const mode = (Object.keys(prompts) as PlanMode[]).find((key) => prompts[key] === message.systemPrompt);
  if (!mode) {
    return undefined;
  }
  const status = String(message.status);
  const parts = Array.isArray(message.parts) ? message.parts.filter(isRecord) : [];
  const searches = parts
    .filter((part) => part.type === 'dynamic-tool' || String(part.type).startsWith('tool-'))
    .map((part) => (isRecord(part.input) ? String(part.input.query ?? part.input.id ?? '') : ''))
    .filter((query) => query.length > 0);
  const text = parts
    .filter((part) => part.type === 'text')
    .map((part) => String(part.text ?? ''))
    .join('');
  const output = runningStatuses.has(status) ? { summary: '', steps: [] } : parseOutput(text);
  const usage = isRecord(message.usage) ? message.usage : {};
  const steps = output.steps.map((step) => {
    const entry = finder.get(step.actionId);
    return { ...step, real: entry !== undefined, entry: entry ? describeEntry(entry) : undefined };
  });
  return {
    mode,
    state: runningStatuses.has(status) ? 'running' : status === 'success' ? 'done' : 'failed',
    error: status === 'error' ? String(message.errorMessage ?? 'The agent run failed') : undefined,
    searches,
    summary: output.summary,
    steps,
    realSteps: steps.filter((step) => step.real).length,
    credits: Number(usage.creditsUsedCount ?? 0),
    model: String(message.languageModelSlug ?? modelSettings.languageModelSlug)
  };
};
