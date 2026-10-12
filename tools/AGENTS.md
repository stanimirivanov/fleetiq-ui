# Harness sensors
Read [verification](../docs/development/verification.md),
[contribution workflow](../CONTRIBUTING.md) and
[contract ownership](../contracts/http/README.md) for this scope.

Use maintained parsers for Markdown, YAML and source graphs. Tooling parser
versions are independent of the application compiler; declare them explicitly.
Keep executable policy, its fixtures, local commands and CI routes in agreement.

Every sensor change needs positive and deliberately invalid fixtures. Setup or
extraction failure must fail qualification, never skip it. Test actual configured
CLIs where a pure helper test cannot prove extraction or scope. Keep temporary
files in verified owned roots and inspect symlink/junction containment.

Evidence records bounded statuses and source identity, never raw command output,
environment or response payloads. A sensor cannot attest its own independence:
policy changes require owner review and external GitHub ruleset configuration.

Follow [trust and delivery](../docs/development/security-delivery.md) for current/trusted-base policies, checked detector pins, redacted findings and recovery. Keep compiler and AST parser pins independent. Static syntax sensors have documented limits.

Read [measured quality](../docs/development/measured-browser-quality.md) for scoped coverage, actual assertion/browser qualification, final output budgets and payload-free measurements. Missing tools or metrics cannot become successful qualification.
