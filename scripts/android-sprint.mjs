import { readFile, writeFile } from 'node:fs/promises';

const index = await readFile('dist/index.html', 'utf8');
const entry = index.match(
  /<script\b[^>]*type="module"[^>]*src="\.\/assets\/[^"]+"[^>]*><\/script>/,
);
if (!entry) throw new Error('Missing built Android JavaScript entry');
const sprint = await readFile('src/sprint/page.html', 'utf8');
if (!sprint.includes('</body>')) throw new Error('Invalid sprint HTML');
await writeFile(
  'dist/sprint.html',
  sprint.replace('</body>', () => entry[0] + '\n</body>'),
);
