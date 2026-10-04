import { Navigate, Route, Routes, useParams } from 'react-router';
import type { AssetPageLoader } from '../features/assets/api/previewCatalogue';
import { AssetIdentityPage } from '../features/assets/ui/AssetIdentityPage';
import { AssetListPage } from '../features/assets/ui/AssetListPage';
import { OverviewPage } from '../features/overview/OverviewPage';
import { AppShell } from './AppShell';

type AppProps = { assetLoader?: AssetPageLoader };

function CatalogueRoute({ assetLoader }: AppProps) {
  const { tenantId } = useParams();
  if (!tenantId) return <Navigate to="/" replace />;
  return (
    <AssetListPage key={tenantId} tenantId={tenantId} loadPage={assetLoader} />
  );
}

function IdentityRoute() {
  const { tenantId, assetId } = useParams();
  if (!tenantId || !assetId) return <Navigate to="/" replace />;
  return <AssetIdentityPage tenantId={tenantId} assetId={assetId} />;
}

/** App composition keeps product chrome mounted across route changes. */
export function App({ assetLoader }: AppProps) {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<OverviewPage />} />
        <Route
          path="/tenants/:tenantId/assets"
          element={<CatalogueRoute assetLoader={assetLoader} />}
        />
        <Route
          path="/tenants/:tenantId/assets/:assetId"
          element={<IdentityRoute />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
