import { Route, Router } from '@solidjs/router';
import { render } from 'solid-js/web';
import { AlertsPage } from '#features/alerts';
import {
  AssetInspectorPage,
  AssetRegistryPage,
  AssetsPage,
  FleetMapPage,
  FleetOverviewPage,
} from '#features/assets';
import { DevicesPage } from '#features/devices';
import {
  BrowserWorkspace,
  MetadataAccessBoundary,
} from './app/BrowserWorkspace';
import { DesignSystemPage } from './app/DesignSystemPage';
import { APP_ROUTES } from './app/route-metadata';
import { NotFoundPage } from './app/WorkspacePages';
import './styles.css';

const root = document.getElementById('root');
if (!root) {
  throw new Error('FleetIQ root element is missing');
}

render(
  () => (
    <Router root={BrowserWorkspace}>
      <Route
        path={APP_ROUTES.overview.path}
        component={() => (
          <MetadataAccessBoundary>
            <FleetOverviewPage />
          </MetadataAccessBoundary>
        )}
      />
      <Route
        path={APP_ROUTES.map.path}
        component={() => (
          <MetadataAccessBoundary>
            <FleetMapPage />
          </MetadataAccessBoundary>
        )}
      />
      <Route
        path={APP_ROUTES.assets.path}
        component={() => (
          <MetadataAccessBoundary>
            <AssetsPage />
          </MetadataAccessBoundary>
        )}
      />
      <Route
        path={APP_ROUTES.devices.path}
        component={() => (
          <MetadataAccessBoundary>
            <DevicesPage />
          </MetadataAccessBoundary>
        )}
      />
      <Route
        path={APP_ROUTES.alerts.path}
        component={() => (
          <MetadataAccessBoundary>
            <AlertsPage />
          </MetadataAccessBoundary>
        )}
      />
      <Route
        path={APP_ROUTES.registry.path}
        component={() => (
          <MetadataAccessBoundary>
            <AssetRegistryPage />
          </MetadataAccessBoundary>
        )}
      />
      <Route
        path={APP_ROUTES.assetInspector.path}
        component={() => (
          <MetadataAccessBoundary>
            <AssetInspectorPage />
          </MetadataAccessBoundary>
        )}
      />
      <Route path={APP_ROUTES.designSystem.path} component={DesignSystemPage} />
      <Route path="*" component={NotFoundPage} />
    </Router>
  ),
  root,
);
