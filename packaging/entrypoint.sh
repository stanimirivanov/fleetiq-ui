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
# Render only these validated literal tokens, preserving NGINX's $variables.
# No shell eval/envsubst or browser rebuild receives runtime values.
umask 077
scratch="$(mktemp -d /tmp/fleetiq-edge.XXXXXXXXXX)" || invalid
public_host="${FLEETIQ_PUBLIC_AUTHORITY%%:*}"
for name in nginx.conf proxy.conf; do
  sed -e "s|@@SCRATCH@@|$scratch|g" \
      -e "s|@@PUBLIC_HOST@@|$public_host|g" \
      -e "s|@@PUBLIC_AUTHORITY@@|$FLEETIQ_PUBLIC_AUTHORITY|g" \
      -e "s|@@API_UPSTREAM@@|$FLEETIQ_API_UPSTREAM|g" \
      "/etc/fleetiq/$name.template" > "$scratch/$name" || invalid
done
if ! nginx -t -c "$scratch/nginx.conf" >/dev/null 2>&1; then
  printf '%s\n' 'NGINX configuration validation failed; inspect the source-owned template and scratch policy.' >&2
  exit 78
fi
exec nginx -c "$scratch/nginx.conf" -g 'daemon off;'
