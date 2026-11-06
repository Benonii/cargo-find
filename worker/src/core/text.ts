const stopwords = new Set([
  'a', 'an', 'the', 'to', 'into', 'in', 'on', 'of', 'for', 'from', 'with', 'by', 'and', 'or', 'my', 'our', 'their',
  'its', 'it', 'me', 'i', 'we', 'you', 'is', 'are', 'be', 'that', 'this', 'these', 'those', 'at', 'as', 'via',
  'using', 'use', 'how', 'do', 'can', 'want', 'need', 'please', 'some', 'all', 'any', 'given', 'based', 'each',
  'per', 'about', 'up', 'out', 'target', 'someone', 'somebody', 'thing', 'stuff', 'them', 'they', 'his', 'her', 'who', 'what', 'which', 'when', 'where', 'whose'
]);

export const splitIdentifier = (text: string): string =>
  text.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');

export const normalize = (text: string): string =>
  splitIdentifier(text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export const compact = (text: string): string => normalize(text).replace(/ /g, '');

export const stem = (word: string): string => {
  if (word.length > 4 && word.endsWith('ies')) {
    return `${word.slice(0, -3)}y`;
  }
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) {
    return word.slice(0, -1);
  }
  return word;
};

export const words = (text: string): string[] => {
  const normalized = normalize(text);
  return normalized.length === 0 ? [] : normalized.split(' ').map(stem);
};

export const contentWords = (text: string): string[] => words(text).filter((word) => !stopwords.has(word));

export const editDistanceWithin = (left: string, right: string, limit: number): boolean => {
  if (Math.abs(left.length - right.length) > limit) {
    return false;
  }
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let row = 1; row <= left.length; row += 1) {
    const current = [row];
    let rowMinimum = row;
    for (let column = 1; column <= right.length; column += 1) {
      const cost = left[row - 1] === right[column - 1] ? 0 : 1;
      const value = Math.min(previous[column] + 1, current[column - 1] + 1, previous[column - 1] + cost);
      current.push(value);
      rowMinimum = Math.min(rowMinimum, value);
    }
    if (rowMinimum > limit) {
      return false;
    }
    previous = current;
  }
  return previous[right.length] <= limit;
};

export const wordsMatch = (queryWord: string, candidateWord: string): boolean => {
  if (queryWord === candidateWord) {
    return true;
  }
  if (queryWord.length >= 5 && candidateWord.length >= 5) {
    return editDistanceWithin(queryWord, candidateWord, 1);
  }
  return false;
};
