import Fastify from 'fastify';
import cors from '@fastify/cors';
import { fastifyConnectPlugin } from '@connectrpc/connect-fastify';
import { FleetStreaming } from '@fleetiq-ui/shared-core';
import { VehicleStatus } from '@fleetiq-ui/shared-core';

const server = Fastify({ logger: true });

// Required for browser clients connecting to gRPC-Web / Connect
await server.register(cors, {
  origin: true, 
});

await server.register(fastifyConnectPlugin, {
  routes: (router) => {
    router.service(FleetStreaming, {
      
      // Implement the WatchFleet Server Stream
      async *watchFleet(request, context) {
        const intervalMs = (request.minUpdateIntervalSeconds || 2) * 1000;
        const vins = request.vins.length > 0 ? request.vins : ['VIN-VARNA-01', 'VIN-SOFIA-02'];

        console.log(`Client subscribed to fleet stream: ${vins.join(', ')}`);

        // Loop runs until the browser closes the connection (signal.aborted)
        while (!context.signal.aborted) {
          for (const vin of vins) {
            
            // Yield pushes the protobuf message directly into the gRPC stream
            yield {
              vin,
              timestamp: { epochMillis: BigInt(Date.now()) },
              position: {
                // Jittering coordinates slightly around Varna to simulate movement
                latitude: 43.214 + (Math.random() - 0.5) * 0.005,
                longitude: 27.915 + (Math.random() - 0.5) * 0.005,
                altitude: 35.5,
              },
              speedKmh: 45 + Math.random() * 20,
              status: VehicleStatus.MOVING,
            };
          }
          
          // Wait for the requested interval before publishing the next tick
          await new Promise((resolve) => setTimeout(resolve, intervalMs));
        }
      },

      // Implement WatchVehicle (single vehicle stream)
      async *watchVehicle(request, context) {
        // Implementation follows the same pattern as above for request.vin
      }
    });
  },
});

server.listen({ port: 8080, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`🚀 API Gateway Mock gRPC Server listening at ${address}`);
});