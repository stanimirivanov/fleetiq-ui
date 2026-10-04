import { contractFixtures, parseAssetPage } from '@fleetiq/api-contract';
import { HttpResponse, http } from 'msw/http';

const noStore = { 'Cache-Control': 'no-store' };

function problem(body: typeof contractFixtures.invalidRequest, status: number) {
  return HttpResponse.json(body, {
    status,
    headers: { ...noStore, 'Content-Type': 'application/problem+json' },
  });
}

/** Deterministic development handlers for the pinned partial v1 contract. */
export const handlers = [
  http.get('*/api/v1', () => HttpResponse.json(contractFixtures.discovery)),
  http.get('*/api/v1/tenants/:tenantId/assets', ({ params, request }) => {
    if (!request.headers.get('authorization')?.startsWith('Bearer ')) {
      return problem(contractFixtures.unauthenticated, 401);
    }
    if (params.tenantId !== 'tenant-a') {
      return problem(contractFixtures.forbidden, 403);
    }

    const url = new URL(request.url);
    const rawLimit = url.searchParams.get('limit');
    const limit = rawLimit === null ? 50 : Number(rawLimit);
    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100 ||
      (rawLimit !== null && !/^[0-9]+$/.test(rawLimit))
    ) {
      return problem(contractFixtures.invalidRequest, 400);
    }

    const after = url.searchParams.get('after');
    if (after === '') {
      return problem(contractFixtures.invalidRequest, 400);
    }
    const body = parseAssetPage({
      assets:
        after === null ? contractFixtures.assetPage.assets.slice(0, limit) : [],
      next_after: null,
    });
    return HttpResponse.json(body, { headers: noStore });
  }),
];
