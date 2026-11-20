## Summary

Describe the problem and resulting behavior using the smallest useful diagram,
diff sketch or tree. Link the owning issue and relevant milestone.

Feature/model/service boundaries, pinned contract compatibility, browser identity and data handling. For dependency changes, record maintained tool, exact pin, runtime/tooling role, alternatives, license and security review.

## Evidence

- **Before:** Reproduction, output or previous behavior.
- **After:** Verified result and exact commands.

`pnpm check`; browser/harness changes also require `pnpm e2e` and `pnpm verify --group browser-quality`.

Checks not run, blocking conditions, and residual risk:

## Merge Danger

**Door:** one-way or two-way

**Blast Radius:** affected scope

Describe material compatibility, security and operational risks, limitations and
rollback. Evidence and checked boxes do not grant publication, merge or live
infrastructure authority.
