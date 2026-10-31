import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const operations = {
  '/api/v1/me/tenants': ['get', 'listOperatorTenants'],
  '/api/v1': ['get', 'getApiVersion'],
  '/api/v1/tenants/{tenant_id}/assets': ['get', 'listAssets'],
  '/api/v1/tenants/{tenant_id}/assets/{asset_id}': ['get', 'getAsset'],
  '/api/v1/tenants/{tenant_id}/assets/{asset_id}/relationships': [
    'get',
    'listAssetRelationships',
  ],
  '/api/v1/tenants/{tenant_id}/assets/{asset_id}/signal-bindings': [
    'get',
    'listAssetSignalBindings',
  ],
  '/api/v1/tenants/{tenant_id}/signal-bindings': [
    'get',
    'listSourceSignalBindings',
  ],
  '/api/v1/tenants/{tenant_id}/asset-types/{type_id}/versions/{version}': [
    'get',
    'getAssetTypeDefinition',
  ],
  '/api/v1/tenants/{tenant_id}/properties/{property_id}/versions/{version}': [
    'get',
    'getPropertyDefinition',
  ],
  '/api/v1/tenants/{tenant_id}/relationship-types/{type_id}/versions/{version}':
    ['get', 'getRelationshipTypeDefinition'],
  '/api/v1/auth/login': ['get', 'beginOperatorLogin'],
  '/api/v1/auth/callback': ['get', 'completeOperatorLogin'],
  '/api/v1/auth/session': ['get', 'getOperatorSession'],
  '/api/v1/auth/logout': ['post', 'endOperatorSession'],
};
export const BROWSER_OPERATIONS = [
  {
    path: '/api/v1/tenants/{tenant_id}/alerts/{rule_id}/revisions/{revision}/acknowledgement',
    method: 'put',
    id: 'acknowledgeAlert',
  },
  {
    path: '/api/v1/tenants/{tenant_id}/alert-rules/{rule_id}',
    method: 'get',
    id: 'getAlertRuleHead',
  },
  {
    path: '/api/v1/tenants/{tenant_id}/alert-rules/{rule_id}/revisions/{revision}',
    method: 'get',
    id: 'getAlertRuleRevision',
  },
  {
    path: '/api/v1/tenants/{tenant_id}/alert-rules/{rule_id}/revisions/{revision}',
    method: 'put',
    id: 'createAlertRuleRevision',
  },
  {
    path: '/api/v1/tenants/{tenant_id}/alert-rules/{rule_id}/activation',
    method: 'put',
    id: 'changeAlertRuleActivation',
  },

  {
    path: '/api/v1/tenants/{tenant_id}/alerts',
    method: 'get',
    id: 'listAlerts',
  },
  {
    path: '/api/v1/tenants/{tenant_id}/alerts/{rule_id}/revisions/{revision}',
    method: 'get',
    id: 'getAlert',
  },
  {
    path: '/api/v1/tenants/{tenant_id}/alerts/{rule_id}/revisions/{revision}/transitions',
    method: 'get',
    id: 'listAlertTransitions',
  },
  {
    path: '/api/v1/tenants/{tenant_id}/assets/{asset_id}/calculator-evaluations/{evaluation_id}',
    method: 'get',
    id: 'getCalculatorEvaluationEvidence',
  },
  {
    path: '/api/v1/tenants/{tenant_id}/assets/{asset_id}/calculator-evaluations/{evaluation_id}/outputs',
    method: 'get',
    id: 'listCalculatorEvaluationOutputs',
  },
  {
    path: '/api/v1/tenants/{tenant_id}/signal-bindings/{binding_id}/revisions/{revision}',
    method: 'get',
    id: 'getSignalBindingRevision',
  },
  {
    path: '/api/v1/tenants/{tenant_id}/signal-bindings/{binding_id}/revisions/{revision}',
    method: 'post',
    id: 'appendSignalBindingRevision',
  },
  {
    path: '/api/v1/tenants/{tenant_id}/relationship-types',
    method: 'get',
    id: 'listRelationshipTypeDefinitions',
  },
  {
    path: '/api/v1/tenants/{tenant_id}/relationships/{relationship_id}/revisions/{revision}',
    method: 'post',
    id: 'appendRelationshipRevision',
  },
  {
    path: '/api/v1/tenants/{tenant_id}/fleet',
    method: 'get',
    id: 'getFleetSnapshot',
  },
  {
    path: '/api/v1/tenants/{tenant_id}/assets/{asset_id}/properties/{property_id}/versions/{version}/live',
    method: 'get',
    id: 'streamCurrentProperty',
  },
  {
    path: '/api/v1/tenants/{tenant_id}/assets/{asset_id}/properties/{property_id}/versions/{version}/current',
    method: 'get',
    id: 'getCurrentPropertySnapshot',
  },
  {
    path: '/api/v1/tenants/{tenant_id}/assets/{asset_id}/properties/{property_id}/versions/{version}/history',
    method: 'get',
    id: 'listPropertyHistory',
  },
  {
    path: '/api/v1/tenants/{tenant_id}/assets/{asset_id}/properties/{property_id}/versions/{version}/interpretations/{interpretation}',
    method: 'get',
    id: 'getPropertyInterpretation',
  },
  ...Object.entries(operations).map(([path, [method, id]]) => ({
    path,
    method,
    id,
  })),
  {
    path: '/api/v1/tenants/{tenant_id}/assets',
    method: 'post',
    id: 'registerAsset',
  },
  {
    path: '/api/v1/tenants/{tenant_id}/assets/{asset_id}/device',
    method: 'get',
    id: 'getCommunicationDevice',
  },
  {
    path: '/api/v1/tenants/{tenant_id}/assets/{asset_id}/device',
    method: 'post',
    id: 'registerCommunicationDevice',
  },
  {
    path: '/api/v1/tenants/{tenant_id}/asset-types',
    method: 'get',
    id: 'listAssetTypeDefinitions',
  },
  {
    path: '/api/v1/tenants/{tenant_id}/assets/{asset_id}/protocol-routes/{channel_id}',
    method: 'get',
    id: 'getDeviceProtocolRoute',
  },
  {
    path: '/api/v1/tenants/{tenant_id}/assets/{asset_id}/protocol-routes/{channel_id}',
    method: 'put',
    id: 'changeDeviceProtocolRoute',
  },
  {
    path: '/api/v1/tenants/{tenant_id}/protocol-packages/{package_id}/versions/{package_version}',
    method: 'get',
    id: 'getProtocolPackageRelease',
  },
  {
    path: '/api/v1/tenants/{tenant_id}/assets/{asset_id}/ingestion-diagnostics',
    method: 'get',
    id: 'getDeviceIngestionDiagnostics',
  },
];
function parseJson(bytes, message) {
  try {
    return JSON.parse(bytes.toString('utf8'));
  } catch {
    throw new Error(message);
  }
}

