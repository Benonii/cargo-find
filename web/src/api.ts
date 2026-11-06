import type { PlanRun, PlanStart, SearchResponse } from '@/types';

const apiBase = import.meta.env.VITE_API_BASE ?? '';

export const serviceOrigin = (): string => (apiBase.length > 0 ? apiBase : window.location.origin);

export const searchActions = async (query: string, signal: AbortSignal): Promise<SearchResponse> => {
  const response = await fetch(`${apiBase}/api/search?q=${encodeURIComponent(query)}&limit=8`, { signal });
  if (!response.ok) {
    throw new Error(`Search failed with status ${response.status}`);
  }
  return response.json();
};

const readError = async (response: Response): Promise<string> => {
  try {
    const body: unknown = await response.json();
    if (typeof body === 'object' && body !== null && 'error' in body) {
      return String(body.error);
    }
  } catch {
    return `Request failed with status ${response.status}`;
  }
  return `Request failed with status ${response.status}`;
};

export const startPlan = async (goal: string): Promise<PlanStart> => {
  const response = await fetch(`${apiBase}/api/plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ goal })
  });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response.json();
};

export const readPlan = async (uuid: string, signal: AbortSignal): Promise<PlanRun> => {
  const response = await fetch(`${apiBase}/api/plan/${uuid}`, { signal });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response.json();
};
