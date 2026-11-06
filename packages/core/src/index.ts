import { createEmbeddingModel, createQueryEmbedder, decodeEntryVectors } from '@/embedding';
import { createRanker } from '@/rank';
import type { Catalog } from '@/types';

export type { Ranker } from '@/rank';
export * from '@/types';
export { describeEntry, describeResult } from '@/format';
export { handleMcpMessage } from '@/mcp';
export { priceLabel, usageFor } from '@/usage';

export type FinderData = {
  catalog: Catalog;
  vocabularyText?: string;
  tokenBytes?: Uint8Array;
  tokenScaleBytes?: Uint8Array;
  entryBytes?: Uint8Array;
  entryScaleBytes?: Uint8Array;
  dimensions?: number;
};

export const createFinder = (data: FinderData) => {
  const dimensions = data.dimensions ?? 256;
  const hasModel = data.vocabularyText && data.tokenBytes && data.tokenScaleBytes;
  const embed = hasModel
    ? createQueryEmbedder(
        createEmbeddingModel(data.vocabularyText ?? '', data.tokenBytes ?? new Uint8Array(), data.tokenScaleBytes ?? new Uint8Array(), dimensions)
      )
    : undefined;
  const vectors =
    data.entryBytes && data.entryScaleBytes ? decodeEntryVectors(data.entryBytes, data.entryScaleBytes, dimensions) : undefined;
  const ranker = createRanker(data.catalog.entries, vectors, embed);
  return { ...ranker, catalog: data.catalog, semantic: embed !== undefined };
};

export type Finder = ReturnType<typeof createFinder>;