/** Validate local provenance, published operations and cookie declaration.
 * Hash consistency does not independently authenticate the upstream revision.
 */
export async function checkAssetContract({ contractPath, provenancePath }) {
  let bytes;
  let provenanceBytes;
  try {
    [bytes, provenanceBytes] = await Promise.all([
      readFile(contractPath),
      readFile(provenancePath),
    ]);
  } catch {
    throw new Error('Cannot read pinned OpenAPI contract or source provenance');
  }
  const provenance = parseJson(
    provenanceBytes,
    'OpenAPI source provenance is invalid JSON',
  );
  if (
    !provenance ||
    typeof provenance !== 'object' ||
    Array.isArray(provenance) ||
    provenance.repository !== 'fleetiq-platform' ||
    provenance.remote !==
      'https://github.com/stanimirivanov/fleetiq-platform' ||
    typeof provenance.commit !== 'string' ||
    !/^[0-9a-f]{40}$/u.test(provenance.commit ?? '') ||
    provenance.path !== 'contracts/http/dist/openapi.json' ||
    typeof provenance.sha256 !== 'string' ||
    !/^[0-9a-f]{64}$/u.test(provenance.sha256 ?? '')
  ) {
    throw new Error('OpenAPI source provenance is missing or invalid');
  }
  const digest = createHash('sha256').update(bytes).digest('hex');
  if (digest !== provenance.sha256) {
    throw new Error(
      'Pinned OpenAPI digest differs from contracts/http/source.json',
    );
  }
  const contract = parseJson(bytes, 'Pinned OpenAPI contract is invalid JSON');
  if (
    !contract ||
    typeof contract !== 'object' ||
    contract.openapi !== '3.1.1' ||
    contract.info?.version !== '1.0.0-baseline.26' ||
    contract.paths?.['/api/v1/tenants/{tenant_id}/assets']?.get?.operationId !==
      'listAssets' ||
    contract.components?.schemas?.AssetPage === undefined ||
    contract.components?.schemas?.OperatorSession === undefined ||
    contract.components?.schemas?.OperatorTenantPage === undefined ||
    contract.components?.schemas?.OperatorTenant === undefined ||
    contract.components?.schemas?.TenantAction === undefined ||
    !contract.components?.securitySchemes?.cookieAuth
  ) {
    throw new Error('Unexpected asset catalogue contract revision');
  }
  for (const { path: route, method, id: operationId } of BROWSER_OPERATIONS) {
    if (contract.paths?.[route]?.[method]?.operationId !== operationId) {
      throw new Error(`Missing or changed published operation ${operationId}`);
    }
  }
  const vocabulary = contract.components.schemas.TenantAction.enum;
  const grants = contract.components.schemas.OperatorTenant.properties?.actions;
  if (
    !Array.isArray(vocabulary) ||
    vocabulary.length === 0 ||
    new Set(vocabulary).size !== vocabulary.length ||
    grants?.minItems !== 1 ||
    grants?.maxItems !== vocabulary.length ||
    grants?.uniqueItems !== true
  )
    throw new Error(
      'Tenant discovery bound must match the complete unique action vocabulary',
    );
  const cookie = contract.components.securitySchemes.cookieAuth;
  if (
    cookie.type !== 'apiKey' ||
    cookie.in !== 'cookie' ||
    cookie.name !== '__Host-fleetiq-session'
  ) {
    throw new Error('Unexpected browser-session security declaration');
  }
  return {
    commit: provenance.commit,
    operations: BROWSER_OPERATIONS.length,
  };
}
