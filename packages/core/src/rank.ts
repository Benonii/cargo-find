import { cosine } from '@/embedding';
import { entityWords, genericObjectWords, synonymsOf } from '@/synonyms';
import { compact, contentWords, normalize, splitIdentifier, stem, wordsMatch } from '@/text';
import type { CatalogEntry, EntryKind, MatchTier, QueryEmbedder, SearchOptions, SearchResult } from '@/types';
import { usageFor } from '@/usage';

type IndexedEntry = {
  entry: CatalogEntry;
  exactKeys: Set<string>;
  nameWords: string[];
  integrationWords: string[];
  descriptionWords: string[];
  inputWords: string[];
  vector?: Float32Array;
};

type IntegrationPhrase = {
  slug: string;
  name: string;
  words: string[];
};

type Mention = IntegrationPhrase & { start: number; end: number };

type Candidate = {
  indexed: IndexedEntry;
  tier: MatchTier;
  score: number;
  reason: string;
  mentioned: boolean;
};

const tierOrder: Record<MatchTier, number> = { exact: 0, name: 1, keyword: 2, semantic: 3 };
const kindOrder: Record<EntryKind, number> = { connector: 0, tool: 1, native: 2, extractor: 3 };
const semanticThreshold = 0.42;
const presetBonus = 0.15;
const inputNouns = new Set(['url', 'urls', 'profile', 'profiles', 'page', 'pages', 'handle', 'link', 'id', 'username', 'slug']);
const brandSuffixes = new Set(['io', 'ai', 'hq', 'app', 'com', 'v2']);
const synonymWeight = 0.75;
const genericWeight = 0.5;

const phraseRewrites: [RegExp, string][] = [
  [/\bcreate or update\b/g, 'upsert'],
  [/\bupdate or create\b/g, 'upsert'],
  [/\blook up\b/g, 'lookup'],
  [/\be-?mails?\b/g, 'email'],
  [/\bsign ?ups?\b/g, 'signup'],
  [/\bround[- ]robin\b/g, 'roundrobin'],
  [/\bdecision[- ]makers?\b/g, 'decisionmaker'],
  [/\bnew hires?\b/g, 'joiner'],
  [/\bjob changes?\b/g, 'jobchange'],
  [/\btech stack\b/g, 'technology']
];

const rewrite = (query: string): string =>
  phraseRewrites.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), query.toLowerCase());

const indexEntry = (entry: CatalogEntry, vector?: Float32Array): IndexedEntry => {
  const integrationName = entry.integration?.name ?? '';
  const integrationSlug = entry.integration?.slug ?? entry.kind;
  const exactKeys = new Set(
    [
      entry.id,
      entry.slug,
      entry.name,
      `${integrationName} ${entry.name}`,
      `${entry.name} ${integrationName}`,
      `${integrationSlug} ${entry.slug}`,
      `${integrationName} ${splitIdentifier(entry.slug)}`
    ]
      .map(compact)
      .filter((key) => key.length > 0)
  );
  return {
    entry,
    exactKeys,
    nameWords: contentWords(`${entry.name} ${splitIdentifier(entry.slug)}`),
    integrationWords: contentWords(`${integrationName} ${splitIdentifier(integrationSlug)}`),
    descriptionWords: contentWords(entry.description),
    inputWords: contentWords(entry.inputs.map((field) => `${field.title ?? ''} ${splitIdentifier(field.name)}`).join(' ')),
    vector
  };
};

const matchQuality = (queryWord: string, candidates: string[]): number => {
  if (candidates.some((candidate) => wordsMatch(queryWord, candidate))) {
    return 1;
  }
  const synonyms = synonymsOf(queryWord);
  if (synonyms.some((synonym) => candidates.includes(synonym))) {
    return synonymWeight;
  }
  if (entityWords.has(queryWord) && candidates.some((candidate) => genericObjectWords.has(candidate))) {
    return genericWeight;
  }
  return 0;
};

