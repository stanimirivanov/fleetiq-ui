import type { components } from './generated';

/** Synthetic examples pinned to the backend OpenAPI baseline. Never use as live data. */
export const contractFixtures: {
  discovery: components['schemas']['ApiDescription'];
  assetPage: components['schemas']['AssetPage'];
  invalidRequest: components['schemas']['Problem'];
  unauthenticated: components['schemas']['Problem'];
  forbidden: components['schemas']['Problem'];
  internalError: components['schemas']['Problem'];
} = {
  discovery: { service: 'FleetIQ', version: 'v1' },
  assetPage: {
    assets: [
      {
        id: 'asset-1',
        tenant_id: 'tenant-a',
        name: 'Primary machine',
        asset_type: { id: 'generic.machine', version: 1 },
      },
    ],
    next_after: null,
  },
  invalidRequest: {
    type: 'urn:fleetiq:problem:invalid-request',
    title: 'Invalid request',
    status: 400,
  },
  unauthenticated: {
    type: 'urn:fleetiq:problem:unauthorized',
    title: 'Authentication required',
    status: 401,
  },
  forbidden: {
    type: 'urn:fleetiq:problem:forbidden',
    title: 'Access denied',
    status: 403,
  },
  internalError: {
    type: 'urn:fleetiq:problem:internal-error',
    title: 'Internal server error',
    status: 500,
  },
};
