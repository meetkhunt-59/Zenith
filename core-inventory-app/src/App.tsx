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
const AppLayout = ({ userEmail }: { userEmail: string }) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-[#f4f7f9] overflow-hidden">
      {/* Desktop sidebar */}
      <Sidebar className="hidden lg:flex" />

      {/* Mobile sidebar overlay */}
      <div
        className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[1px] transition-opacity lg:hidden ${
          mobileNavOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileNavOpen(false)}
        aria-hidden={!mobileNavOpen}
      />
      <div
        className={`fixed inset-y-0 left-0 z-50 lg:hidden transform transition-transform duration-200 ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-hidden={!mobileNavOpen}
      >
        <Sidebar
          showClose
          onClose={() => setMobileNavOpen(false)}
          onNavigate={() => setMobileNavOpen(false)}
          className="shadow-2xl"
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="p-4 sm:p-8 lg:p-20 pb-24 sm:pb-32">
          <div className="max-w-[1600px] mx-auto">
            <Topbar userEmail={userEmail} onMenuClick={() => setMobileNavOpen(true)} />
            {/* The routed content goes here */}
            <Outlet />
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
      <div className="min-h-screen flex items-center justify-center bg-[#f4f7f9]">
        <div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
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
        <Route path="/" element={<AppLayout userEmail={session.user.email ?? ''} />}>
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
            <div className="premium-card"><h2 className="header-title">Settings Coming Soon</h2></div>
          } />
          
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
