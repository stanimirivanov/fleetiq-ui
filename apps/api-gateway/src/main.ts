import Fastify from 'fastify';
import cors from '@fastify/cors';
import { fastifyConnectPlugin } from '@connectrpc/connect-fastify';
import { ConnectError, Code } from '@connectrpc/connect';
import { FleetStreaming, VehicleStatus } from '@fleetiq-ui/shared-core';

// ── Failure Simulation Config ───────────────────────────────────────────────
// Set env vars to tune or disable specific failure modes.
//   FAILURE_INITIAL_COUNT=3   → First 3 stream attempts are rejected
//   FAILURE_DROP_PROB=0.3     → 30% chance stream dies after N messages
//   FAILURE_HANG_PROB=0.1     → 10% chance stream hangs forever (zombie TCP)
//   FAILURE_ERROR_PROB=0.05   → 5% chance immediate gRPC error (no stream)
//   FAILURE_DELAY_PROB=0.2    → 20% chance of artificial lag between messages
//   FAILURE_DELAY_MAX_MS=5000 → Max artificial delay in ms
const FAILURES = {
  INITIAL_COUNT: parseInt(process.env.FAILURE_INITIAL_COUNT || '2', 10),
  DROP_PROB: parseFloat(process.env.FAILURE_DROP_PROB || '0.3'),
  HANG_PROB: parseFloat(process.env.FAILURE_HANG_PROB || '0.1'),
  ERROR_PROB: parseFloat(process.env.FAILURE_ERROR_PROB || '0.05'),
  DELAY_PROB: parseFloat(process.env.FAILURE_DELAY_PROB || '0.2'),
  DELAY_MAX_MS: parseInt(process.env.FAILURE_DELAY_MAX_MS || '3000', 10),
};

// Global counter to simulate "server restart" cold-start failures
let streamAttemptCounter = 0;

// Helper: pick a random gRPC error code to simulate
function randomGrpcError(): { code: Code; message: string } {
  const pool = [
    { code: Code.Internal, message: 'Simulated internal server panic' },
    { code: Code.Unavailable, message: 'Simulated node restart / load-shed' },
    { code: Code.ResourceExhausted, message: 'Simulated rate limit (429)' },
    { code: Code.Unauthenticated, message: 'Simulated auth token expired' },
    { code: Code.PermissionDenied, message: 'Simulated ACL rejection' },
  ];
  return pool[Math.floor(Math.random() * pool.length)];
}

// Helper: generate a vehicle update (same logic for both endpoints)
function makeVehicleUpdate(vin: string) {
  return {
    vin,
    timestamp: { epochMillis: BigInt(Date.now()) },
    position: {
      latitude: 43.214 + (Math.random() - 0.5) * 0.005,
      longitude: 27.915 + (Math.random() - 0.5) * 0.005,
      altitude: 35.5,
    },
    speedKmh: 45 + Math.random() * 20,
    status: VehicleStatus.MOVING,
  };
}

