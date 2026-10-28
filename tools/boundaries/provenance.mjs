import ts from 'typescript-parser';

const transports = new Set([
  'fetch',
  'XMLHttpRequest',
  'EventSource',
  'WebSocket',
]);
const browserGlobals = new Set([
  'window',
  'self',
  'globalThis',
  'document',
  'navigator',
  'location',
  'history',
  'localStorage',
  'sessionStorage',
  'performance',
  'setTimeout',
  'setInterval',
  'clearTimeout',
  'clearInterval',
  'requestAnimationFrame',
  'cancelAnimationFrame',
  'requestIdleCallback',
  'cancelIdleCallback',
  'AbortController',
  'indexedDB',
  'caches',
  'Worker',
  'SharedWorker',
  'matchMedia',
  ...transports,
]);
export const effectExecutors = new Set([
  'runSync',
  'runSyncExit',
  'runPromise',
  'runPromiseExit',
  'runFork',
  'runCallback',
]);

/** Imports are classified by package/subpath, never by parsing source text. */
export function isNetworkImport(specifier) {
  const packageName = specifier.startsWith('@')
    ? specifier.split('/').slice(0, 2).join('/')
    : specifier.split('/')[0];
  return (
    new Set([
      'maplibre-gl',
      'axios',
      'ky',
      'ofetch',
      'got',
      'undici',
      'cross-fetch',
      'node-fetch',
      'superagent',
      'socket.io-client',
      'graphql-request',
      'ws',
      '@apollo/client',
      '@effect/platform',
      '@effect/platform-node',
    ]).has(packageName) ||
    [
      'effect/http',
      'effect/http-api',
      'effect/net',
      'effect/socket',
      'effect/rpc',
      'effect/unstable/http',
      'node:http',
      'node:https',
      'node:net',
      'node:tls',
    ].some(
      (prefix) => specifier === prefix || specifier.startsWith(`${prefix}/`),
    )
  );
}

function importCapability(specifier, member) {
  if (specifier === 'effect') {
    if (member === '*') return 'effect-package';
    if (['Effect', 'Runtime', 'ManagedRuntime'].includes(member))
      return 'effect-namespace';
  }
  if (
    ['effect/Effect', 'effect/Runtime', 'effect/ManagedRuntime'].includes(
      specifier,
    )
  ) {
    if (member === '*' || member === 'default') return 'effect-namespace';
    if (effectExecutors.has(member)) return 'effect-executor';
  }
  return null;
}

function unwrap(node) {
  while (
    node &&
    (ts.isParenthesizedExpression(node) ||
      ts.isAsExpression(node) ||
      ts.isTypeAssertionExpression(node) ||
      ts.isNonNullExpression(node) ||
      ts.isSatisfiesExpression(node))
  )
    node = node.expression;
  return node;
}

/**
 * Bind representative local aliases to compiler symbols, preserving shadowing.
 * This is bounded static provenance, not arbitrary inter-module/data-flow proof.
 */
export function collectProvenance(source, checker) {
  const capabilities = new Map();
  const symbol = (identifier) => checker.getSymbolAtLocation(identifier);
  function assign(identifier, capability) {
    if (!capability || !ts.isIdentifier(identifier)) return false;
    const key = symbol(identifier);
    if (!key || capabilities.get(key) === capability) return false;
    capabilities.set(key, capability);
    return true;
  }
  function property(capability, member) {
    if (capability === 'browser-root') {
      if (transports.has(member) || member === 'sendBeacon') return 'transport';
      if (browserGlobals.has(member))
        return member === 'window' ||
          member === 'self' ||
          member === 'globalThis'
          ? 'browser-root'
          : 'browser-global';
    }
    if (capability === 'browser-global' && member === 'sendBeacon')
      return 'transport';
    if (
      capability === 'effect-package' &&
      ['Effect', 'Runtime', 'ManagedRuntime'].includes(member)
    )
      return 'effect-namespace';
    if (
      (capability === 'effect-namespace' || capability === 'managed-runtime') &&
      effectExecutors.has(member)
    )
      return 'effect-executor';
    if (capability === 'effect-namespace' && member === 'make')
      return 'runtime-factory';
    if (
      ['transport', 'effect-executor'].includes(capability) &&
      ['bind', 'call', 'apply'].includes(member)
    )
      return capability;
    return null;
  }
  function evaluate(input) {
    const node = unwrap(input);
    if (!node) return null;
    if (ts.isIdentifier(node)) {
      const key = symbol(node);
      if (key && capabilities.has(key)) return capabilities.get(key);
      // TypeScript supplies an intrinsic globalThis symbol without declarations.
      // Locally declared shadows still have declarations and remain ordinary data.
      if (key?.declarations?.length) return null;
      if (transports.has(node.text)) return 'transport';
      if (browserGlobals.has(node.text))
        return ['window', 'self', 'globalThis'].includes(node.text)
          ? 'browser-root'
          : 'browser-global';
      return null;
    }
    if (ts.isPropertyAccessExpression(node))
      return property(evaluate(node.expression), node.name.text);
    if (
      ts.isElementAccessExpression(node) &&
      node.argumentExpression &&
      ts.isStringLiteralLike(node.argumentExpression)
    )
      return property(evaluate(node.expression), node.argumentExpression.text);
    if (ts.isCallExpression(node)) {
      if (evaluate(node.expression) === 'runtime-factory')
        return 'managed-runtime';
      if (
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.name.text === 'bind'
      )
        return evaluate(node.expression.expression);
    }
    return null;
  }
  const declarations = [];
  function collect(node) {
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteralLike(node.moduleSpecifier)
    ) {
      const specifier = node.moduleSpecifier.text;
      const clause = node.importClause;
      if (clause && !clause.isTypeOnly) {
        if (clause.name)
          assign(clause.name, importCapability(specifier, 'default'));
        const bindings = clause.namedBindings;
        if (bindings && ts.isNamespaceImport(bindings))
          assign(bindings.name, importCapability(specifier, '*'));
        else if (bindings && ts.isNamedImports(bindings))
          for (const member of bindings.elements)
            if (!member.isTypeOnly)
              assign(
                member.name,
                importCapability(
                  specifier,
                  (member.propertyName ?? member.name).text,
                ),
              );
      }
    }
    if (ts.isVariableDeclaration(node) && node.initializer)
      declarations.push(node);
    ts.forEachChild(node, collect);
  }
  collect(source);
  // Every iteration must add or refine a finite declaration's capability.
  for (let iteration = 0; iteration <= declarations.length; iteration += 1) {
    let changed = false;
    for (const declaration of declarations) {
      const capability = evaluate(declaration.initializer);
      if (ts.isIdentifier(declaration.name))
        changed = assign(declaration.name, capability) || changed;
      else if (ts.isObjectBindingPattern(declaration.name))
        for (const member of declaration.name.elements)
          if (!member.dotDotDotToken && ts.isIdentifier(member.name)) {
            const name = member.propertyName ?? member.name;
            if (ts.isIdentifier(name) || ts.isStringLiteralLike(name))
              changed =
                assign(member.name, property(capability, name.text)) || changed;
          }
    }
    if (!changed) break;
  }
  return { evaluate };
}
