import type { CatalogEntry, SearchResult } from '@/types';
import { priceLabel, usageFor } from '@/usage';

export const describeEntry = (entry: CatalogEntry) => ({
  id: entry.id,
  kind: entry.kind,
  name: entry.name,
  description: entry.description,
  integration: entry.integration?.name,
  price: priceLabel(entry),
  inputs: entry.inputs,
  action: entry.action,
  usage: usageFor(entry)
});

export const describeResult = (result: SearchResult) => ({
  id: result.entry.id,
  kind: result.entry.kind,
  name: result.entry.name,
  description: result.entry.description,
  integration: result.entry.integration?.name,
  matchedOn: result.tier,
  reason: result.reason,
  price: priceLabel(result.entry),
  requiredInputs: result.entry.inputs.filter((field) => field.required).map((field) => field.name),
  usage: result.usage
});
