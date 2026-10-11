import { readFileSync } from 'node:fs';
import { resolveLink } from './links.mjs';
import { parseDocument } from './markdown.mjs';
import { validatePlan } from './plans.mjs';
import { documentationPolicy } from './policy.mjs';
import { discoverSources, resolveOwnedPath } from './source.mjs';

function add(diagnostics, file, line, code, message) {
  diagnostics.push({ file, line, code, message });
}

function checkContext(document, rule, targets, diagnostics) {
  if (document.words > rule.maxWords) {
    add(
      diagnostics,
      document.file,
      1,
      'docs.context',
      `context exceeds its ${rule.maxWords}-word budget`,
    );
  }
  const comments = document.html.every(
    ({ value }) => value.replace(/<!--[\s\S]*?-->/gu, '').trim() === '',
  );
  if (!comments)
    add(
      diagnostics,
      document.file,
      1,
      'docs.routes',
      'guidance routes use plain Markdown; non-comment HTML is not permitted',
    );
  for (const target of rule.targets) {
    if (!targets.has(target))
      add(
        diagnostics,
        document.file,
        1,
        'docs.routes',
        `missing rendered canonical route to ${target}`,
      );
  }
}

/** Validate only Git-owned and newly authored unignored documentation. */
export function checkDocumentation(
  root,
  { policy = documentationPolicy, runGit } = {},
) {
  const diagnostics = [];
  let inventory;
  try {
    inventory = discoverSources(root, runGit);
  } catch (error) {
    add(diagnostics, 'AGENTS.md', 1, 'docs.discovery', error.message);
    return { diagnostics, documents: new Map(), sourceFiles: [] };
  }
  const sources = new Set(inventory);
  const documents = new Map();
  for (const file of inventory.filter((source) => source.endsWith('.md'))) {
    try {
      const target = resolveOwnedPath(root, file);
      documents.set(
        file,
        parseDocument(file, readFileSync(target.absolute, 'utf8')),
      );
    } catch (error) {
      add(diagnostics, file, 1, 'docs.source', error.message);
    }
  }
  for (const entry of policy.requiredEntries) {
    try {
      const target = resolveOwnedPath(root, entry);
      if (!target.metadata.isDirectory() && !sources.has(entry)) {
        throw new Error(
          'required context is ignored or outside the source inventory',
        );
      }
    } catch (error) {
      add(
        diagnostics,
        entry,
        1,
        'docs.required',
        `required harness entry: ${error.message}`,
      );
    }
  }
  const routes = new Map();
  for (const document of documents.values()) {
    const [title, summary] = document.tree.children.filter(
      (node) => node.type !== 'html',
    );
    if (
      document.words >= 600 &&
      !(
        title?.type === 'heading' &&
        title.depth === 1 &&
        summary?.type === 'heading' &&
        summary.depth === 2 &&
        document.headings.find(
          (heading) => heading.line === summary.position.start.line,
        )?.title === 'TL;DR'
      )
    ) {
      add(
        diagnostics,
        document.file,
        1,
        'docs.summary',
        'documents of 600+ words need ## TL;DR immediately after the title',
      );
    }
    const rendered = new Set();
    for (const link of document.links) {
      try {
        const target = resolveLink(
          root,
          document.file,
          link.destination,
          sources,
        );
        if (!target) continue;
        if (target.fragment !== undefined && target.fragment !== '') {
          const destination = documents.get(target.relative);
          if (
            !destination?.headings.some(
              (heading) => heading.anchor === target.fragment,
            )
          ) {
            throw new Error('destination heading anchor does not exist');
          }
        }
        if (link.rendered) rendered.add(target.relative);
      } catch (error) {
        add(diagnostics, document.file, link.line, 'docs.link', error.message);
      }
    }
    routes.set(document.file, rendered);
    diagnostics.push(...validatePlan(document));
  }
  for (const rule of policy.guidanceRoutes) {
    const document = documents.get(rule.file);
    if (!document)
      add(
        diagnostics,
        rule.file,
        1,
        'docs.routes',
        'registered guidance source is missing',
      );
    else checkContext(document, rule, routes.get(rule.file), diagnostics);
  }
  diagnostics.sort(
    (left, right) =>
      left.file.localeCompare(right.file) ||
      left.line - right.line ||
      left.code.localeCompare(right.code),
  );
  return { diagnostics, documents, sourceFiles: inventory };
}
