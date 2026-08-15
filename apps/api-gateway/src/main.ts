import Fastify from 'fastify';
import cors from '@fastify/cors';
import { fastifyConnectPlugin } from '@connectrpc/connect-fastify';
import fleetStreamingRoutes from './routes/fleet-streaming';
import { FAILURES } from './config/failures';

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

  // Register ConnectRPC routes
  await server.register(fastifyConnectPlugin, {
    routes: fleetStreamingRoutes,
  });

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
