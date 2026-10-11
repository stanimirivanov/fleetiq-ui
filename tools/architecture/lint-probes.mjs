/** Selected Solid/Effect rules are qualified through Biome's own diagnostics. */
export const lintProbes = [
  {
    name: 'Solid destructured parameters fail',
    diagnostic: 'lint/correctness/noSolidDestructuredProps',
    source:
      'export function Probe({ label }: { readonly label: string }) {\n  return <div>{label}</div>;\n}\n',
  },
  {
    name: 'JSX array mapping fails',
    diagnostic: 'lint/performance/useSolidForComponent',
    source:
      'export function Probe(props: { readonly items: string[] }) {\n  return <div>{props.items.map((item) => <span>{item}</span>)}</div>;\n}\n',
  },
  {
    name: 'direct Effect in presentation fails',
    diagnostic: 'lint/style/noRestrictedImports',
    source:
      "import { Effect } from 'effect';\nexport function Probe() {\n  void Effect.succeed(1);\n  return <div />;\n}\n",
  },
  {
    name: 'Effect runtime subpath in presentation fails',
    diagnostic: 'lint/style/noRestrictedImports',
    source:
      "import { runPromise } from 'effect/Effect';\nexport function Probe() {\n  void runPromise;\n  return <div />;\n}\n",
  },
];
