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

void prepareMockApi()
  .then((assetLoader) => {
    const root = document.getElementById('root');
    if (!root) throw new Error('FleetIQ root element is missing');

    createRoot(root).render(
      <StrictMode>
        <BrowserRouter>
          <App assetLoader={assetLoader} />
        </BrowserRouter>
      </StrictMode>,
    );
  })
  .catch((error: unknown) => {
    console.error('FleetIQ preview failed to start', error);
    const root = document.getElementById('root');
    if (!root) return;
    const notice = document.createElement('p');
    notice.setAttribute('role', 'alert');
    notice.className = 'min-h-screen bg-canvas p-8 text-foreground';
    notice.textContent =
      'Development preview could not start. Check the browser console and restart the preview command.';
    root.replaceChildren(notice);
  });
