import ts from 'typescript-parser';
import { isModelSource } from './policy.mjs';
import { collectProvenance, isNetworkImport } from './provenance.mjs';

function isRuntimeReference(node) {
  let parent = node.parent;
  if (ts.isIdentifier(node)) {
    if (
      (ts.isPropertyAccessExpression(parent) && parent.name === node) ||
      ((ts.isPropertyAssignment(parent) || ts.isMethodDeclaration(parent)) &&
        parent.name === node) ||
      ((ts.isVariableDeclaration(parent) ||
        ts.isParameter(parent) ||
        ts.isBindingElement(parent)) &&
        parent.name === node)
    )
      return false;
  }
  for (; parent; parent = parent.parent) {
    if (
      ts.isTypeNode(parent) ||
      ts.isImportDeclaration(parent) ||
      ts.isExportDeclaration(parent)
    )
      return false;
  }
  return true;
}

/** AST diagnostics contain policy, owned path and position; never source content. */
export function analyzeBoundarySource(source, relative, checker, policy) {
  const diagnostics = [];
  const { evaluate } = collectProvenance(source, checker);
  const model = isModelSource(relative);
  const allowed = new Set(
    policy.adapters.find((entry) => entry.file === relative)?.allows ?? [],
  );
  function report(rule, node) {
    if (allowed.has(rule)) return;
    const point = source.getLineAndCharacterOfPosition(node.getStart(source));
    diagnostics.push({
      rule,
      file: relative,
      line: point.line + 1,
      column: point.character + 1,
    });
  }
  function visit(node) {
    let imported;
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteralLike(node.moduleSpecifier)
    )
      imported = node.moduleSpecifier.text;
    if (
      ts.isCallExpression(node) &&
      node.arguments.length &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) &&
          node.expression.text === 'require')) &&
      ts.isStringLiteralLike(node.arguments[0])
    )
      imported = node.arguments[0].text;
    if (imported && isNetworkImport(imported))
      report('network-client-import', node);
    if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
      const capability = evaluate(node.expression);
      if (capability === 'transport') report('raw-browser-transport', node);
      if (capability === 'effect-executor')
        report('unmanaged-effect-execution', node);
    }
    if (
      isRuntimeReference(node) &&
      (ts.isIdentifier(node) ||
        ts.isPropertyAccessExpression(node) ||
        ts.isElementAccessExpression(node))
    ) {
      const capability = evaluate(node);
      // Passing an executor to pipe or transport as a callback is still a bypass.
      if (capability === 'transport') report('raw-browser-transport', node);
      if (capability === 'effect-executor')
        report('unmanaged-effect-execution', node);
      if (
        model &&
        ['browser-root', 'browser-global', 'transport'].includes(capability)
      )
        report('model-browser-global', node);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return [
    ...new Map(
      diagnostics.map((entry) => [
        [entry.rule, entry.file, entry.line, entry.column].join(':'),
        entry,
      ]),
    ).values(),
  ];
}
