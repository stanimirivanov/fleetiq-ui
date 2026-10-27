/** Safe presentation categories; no provider, payload, or credential details. */
export type RequestFailureKind =
  | 'unauthorized'
  | 'forbidden'
  | 'not-found'
  | 'invalid-request'
  | 'invalid-response'
  | 'unavailable'
  | 'conflict';

const messages: Record<RequestFailureKind, string> = {
  unauthorized: 'Sign-in is required',
  forbidden: 'Access is denied',
  'not-found': 'The requested record was not found',
  'invalid-request': 'The request is invalid',
  'invalid-response': 'The server response is invalid',
  unavailable: 'The service is unavailable',
  conflict: 'The command conflicts with current state',
};

/** Retains only a trusted category, never an upstream exception or response. */
export class RequestFailure extends Error {
  override readonly name = 'RequestFailure';
  constructor(readonly kind: RequestFailureKind) {
    super(messages[kind]);
  }
}
