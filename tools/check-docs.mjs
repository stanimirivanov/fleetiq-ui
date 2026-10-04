import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ignored = new Set(['.git', 'node_modules', 'dist', '.expo']);
const required = [
  'AGENTS.md',
  'ARCHITECTURE.md',
  'CONTRIBUTING.md',
  'docs/README.md',
  'docs/FRONTEND.md',
  'docs/PLANS.md',
  'docs/exec-plans/active',
  'docs/exec-plans/completed',
  'docs/exec-plans/tech-debt-tracker.md',
];
const errors = [];

function collect(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (ignored.has(entry.name)) return [];
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return collect(target);
    return entry.name.endsWith('.md') ? [target] : [];
  });
}

for (const relative of required) {
  if (!existsSync(path.join(root, relative))) {
    errors.push(`${relative}: required harness entry is missing`);
  }
}

for (const file of collect(root)) {
  const content = readFileSync(file, 'utf8');
  const label = path.relative(root, file).replaceAll('\\', '/');
  const wordCount = content.split(/\s+/u).filter(Boolean).length;
  if (wordCount >= 600 && !/^# .+\r?\n\r?\n## TL;DR/mu.test(content)) {
    errors.push(
      `${label}: documents of 600+ words need ## TL;DR after the title`,
    );
  }

  for (const match of content.matchAll(/\[[^\]]+\]\(([^)]+)\)/gu)) {
    const destination = match[1].split('#')[0];
    if (!destination || /^(?:https?:|mailto:)/u.test(destination)) continue;
    const resolved = path.resolve(
      path.dirname(file),
      decodeURIComponent(destination),
    );
    const relative = path.relative(root, resolved);
    if (
      relative.startsWith('..') ||
      path.isAbsolute(relative) ||
      !existsSync(resolved)
    ) {
      errors.push(`${label}: broken or out-of-repository link ${match[1]}`);
    }
  }

  for (const status of ['active', 'completed']) {
    if (
      label.startsWith(`docs/exec-plans/${status}/`) &&
      !label.endsWith('/README.md')
    ) {
      if (!content.includes(`Status: ${status}`)) {
        errors.push(`${label}: execution plan requires Status: ${status}`);
      }
    }
  }
}

if (errors.length) {
  for (const error of errors.sort()) console.error(error);
  process.exitCode = 1;
} else {
  console.log('Documentation structure and local links are valid.');
}
