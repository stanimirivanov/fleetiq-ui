# Asset catalogue boundary

## TL;DR

Web and mobile use one page-loader shape and one tenant-scoped parser. The HTTP loader is reusable with injected authorization and fetch runtime; neither a browser token nor a native credential lives in this package.

The web development preview supplies a synthetic bearer value to the HTTP loader and receives MSW responses. The native development preview supplies the shared contract fixture directly because there is no native MSW server. Both return the same validated AssetPage shape. Production identity and token storage remain app-specific composition choices, and the backend remains authoritative for authorization.
