/** Capture is limited to owned loopback servers and synthetic/mocked API responses. */
export function captureOrigin(baseURL) {
  let url;
  try {
    url = new URL(baseURL);
  } catch {
    throw new Error('Guide capture origin is invalid.');
  }
  if (
    url.protocol !== 'http:' ||
    !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== '/'
  ) {
    throw new Error('Guide capture requires an owned loopback HTTP origin.');
  }
  return url.origin;
}

/** Route failures are fixed categories; raw credential-bearing URLs are never diagnostic text. */
export function captureRequest(urlValue, origin) {
  let url;
  try {
    url = new URL(urlValue);
  } catch {
    return 'blocked';
  }
  if (
    url.origin !== origin ||
    url.username ||
    url.password ||
    [
      ...url.searchParams.keys(),
      ...new URLSearchParams(url.hash.slice(1)).keys(),
    ].some((key) =>
      /^(?:code|access_token|id_token|refresh_token|client_secret|assertion)$/iu.test(
        key,
      ),
    )
  )
    return 'blocked';
  return url.pathname.startsWith('/api/') ? 'mock-api' : 'local-asset';
}
