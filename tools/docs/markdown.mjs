import GithubSlugger from 'github-slugger';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { unified } from 'unified';

const parser = unified().use(remarkParse).use(remarkGfm);

/** Walk the maintained Markdown AST; code and HTML remain leaf nodes. */
export function walk(node, visit) {
  visit(node);
  for (const child of node.children ?? []) walk(child, visit);
}

export function visibleText(node) {
  if (node.type === 'text' || node.type === 'inlineCode') return node.value;
  if (node.type === 'break') return '\n';
  if (node.type === 'image' || node.type === 'html' || node.type === 'code')
    return '';
  return (node.children ?? []).map(visibleText).join('');
}

/** Retain rendered links and real headings, with source lines for diagnostics. */
export function parseDocument(file, content) {
  const tree = parser.parse(content);
  const definitions = new Map();
  walk(tree, (node) => {
    if (node.type === 'definition' && !definitions.has(node.identifier)) {
      definitions.set(node.identifier, node);
    }
  });
  const slugger = new GithubSlugger();
  const links = [];
  const headings = [];
  const html = [];
  walk(tree, (node) => {
    const line = node.position?.start.line ?? 1;
    if (node.type === 'heading') {
      const title = visibleText(node);
      headings.push({
        title,
        depth: node.depth,
        anchor: slugger.slug(title),
        line,
      });
    }
    if (node.type === 'html') html.push({ value: node.value, line });
    let destination;
    if (node.type === 'link' || node.type === 'image') destination = node.url;
    if (node.type === 'linkReference' || node.type === 'imageReference') {
      destination = definitions.get(node.identifier)?.url;
    }
    if (destination !== undefined) {
      links.push({
        destination,
        line,
        rendered:
          node.type.startsWith('link') && visibleText(node).trim().length > 0,
      });
    }
  });
  return {
    file,
    content,
    tree,
    headings,
    links,
    html,
    words: content.split(/\s+/u).filter(Boolean).length,
  };
}
