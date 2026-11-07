import type { Page } from '@playwright/test';
import { Schema } from 'effect';
import { ExportJob } from '../../web/src/generated/fleetiq-api';

export async function installExportApi(page: Page) {
  const bytes = Buffer.from('PAR1fixture-PAR1');
  const requests: {
    method: string;
    path: string;
    body: unknown;
    csrf?: string;
  }[] = [];
  let failFirst = true;
  let denied = false;
  let state: typeof ExportJob.Type.state = 'ready';
  await page.route('**/api/v1/tenants/tenant-a/exports/**', async (route) => {
    const request = route.request();
    const method = request.method();
    const path = new URL(request.url()).pathname;
    const csrf = request.headers()['x-fleetiq-csrf'];
    requests.push({
      method,
      path,
      body: request.postDataJSON(),
      ...(csrf ? { csrf } : {}),
    });
    if (denied || (method === 'PUT' && failFirst)) {
      failFirst = false;
      return route.fulfill({ status: denied ? 403 : 500, json: {} });
    }
    if (method === 'DELETE') state = 'cancelled';
    if (path.endsWith('/download')) {
      return route.fulfill({
        body: bytes,
        headers: {
          'content-type': 'application/vnd.apache.parquet',
          'content-disposition':
            'attachment; filename="fleetiq-export-7.parquet"',
          'content-length': String(bytes.length),
        },
      });
    }
    return route.fulfill({
      status: method === 'PUT' ? 202 : 200,
      json: Schema.decodeUnknownSync(ExportJob)({
        export_id: '7',
        state,
        selection_generation: '1',
        format: 'property-history-v1',
        format_version: 1,
        expires_at_ms: '3600000',
        row_count: 1,
        file_bytes: String(bytes.length),
        coverage: {
          scope: 'hot_snapshot',
          manifest_id: null,
          restore_generation: null,
        },
      }),
    });
  });
  return {
    bytes,
    requests,
    deny: () => {
      denied = true;
    },
  };
}
