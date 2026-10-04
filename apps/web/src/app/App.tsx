import { Navigate, Route, Routes, useParams } from 'react-router';
import type { AssetPageLoader } from '../features/assets/api/previewCatalogue';
import { AssetIdentityPage } from '../features/assets/ui/AssetIdentityPage';
import { AssetListPage } from '../features/assets/ui/AssetListPage';
import { OverviewPage } from '../features/overview/OverviewPage';
import { ThemeControl } from '../theme/ThemeControl';

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

/** App composition owns routing and the persistent appearance control. */
export function App({ assetLoader }: AppProps) {
  return (
    <>
      <ThemeControl />
      <Routes>
        <Route
          path="/"
          element={
            assetLoader ? (
              <Navigate to="/tenants/tenant-a/assets" replace />
            ) : (
              <OverviewPage />
            )
          }
        />
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
    </>
  );
}
