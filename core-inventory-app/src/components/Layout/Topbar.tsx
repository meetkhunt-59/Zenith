import { CalendarDays, Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface TopbarProps {
  onMenuClick?: () => void;
}

const ROUTE_META: Record<string, { title: string; description: string }> = {
  '/dashboard': {
    title: 'Inventory Dashboard',
    description: 'Wide operational visibility for stock, receipts, deliveries, and transfers.',
  },
  '/products': {
    title: 'Product Management',
    description: 'Manage catalog structure, stock availability, categories, and reorder rules.',
  },
  '/receipts': {
    title: 'Receipts',
    description: 'Track incoming goods, validate quantities, and increase stock automatically.',
  },
  '/deliveries': {
    title: 'Delivery Orders',
    description: 'Guide pick-pack-validate workflows for outgoing stock movements.',
  },
  '/transfers': {
    title: 'Internal Transfers',
    description: 'Move inventory between warehouses, racks, and production locations.',
  },
  '/adjustments': {
    title: 'Inventory Adjustment',
    description: 'Reconcile physical counts and keep the stock ledger accurate.',
  },
  '/history': {
    title: 'Move History',
    description: 'Audit every inventory movement with smart filters and live status context.',
  },
  '/locations': {
    title: 'Warehouse Settings',
    description: 'Manage warehouses, racks, and virtual endpoints from one settings surface.',
  },
};

export default function Topbar({ onMenuClick }: TopbarProps) {
  const location = useLocation();
  const meta = ROUTE_META[location.pathname] ?? ROUTE_META['/dashboard'];
  const today = new Date().toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <header className="topbar-shell flex flex-col gap-3 text-left lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-start gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onMenuClick}
          className="icon-btn lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <div className="min-w-0">
          <div className="section-label">CoreInventory workspace</div>
          <div className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950">
            {meta.title}
          </div>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500">
            {meta.description}
          </p>
        </div>
      </div>

      <div className="metric-inline flex items-center gap-3 self-start sm:self-auto">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
          <CalendarDays size={18} />
        </div>
        <div>
          <div className="text-sm font-bold text-slate-900">{today}</div>
          <div className="text-xs font-semibold text-slate-500">Live operational snapshot</div>
        </div>
      </div>
    </header>
  );
}
