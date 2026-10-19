# syntax=docker/dockerfile:1.28.0@sha256:bb22d9815c728170f72750f4e5b0d672e06176142e1d602c7e66c050100b7e5b
FROM node:24.18.0-bookworm-slim@sha256:6f7b03f7c2c8e2e784dcf9295400527b9b1270fd37b7e9a7285cf83b6951452d AS builder
ARG BUILDKIT_SBOM_SCAN_STAGE=true
WORKDIR /workspace
RUN npm install --global pnpm@12.5.1 --ignore-scripts
COPY . .
RUN pnpm install --frozen-lockfile && pnpm build
RUN node tools/images/inline-csp.mjs apps/web/dist/index.html /tmp/csp.caddy
# Keep graph evidence outside the public document root.
RUN cp apps/web/dist/quality-manifest.json /tmp/quality-manifest.json && rm apps/web/dist/quality-manifest.json
FROM golang:1.26.9-alpine3.23@sha256:6750308561953d451210ed1a8086d36c8c8bdcbf672d38d9d0d424b8a7a0216c AS edge-builder

ARG BUILDKIT_SBOM_SCAN_STAGE=true
WORKDIR /edge
COPY packaging/caddy/go.mod packaging/caddy/go.sum ./
RUN GOTOOLCHAIN=local go mod download && GOTOOLCHAIN=local go mod verify
COPY packaging/caddy/main.go ./
RUN CGO_ENABLED=0 GOTOOLCHAIN=local go build -mod=readonly -trimpath -ldflags="-s -w" -o /edge/caddy ./main.go
FROM caddy:2.11.7-alpine@sha256:d8542f48d34a9cf4e4c11a478865229840e87e4c96ea3f439101f31a5d35f75f AS runtime
ARG SOURCE_REVISION
LABEL org.opencontainers.image.title="FleetIQ UX" org.opencontainers.image.description="FleetIQ production static edge" org.opencontainers.image.source="https://github.com/stanimirivanov/fleetiq-ux" org.opencontainers.image.revision=$SOURCE_REVISION
# No low ports or file capabilities are required behind the TLS gateway.
COPY --from=edge-builder /edge/caddy /usr/bin/caddy
RUN test -z "$(getcap /usr/bin/caddy)" && mkdir -p /srv /usr/share/fleetiq
COPY --from=builder /workspace/apps/web/dist/ /srv/
COPY --from=builder /tmp/quality-manifest.json /usr/share/fleetiq/quality-manifest.json
COPY --from=builder /tmp/csp.caddy /usr/share/fleetiq/csp.caddy
COPY packaging/Caddyfile /etc/caddy/Caddyfile
COPY --chmod=0555 packaging/entrypoint.sh /usr/local/bin/fleetiq-edge
ENV XDG_CONFIG_HOME=/tmp/config XDG_DATA_HOME=/tmp/data
USER 10001:10001
EXPOSE 8080
HEALTHCHECK --interval=5s --timeout=2s --start-period=5s --retries=3 CMD ["wget", "-q", "--spider", "http://127.0.0.1:8081/ready"]
ENTRYPOINT ["/usr/local/bin/fleetiq-edge"]
