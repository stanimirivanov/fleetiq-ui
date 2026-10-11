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
