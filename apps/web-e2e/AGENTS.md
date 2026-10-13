# Browser scenarios and executable guides
Read [testing](../../docs/development/testing.md) and
[verification](../../docs/development/verification.md) before changing this scope.

Page objects own locators/actions; scenarios own assertions. Guide journeys
should explain a coherent operator task. Tests without guide tags remain ordinary
regressions. Keep HTTP fixtures test-owned; product code cannot rely on them.

Production journeys run against an owned built preview; sample walkthroughs use
an explicitly separate development server. Avoid fixed sleeps and reused servers.
Use the documented port overrides when a default is occupied.

Run both browser groups and the guide assembler tests. Do not claim stubbed OIDC
responses qualify a real identity provider or deployment. Never capture provider
tokens or credentials in screenshots, guide copy or test evidence.

Follow [capture and retention policy](../../docs/development/security-delivery.md): loopback synthetic/contract mocks only, no live identity recordings or shared browser profiles. Validate artifact inspection before retention.

Scenarios import the owned test fixture; direct Playwright imports bypassing observation are forbidden. Run pnpm verify --group browser-quality too. Read [measured quality](../../docs/development/measured-browser-quality.md) for seeded workloads, no-retry qualification and redacted observations. Resource scenarios use the owned measurement fixture
and recorder-free project; correctness scenarios retain diagnostic traces. Keep
all registered projects and prerequisite/retention controls in the quality lane.
