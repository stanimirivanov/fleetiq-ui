# Self-hosted map resources

## TL;DR

Provide reviewed static MapLibre styles and their raster/vector resources beneath
`/srv/maps`. Missing configuration leaves the geographic background untextured;
FleetIQ still shows authorized coordinate evidence and the asset list. No external
basemap or sample positions are substituted.

## Required layout

```text
/srv/maps/
  light/style.json
  dark/style.json
  tiles/...
  glyphs/...       # only when required by the style
  sprites/...      # only when required by the style
```

1. Obtain a licensed, reviewed self-hosted raster/vector basemap export. Do not
   place tracker data, credentials or provider tokens in the resource tree.
2. Write MapLibre version-8 style JSON for both themes. Use absolute origin-relative
   paths such as `/maps/tiles/{z}/{x}/{y}.png` with tile templates inline in the style.
   Rewrite style glyph/sprite URLs into the same `/maps/` tree. TileJSON indirection
   is rejected; export its reviewed tile templates and plain-text attribution into
   the style. Root URLs, queries, fragments, encoded traversal and external origins are
   rejected. Each style is at most 1 MiB and 500 layers; each source has at most
   sixteen tile templates. Attribution is plain text; preserve all license terms.
3. Provide only `raster`/`vector` sources. Do not use video/image/remote GeoJSON,
   terrain or imported styles. FleetIQ adds its protected in-memory point source
   independently after style loading. Direct PMTiles protocol is not configured.
4. Mount the reviewed directory read-only at `/srv/maps` in the static-edge
   container, for example a Docker bind mount with `target=/srv/maps,readonly`.
   For Vite development, serve the same reviewed tree under `apps/web/public/maps`
   in an uncommitted local copy; do not commit datasets or generated tiles.
5. Verify `/maps/light/style.json` and `/maps/dark/style.json` return JSON with
   appropriate content type, a missing `/maps/absent.json` returns 404, and POST
   to a map path returns 405. Missing map files must never return `index.html`.
6. Sign in to `/map`, select a permitted tenant and explicitly enter the installed
   coordinate property IDs, versions and encoding. `degrees` requires canonical
   unit `deg`; `e7` requires unitless integer values. No property names are guessed.
7. Apply the mapping. Verify loaded assets, observed coordinates/provenance and
   missing-position labels. Change theme and verify the corresponding local style
   is requested. Filters apply only to the loaded page; whole-tenant counts remain
   server-owned and overlap in category membership.

## Security and operational limits

Map files are public static deployment configuration. Cookie-authenticated
metadata and telemetry are fetched only through authorized API operations;
permissions and payload validity are independent of map availability. The map
style request omits cookies; SDK resource requests use same-origin credentials.
No browser authorization token is attached. Keep private resources outside this
public tree. Resource requests are constrained by the adapter and self-origin CSP.

Renderer/style failures show a notice and retain accessible list parity. Snapshot
freshness is evaluated at server response time, not a live connectivity claim.
Use Refresh snapshot for another consistent view. No live pair stream is inferred
from independent property streams. This guide does not qualify D06 or a provider.

See the [map decision](../design-docs/0008-connected-geodetic-map.md) for lifecycle,
footprint budgets and browser qualification limits.