const findMentions = (queryWords: string[], phrases: IntegrationPhrase[]): Mention[] => {
  const found: Mention[] = [];
  for (const phrase of phrases) {
    const length = phrase.words.length;
    for (let start = 0; start + length <= queryWords.length; start += 1) {
      const window = queryWords.slice(start, start + length);
      if (window.every((word, index) => word === phrase.words[index])) {
        found.push({ ...phrase, start, end: start + length });
      }
    }
    const compactName = compact(phrase.name);
    queryWords.forEach((word, index) => {
      if (word === compactName && length > 1) {
        found.push({ ...phrase, start: index, end: index + 1 });
      }
    });
  }
  return found.filter(
    (mention) =>
      !inputNouns.has(queryWords[mention.end] ?? '') &&
      !found.some(
        (other) =>
          other !== mention &&
          other.end - other.start > mention.end - mention.start &&
          other.start <= mention.start &&
          other.end >= mention.end
      )
  );
};

export const createRanker = (entries: CatalogEntry[], vectors: Float32Array[] | undefined, embed?: QueryEmbedder) => {
  const indexed = entries.map((entry, position) => indexEntry(entry, vectors?.[position]));
  const documentFrequency = new Map<string, number>();
  for (const item of indexed) {
    const unique = new Set([...item.nameWords, ...item.integrationWords, ...item.descriptionWords, ...item.inputWords]);
    for (const word of unique) {
      documentFrequency.set(word, (documentFrequency.get(word) ?? 0) + 1);
    }
  }
  const inverseFrequency = (word: string): number =>
    Math.log(1 + (indexed.length - (documentFrequency.get(word) ?? 0) + 0.5) / ((documentFrequency.get(word) ?? 0) + 0.5));

  const phrases: IntegrationPhrase[] = [];
  const seenPhrases = new Set<string>();
  for (const entry of entries) {
    if (!entry.integration) {
      continue;
    }
    const nameWords = normalize(entry.integration.name).split(' ');
    const trimmed = nameWords.filter((word, index) => index === 0 || !brandSuffixes.has(word)).join(' ');
    for (const text of [entry.integration.name, splitIdentifier(entry.integration.slug), trimmed]) {
      const phraseWords = normalize(text).split(' ').filter((word) => word.length > 0);
      const key = `${entry.integration.slug}:${phraseWords.join(' ')}`;
      if (phraseWords.length > 0 && !seenPhrases.has(key)) {
        seenPhrases.add(key);
        phrases.push({ slug: entry.integration.slug, name: entry.integration.name, words: phraseWords });
      }
    }
  }

  const keywordScore = (item: IndexedEntry, queryWords: string[]): { score: number; coverage: number } => {
    const fields: [string[], number][] = [
      [item.nameWords, 3],
      [item.integrationWords, 2],
      [item.descriptionWords, 1],
      [item.inputWords, 0.5]
    ];
    let score = 0;
    let maximum = 0;
    let covered = 0;
    for (const word of queryWords) {
      const weight = inverseFrequency(word);
      maximum += weight * 3;
      let best = 0;
      for (const [fieldWords, fieldWeight] of fields) {
        best = Math.max(best, matchQuality(word, fieldWords) * fieldWeight);
      }
      if (best > 0) {
        covered += 1;
      }
      score += best * weight;
    }
    return {
      score: maximum > 0 ? score / maximum : 0,
      coverage: queryWords.length > 0 ? covered / queryWords.length : 0
    };
  };

  const knownFrequencies = [...documentFrequency.values()].sort((left, right) => left - right);
  const medianFrequency = knownFrequencies[Math.floor(knownFrequencies.length / 2)] ?? 1;
  const wordWeight = (word: string): number => {
    const present = [word, ...synonymsOf(word)].filter((candidate) => documentFrequency.has(candidate));
    if (present.length === 0) {
      return Math.log(1 + indexed.length / medianFrequency);
    }
    return Math.max(...present.map(inverseFrequency));
  };

  const nameCoverage = (item: IndexedEntry, queryWords: string[]): { coverage: number; matched: string[] } => {
    let total = 0;
    let possible = 0;
    const matched: string[] = [];
    for (const word of queryWords) {
      const weight = wordWeight(word);
      const quality = matchQuality(word, item.nameWords);
      if (quality > 0) {
        matched.push(word);
      }
      total += quality * weight;
      possible += weight;
    }
    return { coverage: possible > 0 ? total / possible : 0, matched };
  };

  const search = (query: string, options: SearchOptions = {}): SearchResult[] => {
    const limit = options.limit ?? 5;
    const rewritten = rewrite(query);
    const queryCompact = compact(rewritten);
    if (queryCompact.length === 0) {
      return [];
    }
    const rawWords = normalize(rewritten).split(' ');
    const mentions = findMentions(rawWords, phrases);
    const mentionedSlugs = new Set(mentions.map((mention) => mention.slug));
    const mentionIndexes = new Set(mentions.flatMap((mention) => Array.from({ length: mention.end - mention.start }, (_, offset) => mention.start + offset)));
    const remainingWords = contentWords(rawWords.filter((_, index) => !mentionIndexes.has(index)).join(' '));
    const allWords = contentWords(rewritten);
    const queryVector = embed?.(rewritten);
    const mentionedNames = [...new Set(mentions.map((mention) => mention.name))].join(', ');

    const candidates: Candidate[] = [];
    for (const item of indexed) {
      const entry = item.entry;
      if (options.kind && entry.kind !== options.kind) {
        continue;
      }
      if (options.integration && entry.integration?.slug !== options.integration) {
        continue;
      }
      const mentioned = entry.integration ? mentionedSlugs.has(entry.integration.slug) : false;
      const similarity = queryVector && item.vector ? cosine(queryVector, item.vector) : 0;

      const bonus = entry.kind === 'tool' ? presetBonus : 0;

      if (item.exactKeys.has(queryCompact)) {
        candidates.push({
          indexed: item,
          tier: 'exact',
          score: 1 + bonus + similarity,
          reason: entry.kind === 'tool' ? 'Exact name match; Cargo preset that tries several providers' : 'Exact name match',
          mentioned
        });
        continue;
      }

      if (mentioned && remainingWords.length === 0) {
        candidates.push({
          indexed: item,
          tier: 'name',
          score: 0.5 + similarity - kindOrder[entry.kind] * 0.01,
          reason: `Action of ${entry.integration?.name}`,
          mentioned
        });
        continue;
      }

      const name = nameCoverage(item, remainingWords);
      const nameQualifies = mentioned ? name.coverage > 0 : mentionedSlugs.size === 0 && name.coverage >= 0.99;
      if (nameQualifies) {
        candidates.push({
          indexed: item,
          tier: 'name',
          score: name.coverage + bonus + similarity * 0.5,
          reason: mentioned
            ? `Names ${entry.integration?.name}; action name matches "${name.matched.join(' ')}"`
            : `Action name matches "${name.matched.join(' ')}"`,
          mentioned
        });
        continue;
      }

      const keyword = keywordScore(item, mentioned ? remainingWords : allWords);
      const keywordQualifies = keyword.coverage >= 0.6 && keyword.score >= 0.15;
      if (keywordQualifies) {
        candidates.push({
          indexed: item,
          tier: 'keyword',
          score: keyword.score + bonus + similarity,
          reason: 'Keywords match its name, description or inputs',
          mentioned
        });
        continue;
      }

      if (similarity >= semanticThreshold) {
        candidates.push({
          indexed: item,
          tier: 'semantic',
          score: similarity,
          reason: `Similar meaning (${similarity.toFixed(2)})`,
          mentioned
        });
      }
    }

    candidates.sort((left, right) => {
      const tierDifference = tierOrder[left.tier] - tierOrder[right.tier];
      if (tierDifference !== 0) {
        return tierDifference;
      }
      if (left.mentioned !== right.mentioned) {
        return left.mentioned ? -1 : 1;
      }
      return right.score - left.score;
    });

    return candidates.slice(0, limit).map((candidate) => ({
      entry: candidate.indexed.entry,
      tier: candidate.tier,
      score: Number(candidate.score.toFixed(4)),
      reason: candidate.reason,
      usage: usageFor(candidate.indexed.entry)
    }));
  };

  const get = (identifier: string): CatalogEntry | undefined => {
    const key = compact(identifier);
    return indexed.find((item) => compact(item.entry.id) === key)?.entry;
  };

  return { search, get, mentionsFor: (query: string) => findMentions(normalize(rewrite(query)).split(' '), phrases), stem };
};

export type Ranker = ReturnType<typeof createRanker>;
