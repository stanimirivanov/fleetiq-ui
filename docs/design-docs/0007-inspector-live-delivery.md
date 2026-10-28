# Exact-property inspector live delivery

## TL;DR

Use cookie-authenticated same-origin SSE for one selected declared property.
Validate before applying; retain one complete baseline and one opaque cursor.
Reconnect finitely, reset on discontinuity, and cancel on ownership change.

## Transport and ownership

The shared managed Effect v4 runtime owns HTTP and streaming. A streaming request
bypasses JSON buffering only when explicitly requested. Its body has a 25-second
idle deadline and a 75-second total managed lifetime. Redirects, cross-origin
requests and credential headers remain rejected. Cursors travel only in
Last-Event-ID, never query parameters or browser storage.

The incremental UTF-8 parser accepts chunk/line splits, CRLF, comments, multiline
data and field ordering. It bounds each frame to 64 KiB and each incoming chunk
to 1 MiB. No detached producer, replay queue or collection of all frames exists.
Incomplete final events are never applied. Cancellation releases the reader and
the managed runtime interrupts outstanding work on disposal.

## State and recovery

The assets adapter validates the backend schema and exact property/unit/kind
invariants. Generated scalar/current schemas are reused. Effect's generator treats
SSE as a string, so small maintained event envelopes validate the extension
metadata; tests compare terminal reason vocabularies with the pinned contract.

An initial snapshot establishes state. Replacements require matching generation
and base revision; a forward revision jump is legal coalescing. Exact duplicate
positions leave state unchanged. Heartbeats update pending/evaluation and
recompute age while preserving source quality and the last applied cursor.
Unexpected positions discard the baseline and reconnect without the rejected id.

At most six connections are made per explicit start/retry, with bounded jittered
backoff between them. Network errors, unavailable controls and normal lease renewal
share this budget. A server recovery control discards state/cursor before retry.
Authentication, access, missing scope and payload-limit failures stop automatically;
authority failures hide current/history/provenance, and authentication invalidates
the app session. Stop closes the stream and returns to explicitly evaluated HTTP
evidence. Account/tenant/asset/property changes dispose the previous owner.

## Presentation and limits

The established inspector panel adds accessible start/stop/retry controls and an
explicit delivery state. Reconnecting values retain their original evaluation
instant; transport state never establishes asset health. Metadata cutoffs do not
change current projection semantics. History/provenance refresh independently.
Contract fixtures are synthetic. D06, hardware and full-profile deployment remain
deferred; this feature does not certify operational capacity or uninterrupted
background monitoring.
