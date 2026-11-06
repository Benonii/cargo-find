import type { SearchResponse } from '@/types';

const apiBase = import.meta.env.VITE_API_BASE ?? '';

export const serviceOrigin = (): string => (apiBase.length > 0 ? apiBase : window.location.origin);

export const searchActions = async (query: string, signal: AbortSignal): Promise<SearchResponse> => {
  const response = await fetch(`${apiBase}/api/search?q=${encodeURIComponent(query)}&limit=8`, { signal });
  if (!response.ok) {
    throw new Error(`Search failed with status ${response.status}`);
  }
  return response.json();
};
