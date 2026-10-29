# Local security preflight

## TL;DR

Run `pnpm security:preflight` before pushing. It runs source/history and npm
advisory checks, then builds and scans the production OCI runtime with the same
pinned scanner and policy as CI. A security-only pass cannot authorize image
publication or replace full acceptance/browser/image qualification.

## Prerequisites

- Reviewed Node 24, pinned pnpm, Git and a frozen installation:
  `pnpm install --frozen-lockfile`.
- Install the pinned source detector: `pnpm security:install`.
- Responsive Docker Desktop (Linux containers) or a Linux Docker engine,
  Buildx, and sufficient memory/disk for the production build and scanner.
- Network access to reviewed image registries, build dependencies, the npm
  advisory service and Trivy's vulnerability database.
- Run commands from the repository root. No live FleetIQ installation, Kubernetes
  resources, application credentials or browser installation is needed.

## Run before CI

```sh
pnpm security:preflight
```

Source/index/history secrets and npm advisory review run first. A failure stops
the command before Docker work. The image stage validates producer policy and
fixtures, verifies required remote pins independently of the Docker cache,
builds the same Dockerfile/platform with SBOM and provenance, and scans the
original OCI runtime manifest. It does not start FleetIQ, browser/TLS probes or
the temporary registry/transport roundtrip. Normal Docker build caching applies;
this still requires a production build, not a cheap source-only approximation.

For a focused image-only repeat after addressing a runtime finding:

```sh
pnpm security:image
```

That command does not establish source/history or npm security acceptance.
Full behavior remains available through `pnpm image:qualify`.

## Read the result

The canonical runner writes source-bound `.verification/*.json` evidence with
its selected checks and pass/fail/not-run status. Redacted scan and artifact
reports are retained under `dist/image-reports/<run-id>/`; the working OCI layout
is under `dist/images/run-<run-id>/`. Both are ignored outputs.

For a failed scan, inspect `scan.json` → `Results[]` → `Vulnerabilities[]`:
`PkgName`, `InstalledVersion`, `FixedVersion`, `Severity` and `VulnerabilityID`.
Never paste raw secret matches, credentials or private scanner output into an
issue. Raw secret-bearing scanner JSON is removed after redacted retention.
Missing/malformed output, unavailable tooling, stale databases, wrong image
identity and interrupted execution are failures, not clean scans.

The shared policy rejects HIGH/CRITICAL vulnerabilities (including unfixed ones)
and secret findings, requires OS/Go package coverage and a database updated
within 24 hours. No ignore list or severity exception is added. A later CI scan
can discover new advisories after a local pass; rerun the preflight when database
contents, dependencies or image pins change.

## Native runtime remediation

The former Caddy runtime pulled in unpatched go-jose v3 through Smallstep. The
owner approved dependency removal through the [NGINX decision](../design-docs/0012-native-nginx-edge.md).
The final image contains the official package-owned native NGINX binary and no
Caddy, Go build stage or JOSE module overlay. Qualification requires NGINX in both
runtime scanner inventory and SBOM, and rejects any unexpected Go binary.

No vulnerability is suppressed: the same exact-OCI, fresh-DB, high/critical and
secret gates remain authoritative. A clean result must be measured from actual
runtime bytes; changing server technology alone does not prove a scan pass.
