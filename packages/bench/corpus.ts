/**
 * Writes `fixtures/corpus.txt`, the frozen code corpus of the big-context workload (SPEC §5):
 * the plugin sources, tests and fixtures, then the bench sources, sorted, each behind a
 * `// file:` header, cut at `CORPUS_CHARS` on a line boundary. Only public repository sources;
 * the file is committed and regenerated on purpose only, since changing it changes the workload.
 *
 *   node corpus.ts
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { CORPUS_CHARS, CORPUS_FILE } from './workloads/big-context.ts';

const ROOT = path.join(import.meta.dirname, '..', '..');
const SOURCES = [
  {
    dir: 'packages/plugin',
    include: /^(index\.ts|rpc\.ts|tui\.tsx|(src|tests)\/.*\.(ts|tsx|json))$/,
  },
  { dir: 'packages/bench', include: /^([\w-]+\.ts|workloads\/[\w-]+\.ts)$/ },
];

/** Repository paths of the corpus files, in corpus order. */
export function corpusFiles(root = ROOT): string[] {
  return SOURCES.flatMap(({ dir, include }) =>
    readdirSync(path.join(root, dir), { recursive: true, encoding: 'utf8' })
      .map((file) => file.split(path.sep).join('/'))
      .filter((file) => !file.includes('node_modules') && include.test(file))
      .sort()
      .map((file) => `${dir}/${file}`),
  );
}

export function buildCorpus(root = ROOT, limit = CORPUS_CHARS): string {
  let text = '';
  for (const file of corpusFiles(root)) {
    text += `// file: ${file}\n${readFileSync(path.join(root, file), 'utf8')}\n`;
    if (text.length >= limit) break;
  }
  if (text.length <= limit) return text;
  return text.slice(0, text.lastIndexOf('\n', limit) + 1);
}

if (import.meta.main) {
  const corpus = buildCorpus();
  mkdirSync(path.dirname(CORPUS_FILE), { recursive: true });
  writeFileSync(CORPUS_FILE, corpus);
  console.log(
    `${corpus.length.toLocaleString('en-US')} characters → ${path.relative(process.cwd(), CORPUS_FILE)}`,
  );
}
