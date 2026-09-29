import { lazy, Suspense } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LoadingSkeleton } from './components/common/LoadingSkeleton';
import AppShell from './components/layout/AppShell';
import { BillShieldProvider } from './context/BillShieldContext';
import { useBillShield } from './hooks/useBillShield';
import WelcomePage from './pages/WelcomePage';

/** Chart-heavy pages are split out so the first paint stays small. */
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const UpcomingPage = lazy(() => import('./pages/UpcomingPage'));
const MandatesPage = lazy(() => import('./pages/MandatesPage'));
const CashFlowPage = lazy(() => import('./pages/CashFlowPage'));
const InsightsPage = lazy(() => import('./pages/InsightsPage'));
const DemoModePage = lazy(() => import('./pages/DemoModePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

/** Blocks the dashboard until the demo consent checkbox is ticked. */
function RequireOnboarding() {
  const { state } = useBillShield();
  if (!state.onboardingComplete) {
    return <Navigate to="/welcome" replace />;
  }
  return <AppShell />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <BillShieldProvider>
          <Suspense fallback={<div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6"><LoadingSkeleton /></div>}>
            <Routes>
              <Route path="/welcome" element={<WelcomePage />} />
              <Route element={<RequireOnboarding />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/upcoming" element={<UpcomingPage />} />
                <Route path="/mandates" element={<MandatesPage />} />
                <Route path="/cash-flow" element={<CashFlowPage />} />
                <Route path="/insights" element={<InsightsPage />} />
                <Route path="/demo" element={<DemoModePage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BillShieldProvider>
      </HashRouter>
    </ErrorBoundary>
  );
}
