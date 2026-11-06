import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createFinder } from '@/index';
import type { Catalog } from '@/types';

export const dataDirectory = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');

export const loadFinder = (directory: string = dataDirectory) => {
  const read = (name: string) => new Uint8Array(readFileSync(join(directory, name)));
  const catalog = JSON.parse(readFileSync(join(directory, 'catalog.json'), 'utf8')) as Catalog;
  return createFinder({
    catalog,
    vocabularyText: readFileSync(join(directory, 'vocabulary.txt'), 'utf8'),
    tokenBytes: read('tokens.bin'),
    tokenScaleBytes: read('token-scales.bin'),
    entryBytes: read('entries.bin'),
    entryScaleBytes: read('entry-scales.bin')
  });
};
