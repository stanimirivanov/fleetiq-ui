# 0010: Asset and temporal relationship commissioning

## TL;DR

Registry review gains explicit asset creation and directed temporal revision commands.
The existing backend baseline remains unchanged. Commands use the application-owned
same-origin runtime; no credentials, actor attribution or recorded time are authored
by a form. Signal-binding authoring remains PR 32.

## Boundaries

- Pure commissioning models own exact references, identity/namespace validation,
  decimal u64 revisions, half-open intervals and safe numeric input conversion.
- A dedicated asset-feature gateway invokes generated registration, relationship
  revision and definition-catalogue operations. Generated decoding checks shape;
  boundary checks reject wrong receipt identity, invalid audit precision and
  inconsistent catalogue traversal. The app injects the port and explicit grants.
- Existing metadata readers remain read-only. Browser generation now selects two
  already-published operations: relationship-type discovery and relationship revision
  append. The vendored OpenAPI bytes and backend revision do not change.
- Forms select bounded discovered versions explicitly. Definition pages clear their
  selection on traversal; no latest alias, exhaustive inventory or guessed version
  is introduced. Source and target IDs are explicit; the backend checks same-tenant
  existence, authorization and relationship construction.

## Command lifetime and outcomes

The permission hint requires metadata.read and metadata.manage on the selected
current discovery page. Read-only review is retained. Manage alone grants no read
capability. The server remains the authority for each protected command.

A mounted command owner captures an immutable request, blocks double submission,
never retries automatically and aborts on unmount. Tenant/access revision changes
remount forms and cancel prior work, including non-cooperative late completion.
Changing review cutoffs does not change the tenant-owned frozen command.

- Acknowledged registration/revision returns original actor and recorded time.
  A fresh authoritative registry read is requested, selecting the registered asset
  or relationship source, clearing old filters/cursors, using receipt known time
  and the command's explicit effective start. Receipt success is distinct from
  subsequent read success. A failed refresh never fabricates an asset or edge.
- Conflicts and denied writes remain definite failures. A correction names an
  explicit exact successor revision; a historical snapshot does not prove the head.
  There is no overwrite or automatic revision increment.
- Network/server failures and invalid receipts are ambiguous: the server may have
  committed. Fields stay locked. After reviewing evidence the operator may replay
  only the exact captured identity, revision and complete content, using the
  backend's idempotent command contract. No revised content is silently retried.
- After acknowledged success, Prepare another command explicitly unlocks the form.
  Unauthorized commands also invalidate the app-owned session.

## Time and precision

Relationship revisions stay decimal strings through the full u64 range. Effective
milliseconds must be canonical integers in JavaScript's safe integer range; inputs
outside that range are rejected, never rounded. The backend wire contract uses
JSON numbers, so this UI deliberately supports an exact subset of int64. A blank
end is unbounded; a finite end must be strictly after the inclusive start.

## Verification and budget

Focused model, real-runtime gateway and Solid owner tests cover validation,
CSRF/cookie transport, receipt mismatch, definition paging, conflict, double submit,
unknown outcomes, cancellation and explicit replay. Stateful POM journeys cover
registration, namespace identity, temporal corrections and authoritative refresh.
The required connected guide explains exact-version paging, registration/audit,
directed revision 1, correction and conflict recovery. Dedicated accessibility
journeys cover desktop/narrow and both themes, including rejected commands.

The owner approved a 425,000-byte non-map raw JavaScript budget on 2026-10-29
for this complete feature. The 120,000 gzip cap is unchanged, as are map/worker,
CSS, performance, existing coverage and security limits. Heavy complete acceptance,
browser-quality, image and guide generation remain CI work. D06 and full-profile
qualification remain deferred.
