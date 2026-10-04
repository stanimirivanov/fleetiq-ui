# Reliability

## TL;DR

The current shells are offline from the backend. Each live feature must define freshness, reconnection, cancellation, and user-visible degradation before calling itself real-time.

Use bounded subscriptions and clean them up when a screen unmounts or tenant/session changes. Distinguish last known value from current value and carry timestamp and source where available. Reconnect with backoff, resnapshot after gaps, and avoid presenting an old value as live. A failed command is not an optimistic success; surface server acknowledgment and audit status. Test interrupted streams, missing data, duplicate events, and slow devices at the adapter boundary. Mobile background execution and push behavior require device evidence before release.

Performance budgets and SLOs will be set with the first real map and live-stream feature, not invented by this scaffold.
