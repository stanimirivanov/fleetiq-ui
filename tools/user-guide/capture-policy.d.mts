export function captureOrigin(baseURL: string): string;
export function captureRequest(
  url: string,
  origin: string,
): 'blocked' | 'mock-api' | 'local-asset';
