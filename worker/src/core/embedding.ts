import type { EmbeddingModel, QueryEmbedder } from '@/types';

const maximumCharactersPerWord = 100;

const isPunctuation = (character: string): boolean => {
  const code = character.codePointAt(0) ?? 0;
  if ((code >= 33 && code <= 47) || (code >= 58 && code <= 64) || (code >= 91 && code <= 96)) {
    return true;
  }
  if (code >= 123 && code <= 126) {
    return true;
  }
  return /\p{P}/u.test(character);
};

const preTokenize = (text: string): string[] => {
  const cleaned = text
    .toLowerCase()
    .replace(/[\u0000�]/g, '')
    .replace(/\s+/g, ' ');
  const pieces: string[] = [];
  for (const chunk of cleaned.split(' ')) {
    let current = '';
    for (const character of chunk) {
      if (isPunctuation(character)) {
        if (current.length > 0) {
          pieces.push(current);
        }
        pieces.push(character);
        current = '';
      } else {
        current += character;
      }
    }
    if (current.length > 0) {
      pieces.push(current);
    }
  }
  return pieces;
};

const wordPiece = (word: string, vocabulary: Map<string, number>): number[] => {
  if (word.length > maximumCharactersPerWord) {
    return [];
  }
  const identifiers: number[] = [];
  let start = 0;
  while (start < word.length) {
    let end = word.length;
    let found: number | undefined;
    while (start < end) {
      const piece = start > 0 ? `##${word.slice(start, end)}` : word.slice(start, end);
      const identifier = vocabulary.get(piece);
      if (identifier !== undefined) {
        found = identifier;
        break;
      }
      end -= 1;
    }
    if (found === undefined) {
      return [];
    }
    identifiers.push(found);
    start = end;
  }
  return identifiers;
};

export const tokenize = (text: string, vocabulary: Map<string, number>): number[] =>
  preTokenize(text).flatMap((word) => wordPiece(word, vocabulary));

export const createEmbeddingModel = (
  vocabularyText: string,
  tokenBytes: Uint8Array,
  scaleBytes: Uint8Array,
  dimensions: number
): EmbeddingModel => {
  const vocabulary = new Map<string, number>();
  vocabularyText.split('\n').forEach((token, index) => {
    if (token.length > 0) {
      vocabulary.set(token, index);
    }
  });
  return {
    dimensions,
    vocabulary,
    vectors: new Int8Array(tokenBytes.buffer, tokenBytes.byteOffset, tokenBytes.byteLength),
    scales: new Float32Array(scaleBytes.buffer.slice(scaleBytes.byteOffset, scaleBytes.byteOffset + scaleBytes.byteLength))
  };
};

export const createQueryEmbedder =
  (model: EmbeddingModel): QueryEmbedder =>
  (text) => {
    const identifiers = tokenize(text, model.vocabulary);
    if (identifiers.length === 0) {
      return undefined;
    }
    const sum = new Float32Array(model.dimensions);
    for (const identifier of identifiers) {
      const scale = model.scales[identifier];
      const offset = identifier * model.dimensions;
      for (let index = 0; index < model.dimensions; index += 1) {
        sum[index] += model.vectors[offset + index] * scale;
      }
    }
    let length = 0;
    for (let index = 0; index < model.dimensions; index += 1) {
      sum[index] /= identifiers.length;
      length += sum[index] * sum[index];
    }
    const norm = length > 0 ? Math.sqrt(length) : 1;
    for (let index = 0; index < model.dimensions; index += 1) {
      sum[index] /= norm;
    }
    return sum;
  };

export const decodeEntryVectors = (
  vectorBytes: Uint8Array,
  scaleBytes: Uint8Array,
  dimensions: number
): Float32Array[] => {
  const quantized = new Int8Array(vectorBytes.buffer, vectorBytes.byteOffset, vectorBytes.byteLength);
  const scales = new Float32Array(scaleBytes.buffer.slice(scaleBytes.byteOffset, scaleBytes.byteOffset + scaleBytes.byteLength));
  return Array.from(scales, (scale, row) => {
    const vector = new Float32Array(dimensions);
    for (let index = 0; index < dimensions; index += 1) {
      vector[index] = quantized[row * dimensions + index] * scale;
    }
    return vector;
  });
};

export const cosine = (left: Float32Array, right: Float32Array): number => {
  let dot = 0;
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
  }
  return dot;
};