async function bootstrap() {
  const server = Fastify({ logger: true });

  await server.register(cors, {
    origin: 'http://localhost:4200',
    methods: ['POST', 'GET', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Connect-Protocol-Version',
      'Connect-Timeout-Ms',
      'Grpc-Timeout',
      'X-User-Agent',
    ],
    exposedHeaders: ['Connect-Content-Encoding'],
  });

  await server.register(fastifyConnectPlugin, {
    routes: (router) => {
      router.service(FleetStreaming, {
        // ── WatchFleet (multi-vehicle server stream) ───────────────────────
        async *watchFleet(request, context) {
          streamAttemptCounter++;
          const attempt = streamAttemptCounter;

          // 1️⃣ INITIAL CONNECTION FAILURE (cold-start / rolling restart)
          //    Tests: client exponential backoff + retry
          if (attempt <= FAILURES.INITIAL_COUNT) {
            console.log(
              `\x1b[31m[FAILURE]\x1b[0m Rejecting stream attempt #${attempt} with UNAVAILABLE (simulating cold start)`
            );
            throw new ConnectError(
              'Server is warming up, retry expected',
              Code.Unavailable
            );
          }

          // 2️⃣ IMMEDIATE ERROR RESPONSE (no stream body)
          //    Tests: shouldRetry predicate + error state UI
          if (Math.random() < FAILURES.ERROR_PROB) {
            const err = randomGrpcError();
            console.log(
              `\x1b[31m[FAILURE]\x1b[0m Immediate ${Code[err.code]} on attempt #${attempt}`
            );
            throw new ConnectError(err.message, err.code);
          }

          // 3️⃣ SILENT HANG (zombie TCP connection)
          //    Tests: heartbeatTimeoutMs in the React hook
          if (Math.random() < FAILURES.HANG_PROB) {
            console.log(
              `\x1b[33m[FAILURE]\x1b[0m Stream #${attempt} will \x1b[33mHANG SILENTLY\x1b[0m forever (awaiting heartbeat timeout...)`
            );
            await new Promise(() => {}); // never resolves
            return;
          }

          // 4️⃣ RANDOM STREAM DROP after N messages
          //    Tests: auto-reconnect + state recovery
          const willDrop = Math.random() < FAILURES.DROP_PROB;
          const dropAfter = willDrop
            ? Math.floor(Math.random() * 8) + 3 // drop after 3-10 messages
            : Infinity;
          let msgCount = 0;

          console.log(
            `\x1b[32m[SUCCESS]\x1b[0m Stream #${attempt} accepted. ` +
              (willDrop
                ? `\x1b[31mWill DROP after ${dropAfter} messages\x1b[0m`
                : 'Stable (no planned drop)')
          );

          const intervalMs = (request.minUpdateIntervalSeconds || 2) * 1000;
          const vins =
            request.vins.length > 0
              ? request.vins
              : ['VIN-VARNA-01', 'VIN-SOFIA-02'];

          while (!context.signal.aborted) {
            for (const vin of vins) {
              if (context.signal.aborted) break;

              msgCount++;

              // 4️⃣ DROP: abrupt or graceful?
              if (msgCount >= dropAfter) {
                const abrupt = Math.random() > 0.5;
                console.log(
                  `\x1b[31m[FAILURE]\x1b[0m Dropping stream #${attempt} after ${msgCount} messages (` +
                    (abrupt ? 'abrupt error' : 'graceful EOF') +
                    ')'
                );
                if (abrupt) {
                  throw new ConnectError(
                    'Simulated network partition',
                    Code.Unavailable
                  );
                }
                return; // graceful end-of-stream
              }

              // 5️⃣ ARTIFICIAL DELAY / JITTER
              //    Tests: heartbeat tolerance + UI loading states
              if (Math.random() < FAILURES.DELAY_PROB) {
                const lag = Math.floor(Math.random() * FAILURES.DELAY_MAX_MS);
                console.log(
                  `\x1b[36m[DELAY]\x1b[0m Stream #${attempt}: adding ${lag}ms artificial latency`
                );
                await new Promise((r) => setTimeout(r, lag));
              }

              yield makeVehicleUpdate(vin);
            }

            await new Promise((r) => setTimeout(r, intervalMs));
          }

          console.log(
            `[INFO] Stream #${attempt} closed by client (abort signal)`
          );
        },

        // ── WatchVehicle (single-vehicle stream) ───────────────────────────
        async *watchVehicle(request, context) {
          // Re-use the same failure injection so both endpoints are hostile
          streamAttemptCounter++;
          const attempt = streamAttemptCounter;

          if (attempt <= FAILURES.INITIAL_COUNT) {
            throw new ConnectError('Server cold start', Code.Unavailable);
          }
          if (Math.random() < FAILURES.ERROR_PROB) {
            const err = randomGrpcError();
            throw new ConnectError(err.message, err.code);
          }
          if (Math.random() < FAILURES.HANG_PROB) {
            await new Promise(() => {});
            return;
          }

          const willDrop = Math.random() < FAILURES.DROP_PROB;
          const dropAfter = willDrop
            ? Math.floor(Math.random() * 8) + 3
            : Infinity;
          let msgCount = 0;
          const intervalMs = (request.minUpdateIntervalSeconds || 2) * 1000;

          while (!context.signal.aborted) {
            msgCount++;

            if (msgCount >= dropAfter) {
              if (Math.random() > 0.5) {
                throw new ConnectError(
                  'Vehicle stream reset',
                  Code.Unavailable
                );
              }
              return;
            }

            if (Math.random() < FAILURES.DELAY_PROB) {
              await new Promise((r) =>
                setTimeout(r, Math.floor(Math.random() * FAILURES.DELAY_MAX_MS))
              );
            }

            yield makeVehicleUpdate(request.vin || 'VIN-UNKNOWN-00');
            await new Promise((r) => setTimeout(r, intervalMs));
          }
        },
      });
    },
  });

  // Optional: health endpoint so you can verify the HTTP server is up
  // even when gRPC streams are being rejected
  server.get('/health', async () => ({
    status: 'ok',
    failureConfig: FAILURES,
  }));

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await server.listen({ port, host: '0.0.0.0' });
  console.log(
    `🚀 API Gateway Mock gRPC Server listening on http://localhost:${port}`
  );
  console.log(`🔥 Failure simulation active:`, FAILURES);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
