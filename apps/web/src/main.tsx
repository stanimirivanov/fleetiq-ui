import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from './app/App';
import './styles.css';

async function prepareMockApi(): Promise<void> {
  if (!import.meta.env.DEV || import.meta.env.VITE_API_MODE !== 'mock') return;
  const { network } = await import('virtual:msw');
  const { handlers } = await import('./mocks/handlers');
  network.configure({ handlers });
  await network.enable();
}

void prepareMockApi().then(() => {
  const root = document.getElementById('root');
  if (!root) throw new Error('FleetIQ root element is missing');

  createRoot(root).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  );
});
