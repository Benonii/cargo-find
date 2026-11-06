import { readFileSync, writeFileSync } from 'node:fs';

const html = readFileSync('dist/index.html', 'utf8');
writeFileSync('../worker/src/page.ts', `export const page = ${JSON.stringify(html)};\n`);
console.log(`Embedded ${html.length} characters into worker/src/page.ts`);
