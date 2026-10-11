import { visibleText } from './markdown.mjs';

const sectionNames = {
  goal: ['goal'],
  scope: ['scope'],
  evidence: ['acceptance evidence', 'evidence', 'audit acceptance evidence'],
};

function sectionNodes(document, heading) {
  const start = document.tree.children.findIndex(
    (node) =>
      node.type === 'heading' && node.position.start.line === heading.line,
  );
  const next = document.tree.children.findIndex(
    (node, index) =>
      index > start && node.type === 'heading' && node.depth <= heading.depth,
  );
  return document.tree.children.slice(start + 1, next < 0 ? undefined : next);
}

/** Metadata must be real leading paragraph text, never examples or code. */
export function planMetadata(document) {
  const fields = new Map();
  for (const node of document.tree.children) {
    if (
      node.type === 'heading' &&
      node.depth === 2 &&
      visibleText(node) !== 'TL;DR'
    )
      break;
    if (
      node.type !== 'paragraph' ||
      node.children.some(
        (child) => child.type !== 'text' && child.type !== 'break',
      )
    )
      continue;
    for (const [offset, line] of visibleText(node).split(/\r?\n/u).entries()) {
      const match = /^(Status|Milestone): (.+)$/u.exec(line);
      if (match) {
        const records = fields.get(match[1]) ?? [];
        records.push({
          value: match[2],
          line: node.position.start.line + offset,
        });
        fields.set(match[1], records);
      }
    }
  }
  return fields;
}

/** Protect the common historical shape, not retroactive prose templates. */
export function validatePlan(document) {
  const match = /^docs\/exec-plans\/(active|completed)\/(.+\.md)$/u.exec(
    document.file,
  );
  if (!match || match[2] === 'README.md') return [];
  const diagnostics = [];
  const add = (line, message) =>
    diagnostics.push({ file: document.file, line, code: 'docs.plan', message });
  const fields = planMetadata(document);
  const statuses = fields.get('Status') ?? [];
  if (
    statuses.length !== 1 ||
    !new RegExp(`^${match[1]}(?:$|[ (])`, 'u').test(statuses[0].value)
  ) {
    add(
      statuses[0]?.line ?? 1,
      `plan requires one leading Status: ${match[1]} field`,
    );
  }
  const milestones = fields.get('Milestone') ?? [];
  if (
    milestones.length !== 1 ||
    !/^M(?:0[1-9]|[1-9]\d) - \S.+$/u.test(milestones[0].value)
  ) {
    add(
      milestones[0]?.line ?? 1,
      'plan requires one leading Milestone: M01 - Title field',
    );
  }
  for (const aliases of Object.values(sectionNames)) {
    const node = document.tree.children.find(
      (candidate) =>
        candidate.type === 'heading' &&
        candidate.depth === 2 &&
        aliases.includes(visibleText(candidate).toLowerCase()),
    );
    const heading = node && {
      title: visibleText(node),
      depth: node.depth,
      line: node.position.start.line,
    };
    if (!heading) {
      add(1, `plan requires a real ## ${aliases[0]} section`);
      continue;
    }
    const text = sectionNodes(document, heading)
      .map(visibleText)
      .join(' ')
      .trim();
    if (!text)
      add(
        heading.line,
        `plan section ${heading.title} must contain substantive text`,
      );
    if (
      aliases[0] === 'acceptance evidence' &&
      text &&
      !/\b(pass(?:ed|es)?|fail(?:ed)?|not[- ]run|not rerun|pending|blocked|unverified)\b/iu.test(
        text,
      )
    ) {
      add(
        heading.line,
        'evidence must distinguish passed, failed, not-run or pending checks',
      );
    }
  }
  return diagnostics;
}
