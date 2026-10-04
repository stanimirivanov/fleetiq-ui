import { Navigate, Route, Routes } from 'react-router';
import { OverviewPage } from '../features/overview/OverviewPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<OverviewPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
