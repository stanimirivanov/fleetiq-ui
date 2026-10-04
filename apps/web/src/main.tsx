import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from './app/App';
import type { AssetPageLoader } from './features/assets/api/previewCatalogue';
import './styles.css';

async function prepareMockApi(): Promise<AssetPageLoader | undefined> {
  if (!import.meta.env.DEV || import.meta.env.VITE_API_MODE !== 'mock')
    return undefined;
  const { network } = await import('virtual:msw');
  const { handlers } = await import('./mocks/handlers');
  network.configure({ handlers });
  await network.enable();
  const { createPreviewAssetPageLoader } = await import(
    './features/assets/api/previewCatalogue'
  );
  return createPreviewAssetPageLoader(window.location.origin);
}

void prepareMockApi().then((assetLoader) => {
  const root = document.getElementById('root');
  if (!root) throw new Error('FleetIQ root element is missing');

  createRoot(root).render(
    <StrictMode>
      <BrowserRouter>
        <App assetLoader={assetLoader} />
      </BrowserRouter>
    </StrictMode>,
  );
});
