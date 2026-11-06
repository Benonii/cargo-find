import { describe, expect, test } from 'bun:test';
import { createRanker } from '@/rank';
import type { CatalogEntry } from '@/types';

const entry = (id: string, name: string, description: string, integration?: string): CatalogEntry => ({
  id,
  kind: 'connector',
  slug: id.split('.')[1],
  name,
  description,
  integration: integration ? { slug: integration.toLowerCase(), name: integration, category: 'sales' } : undefined,
  inputs: [],
  credits: []
});

const catalog = [
  entry('places.blueBottle', 'Blue Bottle', 'Coffee shop downtown'),
  entry('places.ritual', 'Ritual', 'Coffee roasters, a lot like Blue Bottle but cheaper'),
  entry('hubspot.upsertRecords', 'Upsert records', 'Upsert object records', 'Hubspot'),
  entry('salesloft.upsertAccount', 'Upsert account', 'Create or update an account', 'Salesloft'),
  entry('slack.postMessage', 'Post message', 'Post a message in a channel', 'Slack')
];

describe('tiered ranking', () => {
  const ranker = createRanker(catalog, undefined);

  test('an exact name always beats a description that mentions it', () => {
    const results = ranker.search('blue bottle');
    expect(results[0].entry.id).toBe('places.blueBottle');
    expect(results[0].tier).toBe('exact');
  });

  test('an exact id is found', () => {
    expect(ranker.search('hubspot.upsertRecords')[0].entry.id).toBe('hubspot.upsertRecords');
  });

  test('naming an integration ranks its actions above better worded actions elsewhere', () => {
    const results = ranker.search('sync accounts to hubspot');
    expect(results[0].entry.id).toBe('hubspot.upsertRecords');
    expect(results[0].tier).toBe('name');
  });

  test('synonyms connect intent words to action names', () => {
    expect(ranker.search('send a message on slack')[0].entry.id).toBe('slack.postMessage');
  });

  test('an integration name used as an input does not filter results', () => {
    const results = ranker.search('slack url');
    expect(results.every((result) => result.tier !== 'name' || result.entry.integration?.slug === 'slack')).toBe(true);
  });
});
