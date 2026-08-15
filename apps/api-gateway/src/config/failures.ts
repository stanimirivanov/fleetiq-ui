import { Code } from '@connectrpc/connect';

export const FAILURES = {
  INITIAL_COUNT: parseInt(process.env.FAILURE_INITIAL_COUNT || '2', 10),
  DROP_PROB: parseFloat(process.env.FAILURE_DROP_PROB || '0.3'),
  HANG_PROB: parseFloat(process.env.FAILURE_HANG_PROB || '0.1'),
  ERROR_PROB: parseFloat(process.env.FAILURE_ERROR_PROB || '0.05'),
  DELAY_PROB: parseFloat(process.env.FAILURE_DELAY_PROB || '0.2'),
  DELAY_MAX_MS: parseInt(process.env.FAILURE_DELAY_MAX_MS || '3000', 10),
};

export class FailureState {
  public static streamAttemptCounter = 0;
}

export function randomGrpcError(): { code: Code; message: string } {
  const pool = [
    { code: Code.Internal, message: 'Simulated internal server panic' },
    { code: Code.Unavailable, message: 'Simulated node restart / load-shed' },
    { code: Code.ResourceExhausted, message: 'Simulated rate limit (429)' },
    { code: Code.Unauthenticated, message: 'Simulated auth token expired' },
    { code: Code.PermissionDenied, message: 'Simulated ACL rejection' },
  ];
  return pool[Math.floor(Math.random() * pool.length)];
}
