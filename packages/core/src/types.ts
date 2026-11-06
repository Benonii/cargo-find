export type EntryKind = 'connector' | 'native' | 'tool' | 'extractor';

export type CreditPrice = {
  type: string;
  cost: number;
  unit?: string;
};

export type InputField = {
  name: string;
  title?: string;
  description?: string;
  required: boolean;
};

export type IntegrationReference = {
  slug: string;
  name: string;
  category: string;
};

export type CatalogEntry = {
  id: string;
  kind: EntryKind;
  slug: string;
  name: string;
  description: string;
  integration?: IntegrationReference;
  inputs: InputField[];
  credits: CreditPrice[];
  action?: Record<string, string>;
};

export type Catalog = {
  generatedAt: string;
  cliVersion: string;
  entries: CatalogEntry[];
};

export type MatchTier = 'exact' | 'name' | 'keyword' | 'semantic';

export type SearchResult = {
  entry: CatalogEntry;
  tier: MatchTier;
  score: number;
  reason: string;
  usage: string;
};

export type SearchOptions = {
  limit?: number;
  kind?: EntryKind;
  integration?: string;
};

export type EmbeddingModel = {
  dimensions: number;
  vocabulary: Map<string, number>;
  vectors: Int8Array;
  scales: Float32Array;
};

export type QueryEmbedder = (text: string) => Float32Array | undefined;
