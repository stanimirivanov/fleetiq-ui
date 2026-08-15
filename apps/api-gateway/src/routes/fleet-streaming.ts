import { ConnectError, Code, ConnectRouter } from '@connectrpc/connect';
import { FleetStreaming } from '@fleetiq-ui/shared-core';
import { FAILURES, FailureState, randomGrpcError } from '../config/failures';
import { globalSimulator } from '../simulation/fleet-simulator';

export default function fleetStreamingRoutes(router: ConnectRouter) {
  router.service(FleetStreaming, {
    // ── WatchFleet (multi-vehicle server stream) ───────────────────────
    async *watchFleet(request, context) {
      FailureState.streamAttemptCounter++;
      const attempt = FailureState.streamAttemptCounter;

      // 1. Initial Connection Failures
      if (attempt <= FAILURES.INITIAL_COUNT) {
        console.log(
          `\x1b[31m[FAILURE]\x1b[0m Rejecting stream attempt #${attempt} with UNAVAILABLE`
        );
        throw new ConnectError(
          'Server is warming up, retry expected',
          Code.Unavailable
        );
      }

      // 2. Immediate Error Response
      if (Math.random() < FAILURES.ERROR_PROB) {
        const err = randomGrpcError();
        console.log(
          `\x1b[31m[FAILURE]\x1b[0m Immediate ${Code[err.code]} on attempt #${attempt}`
        );
        throw new ConnectError(err.message, err.code);
      }

      // 3. Silent Hang
      if (Math.random() < FAILURES.HANG_PROB) {
        console.log(
          `\x1b[33m[FAILURE]\x1b[0m Stream #${attempt} will \x1b[33mHANG SILENTLY\x1b[0m`
        );
        await new Promise(() => {}); // never resolves
        return;
      }

      // 4. Random Stream Drop Setup
      const willDrop = Math.random() < FAILURES.DROP_PROB;
      const dropAfter = willDrop ? Math.floor(Math.random() * 8) + 3 : Infinity;
      let msgCount = 0;

      console.log(
        `\x1b[32m[SUCCESS]\x1b[0m Stream #${attempt} accepted. ` +
          (willDrop
            ? `\x1b[31mWill DROP after ${dropAfter} pushes\x1b[0m`
            : 'Stable')
      );

      const intervalMs = (request.minUpdateIntervalSeconds || 2) * 1000;

      while (!context.signal.aborted) {
        msgCount++;

        // Drop logic
        if (msgCount >= dropAfter) {
          const abrupt = Math.random() > 0.5;
          console.log(
            `\x1b[31m[FAILURE]\x1b[0m Dropping stream #${attempt} (${abrupt ? 'abrupt' : 'graceful'})`
          );
          if (abrupt)
            throw new ConnectError(
              'Simulated network partition',
              Code.Unavailable
            );
          return;
        }

        // Artificial Delay
        if (Math.random() < FAILURES.DELAY_PROB) {
          const lag = Math.floor(Math.random() * FAILURES.DELAY_MAX_MS);
          console.log(
            `\x1b[36m[DELAY]\x1b[0m Stream #${attempt}: ${lag}ms latency added`
          );
          await new Promise((r) => setTimeout(r, lag));
        }

        // Fetch dynamic fleet state
        const currentFleet = globalSimulator.getActiveFleet();

        // Yield each vehicle sequentially in this tick
        for (const vehicle of currentFleet) {
          if (context.signal.aborted) break;
          yield vehicle;
        }

        await new Promise((r) => setTimeout(r, intervalMs));
      }

      console.log(`[INFO] Stream #${attempt} closed by client (abort signal)`);
    },

    // ── WatchVehicle (single-vehicle stream) ───────────────────────────
    async *watchVehicle(request, context) {
      // (Omitted failure injection boilerplate for brevity - same as above)
      const intervalMs = (request.minUpdateIntervalSeconds || 2) * 1000;
      const targetVin = request.vin || 'VIN-VARNA-001';

      while (!context.signal.aborted) {
        const vehicle = globalSimulator.getVehicle(targetVin);
        if (vehicle) {
          yield vehicle;
        }
        await new Promise((r) => setTimeout(r, intervalMs));
      }
    },
  });
}
