/** Tiles, styles, sprites and glyphs are deployment-owned without embedded credentials. */
export function ownedMapResource(input: string, origin: string): string {
  const url = new URL(input, origin);
  if (
    url.origin !== origin ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !url.pathname.startsWith('/maps/') ||
    /[\\]|%2f|%5c|%2e|%25/i.test(input) ||
    /\p{Cc}/u.test(input) ||
    input.includes('..')
  )
    throw new Error('Unowned map resource');
  return url.href;
}

/** Permit only static raster/vector styles before handing untrusted JSON to the SDK.
 * Video/image/remote GeoJSON sources, imports and terrain can introduce other transports.
 */
export function validateMapStyle(
  input: unknown,
  origin: string,
): Record<string, unknown> {
  const object = (v: unknown): v is Record<string, unknown> =>
    v !== null && typeof v === 'object' && !Array.isArray(v);
  if (
    !object(input) ||
    input.version !== 8 ||
    !object(input.sources) ||
    !Array.isArray(input.layers) ||
    input.layers.length > 500 ||
    input.imports !== undefined ||
    input.terrain !== undefined
  )
    throw new Error('Unsupported map style');
  for (const key of ['glyphs', 'sprite'])
    if (input[key] !== undefined) {
      if (typeof input[key] !== 'string')
        throw new Error('Unsupported map resource');
      ownedMapResource(input[key], origin);
    }
  for (const source of Object.values(input.sources)) {
    if (
      !object(source) ||
      !['raster', 'vector'].includes(String(source.type)) ||
      source.data !== undefined ||
      source.urls !== undefined
    )
      throw new Error('Unsupported map source');
    if (
      typeof source.attribution === 'string' &&
      /[<>]/.test(source.attribution)
    )
      throw new Error('Map attribution must be plain text');
    if (
      source.url !== undefined ||
      !Array.isArray(source.tiles) ||
      !source.tiles.length ||
      source.tiles.length > 16
    )
      throw new Error('Use explicit bounded static tile templates');
    if (source.tiles !== undefined) {
      if (!Array.isArray(source.tiles) || source.tiles.length > 16)
        throw new Error('Invalid map tiles');
      for (const tile of source.tiles) {
        if (typeof tile !== 'string') throw new Error('Invalid map tile');
        ownedMapResource(tile, origin);
      }
    }
  }
  return input;
}
