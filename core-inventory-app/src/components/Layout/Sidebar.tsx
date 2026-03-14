import { NavLink } from 'react-router-dom';
import {
  ArrowRightLeft,
  Boxes,
  ChevronRight,
  Home,
  LogOut,
  MapPinned,
  Package,
  ReceiptText,
  Truck,
  Warehouse,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

type NavItem = {
  name: string;
  to: string;
  icon: JSX.Element;
  hint?: string;
};

function NavSection({
  title,
  items,
  onNavigate,
}: {
  title: string;
  items: NavItem[];
  onNavigate?: () => void;
}) {
  return (
    <div className="space-y-1">
      <div className="px-3 pb-2 pt-4 text-[11px] font-extrabold uppercase tracking-[0.24em] text-slate-400">
        {title}
      </div>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className={({ isActive }) =>
            `group flex items-center justify-between gap-3 rounded-[22px] px-3 py-3 transition-all ${
              isActive
                ? 'bg-slate-950 text-white shadow-[0_18px_35px_rgba(17,32,39,0.16)]'
                : 'text-slate-600 hover:bg-white hover:text-slate-950'
            }`
          }
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/60 bg-white/75 text-slate-500 transition-colors group-hover:text-[var(--color-brand-green)] group-[.active]:bg-white/10 group-[.active]:text-white">
              {item.icon}
            </div>
            <div>
              <div className="text-sm font-bold">{item.name}</div>
              {item.hint && (
                <div className={`text-xs font-medium ${isActiveText(item.to)}`}>{item.hint}</div>
              )}
            </div>
          </div>
          <ChevronRight
            size={14}
            className="translate-x-0 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-slate-500"
          />
        </NavLink>
      ))}
    </div>
  );
}

function isActiveText(_: string) {
  return 'text-slate-400';
}

export default function Sidebar({
  className = '',
  showClose = false,
  onClose,
  onNavigate,
}: {
  className?: string;
  showClose?: boolean;
  onClose?: () => void;
  onNavigate?: () => void;
}) {
  const overviewLinks: NavItem[] = [
    { name: 'Dashboard', to: '/dashboard', icon: <Home size={18} />, hint: 'KPIs and stock pulse' },
    { name: 'Products', to: '/products', icon: <Package size={18} />, hint: 'Catalog, SKUs, reorder rules' },
  ];

  const operationLinks: NavItem[] = [
    { name: 'Receipts', to: '/receipts', icon: <ReceiptText size={18} />, hint: 'Incoming goods' },
    { name: 'Delivery Orders', to: '/deliveries', icon: <Truck size={18} />, hint: 'Pick, pack, validate' },
    { name: 'Internal Transfers', to: '/transfers', icon: <ArrowRightLeft size={18} />, hint: 'Warehouse and rack moves' },
    { name: 'Inventory Adjustment', to: '/adjustments', icon: <Boxes size={18} />, hint: 'Cycle counts and corrections' },
    { name: 'Move History', to: '/history', icon: <MapPinned size={18} />, hint: 'Stock ledger and audit trail' },
  ];

  const settingsLinks: NavItem[] = [
    { name: 'Warehouse', to: '/locations', icon: <Warehouse size={18} />, hint: 'Locations and storage layout' },
  ];

  return (
    <aside className={`w-full p-3 lg:w-[304px] lg:p-4 ${className}`}>
      <div className="sidebar-shell flex h-full flex-col">
        <div className="mb-4 flex items-start justify-between gap-3 rounded-[26px] border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <div className="flex items-start gap-3">
            <img src="/icon.svg" alt="CoreInventory" className="mt-0.5 h-11 w-11 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm" />
            <div>
              <div className="text-base font-extrabold tracking-tight text-slate-950">CoreInventory</div>
              <div className="mt-1 text-xs font-semibold text-slate-500">
                Operations dashboard
              </div>
            </div>
          </div>
          {showClose && (
            <button
              type="button"
              className="icon-btn"
              onClick={onClose}
              aria-label="Close menu"
            >
              <ChevronRight size={16} className="rotate-180" />
            </button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto pr-1">
          <NavSection title="Overview" items={overviewLinks} onNavigate={onNavigate} />
          <NavSection title="Operations" items={operationLinks} onNavigate={onNavigate} />
          <NavSection title="Settings" items={settingsLinks} onNavigate={onNavigate} />
        </nav>

        <div className="mt-4 rounded-[20px] border border-slate-200 bg-white p-3 shadow-sm">
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-[14px] px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
            onClick={async () => {
              await supabase.auth.signOut();
              onNavigate?.();
            }}
          >
            <span className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <LogOut size={16} />
              </div>
              Sign out
            </span>
            <ChevronRight size={14} className="text-slate-300" />
          </button>
        </div>
      </div>
    </aside>
  );
}
