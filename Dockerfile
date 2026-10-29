# syntax=docker/dockerfile:1.28.0@sha256:bb22d9815c728170f72750f4e5b0d672e06176142e1d602c7e66c050100b7e5b
FROM node:24.18.0-bookworm-slim@sha256:6f7b03f7c2c8e2e784dcf9295400527b9b1270fd37b7e9a7285cf83b6951452d AS builder
ARG BUILDKIT_SBOM_SCAN_STAGE=true
WORKDIR /workspace
RUN npm install --global pnpm@12.5.1 --ignore-scripts
COPY . .
RUN pnpm install --frozen-lockfile && pnpm build
RUN node tools/images/inline-csp.mjs apps/web/dist/index.html /tmp/csp.conf
# Keep graph evidence outside the public document root.
RUN cp apps/web/dist/quality-manifest.json /tmp/quality-manifest.json && rm apps/web/dist/quality-manifest.json
FROM nginx:1.30.6-alpine-slim@sha256:8f06fd647c6687eae0fd7bee8a43df66e61edb9f093bb0a9079d69cb355b879b AS runtime
ARG SOURCE_REVISION
LABEL org.opencontainers.image.title="FleetIQ UI" org.opencontainers.image.description="FleetIQ production static edge" org.opencontainers.image.source="https://github.com/stanimirivanov/fleetiq-ui" org.opencontainers.image.revision=$SOURCE_REVISION
# Use the official package-owned native binary; no Go/JOSE overlay or APK download.
RUN command -v nginx >/dev/null && command -v wget >/dev/null && mkdir -p /srv /usr/share/fleetiq /etc/fleetiq
COPY --from=builder /workspace/apps/web/dist/ /srv/
COPY --from=builder /tmp/quality-manifest.json /usr/share/fleetiq/quality-manifest.json
COPY --from=builder /tmp/csp.conf /usr/share/fleetiq/csp.conf
COPY packaging/nginx/ /etc/fleetiq/
COPY --chmod=0555 packaging/entrypoint.sh /usr/local/bin/fleetiq-edge
USER 10001:10001
EXPOSE 8080
STOPSIGNAL SIGQUIT
HEALTHCHECK --interval=5s --timeout=2s --start-period=5s --retries=3 CMD ["wget", "-q", "--spider", "http://127.0.0.1:8081/ready"]
ENTRYPOINT ["/usr/local/bin/fleetiq-edge"]
