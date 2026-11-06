import { createFinder, type Finder } from '@/index';
import type { Catalog } from '@/types';
import catalogJson from './data/catalog.json';

const catalog = catalogJson as unknown as Catalog;
const lexicalFinder = createFinder({ catalog });

type DataFiles = {
  vocabularyText: string;
  tokenBytes: Uint8Array;
  tokenScaleBytes: Uint8Array;
  entryBytes: Uint8Array;
  entryScaleBytes: Uint8Array;
};

let semanticFinder: Finder | undefined;
let loading: Promise<void> | undefined;

const fetchBytes = async (baseUrl: string, name: string): Promise<Uint8Array> => {
  const response = await fetch(`${baseUrl}/${name}`);
  if (!response.ok) {
    throw new Error(`Could not load ${name}: ${response.status}`);
  }
  return new Uint8Array(await response.arrayBuffer());
};

const loadSemantic = async (baseUrl: string) => {
  const [vocabularyBytes, tokenBytes, tokenScaleBytes, entryBytes, entryScaleBytes] = await Promise.all(
    ['vocabulary.txt', 'tokens.bin', 'token-scales.bin', 'entries.bin', 'entry-scales.bin'].map((name) =>
      fetchBytes(baseUrl, name)
    )
  );
  const files: DataFiles = {
    vocabularyText: new TextDecoder().decode(vocabularyBytes),
    tokenBytes,
    tokenScaleBytes,
    entryBytes,
    entryScaleBytes
  };
  if (files.entryScaleBytes.byteLength / 4 === catalog.entries.length) {
    semanticFinder = createFinder({ catalog, ...files });
  }
};

export const getFinder = async (baseUrl: string | undefined): Promise<Finder> => {
  if (semanticFinder) {
    return semanticFinder;
  }
  if (baseUrl && !loading) {
    loading = loadSemantic(baseUrl).catch(() => {
      loading = undefined;
    });
  }
  if (loading) {
    await Promise.race([loading, new Promise((resolve) => setTimeout(resolve, 4000))]);
  }
  return semanticFinder ?? lexicalFinder;
};
