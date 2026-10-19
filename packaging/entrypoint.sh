#!/bin/sh
# Runtime-only configuration never becomes a Vite/browser build input.
set -eu
invalid() { printf '%s\n' 'Invalid edge configuration; require a public DNS authority and a private HTTP host:port upstream.' >&2; exit 78; }
: "${FLEETIQ_PUBLIC_AUTHORITY:=}"
: "${FLEETIQ_API_UPSTREAM:=}"
for value in "$FLEETIQ_PUBLIC_AUTHORITY" "$FLEETIQ_API_UPSTREAM"; do
  [ -n "$value" ] && [ "${#value}" -le 260 ] || invalid
  case "$value" in *[!a-zA-Z0-9.:-]*|.*|-*|*:|:*|*:*:*|*..*) invalid ;; esac
  case "$value" in
    *:*) port="${value##*:}"; case "$port" in *[!0-9]*|'') invalid ;; esac
         [ "$port" -ge 1 ] && [ "$port" -le 65535 ] || invalid ;;
  esac
done
case "$FLEETIQ_API_UPSTREAM" in *:*) ;; *) invalid ;; esac
# Explicit HTTPS origin is a deployment contract: only the TLS gateway may expose
# this private HTTP listener. Never trust client-supplied forwarded scheme/host.
exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
