import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';
import type { Session } from '@supabase/supabase-js';

// Components
import Auth from './components/Auth';
import Sidebar from './components/Layout/Sidebar';
import Topbar from './components/Layout/Topbar';

// Pages
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Receipts from './pages/Operations/Receipts';
import Deliveries from './pages/Operations/Deliveries';
import Transfers from './pages/Operations/Transfers';
import History from './pages/Operations/History';
import Locations from './pages/Locations';
import Adjustments from './pages/Operations/Adjustments';


// --- Router Layout Wrapper ---
const AppLayout = () => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen p-3 sm:p-5 lg:p-6">
      <div className="app-panel flex min-h-[calc(100vh-24px)] h-[calc(100vh-24px)] overflow-hidden sm:min-h-[calc(100vh-40px)] sm:h-[calc(100vh-40px)] lg:min-h-[calc(100vh-48px)] lg:h-[calc(100vh-48px)]">
        {/* Desktop sidebar */}
        <Sidebar className="hidden shrink-0 lg:flex h-full sticky top-0" />

        {/* Mobile sidebar overlay */}
        <div
          className={`fixed inset-0 z-40 bg-slate-950/25 backdrop-blur-[3px] transition-opacity lg:hidden ${
            mobileNavOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
          }`}
          onClick={() => setMobileNavOpen(false)}
          aria-hidden={!mobileNavOpen}
        />
        <div
          className={`fixed inset-y-0 left-0 z-50 w-[88vw] max-w-[320px] transform transition-transform duration-200 lg:hidden ${
            mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          aria-hidden={!mobileNavOpen}
        >
          <Sidebar
            showClose
            onClose={() => setMobileNavOpen(false)}
            onNavigate={() => setMobileNavOpen(false)}
            className="h-full"
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col h-full overflow-hidden">
          <div className="flex-1 overflow-y-auto px-3 pb-6 pt-3 sm:px-5 sm:pb-8 sm:pt-5 lg:px-6 lg:pb-10 lg:pt-6">
            <div className="mx-auto flex max-w-[1600px] flex-col gap-6">
              <Topbar onMenuClick={() => setMobileNavOpen(true)} />
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main App Entry ---
export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="surface-card flex items-center gap-4 !px-6 !py-5">
          <div className="h-8 w-8 rounded-full border-4 border-[var(--color-brand-green)] border-t-transparent animate-spin"></div>
          <div>
            <div className="section-label">Zenith</div>
            <div className="text-sm font-bold text-slate-900">Loading your workspace</div>
          </div>
        </div>
      </div>
    );
  }

  // --- Auth Wall ---
  if (!session) {
    return <Auth />;
  }

  // --- Routing ---
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="receipts" element={<Receipts />} />
          <Route path="deliveries" element={<Deliveries />} />
          <Route path="transfers" element={<Transfers />} />
          <Route path="adjustments" element={<Adjustments />} />
          <Route path="history" element={<History />} />
          <Route path="locations" element={<Locations />} />
          <Route path="settings" element={
            <div className="surface-card">
              <div className="section-label">Settings</div>
              <h2 className="header-title mt-2">More controls are on the way</h2>
              <p className="section-copy">Warehouse settings are already available from the sidebar. Additional preferences can live here later without affecting the current backend flows.</p>
            </div>
          } />
          
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
