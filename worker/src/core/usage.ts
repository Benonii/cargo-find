import type { CatalogEntry } from '@/types';

const placeholderData = (entry: CatalogEntry): string => {
  const required = entry.inputs.filter((field) => field.required);
  const fields = required.length > 0 ? required : entry.inputs.slice(0, 3);
  const data = Object.fromEntries(fields.map((field) => [field.name, `<${field.title ?? field.name}>`]));
  return JSON.stringify(data);
};

export const usageFor = (entry: CatalogEntry): string => {
  if (entry.kind === 'extractor' && entry.integration) {
    const config = Object.fromEntries(
      entry.inputs.filter((field) => field.required).map((field) => [field.name, `<${field.title ?? field.name}>`])
    );
    return `defineModel('${entry.slug}', { connector: ${entry.integration.slug}, extractSlug: '${entry.slug}', config: ${JSON.stringify(config)} })`;
  }
  if (!entry.action) {
    return '';
  }
  return `cargo-ai orchestration action execute --action '${JSON.stringify(entry.action)}' --data '${placeholderData(entry)}' --dry-run`;
};

export const priceLabel = (entry: CatalogEntry): string => {
  if (entry.credits.length === 0) {
    return entry.kind === 'extractor' ? 'priced per synced row by the provider' : 'no credits';
  }
  const costs = entry.credits.map((credit) => credit.cost);
  const minimum = Math.min(...costs);
  const maximum = Math.max(...costs);
  const unit = entry.credits[0].unit ? ` per ${entry.credits[0].unit}` : ' per call';
  return minimum === maximum ? `${minimum} credits${unit}` : `${minimum} to ${maximum} credits${unit}`;
};
