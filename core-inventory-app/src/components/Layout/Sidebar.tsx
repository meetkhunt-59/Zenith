import { NavLink } from 'react-router-dom';
import { 
  Home, Package, Settings, Share2, ArrowRightLeft, 
  RotateCcw, History, ChevronRight, Sliders, MapPin
} from 'lucide-react';

export default function Sidebar() {
  const opLinks = [
    { name: 'Receipts', to: '/receipts', icon: <RotateCcw size={18} /> },
    { name: 'Deliveries', to: '/deliveries', icon: <Share2 size={18} /> },
    { name: 'Transfers', to: '/transfers', icon: <ArrowRightLeft size={18} /> },
    { name: 'Adjustments', to: '/adjustments', icon: <Sliders size={18} /> },
    { name: 'History', to: '/history', icon: <History size={18} /> },
  ];

  return (
    <aside className="w-64 h-full bg-white border-r border-slate-100 flex flex-col py-6 text-left">
      <div className="px-6 mb-8 flex items-center gap-2">
        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white">
          <Package size={18} />
        </div>
        <span className="font-bold text-xl tracking-tight text-slate-900">Stockly</span>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => 
            `flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold transition-all ${
              isActive ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`
          }
        >
          <Home size={20} /> Dashboard
        </NavLink>

        <NavLink 
          to="/products" 
          className={({ isActive }) => 
            `flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold transition-all ${
              isActive ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`
          }
        >
          <Package size={20} /> Products
        </NavLink>
        <NavLink 
          to="/locations" 
          className={({ isActive }) => 
            `flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold transition-all ${
              isActive ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`
          }
        >
          <MapPin size={20} /> Infrastructure
        </NavLink>

        <div className="pt-6 pb-2 px-3 text-xs font-bold text-slate-400 uppercase tracking-widest">
          Operations
        </div>

        {opLinks.map((link) => (
          <NavLink 
            key={link.to}
            to={link.to} 
            className={({ isActive }) => 
              `flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold transition-all group ${
                isActive ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <div className="flex items-center gap-3">
              <span className="text-slate-400 group-hover:text-slate-500">
                {link.icon}
              </span>
              <span>{link.name}</span>
            </div>
            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      <div className="px-4 mt-auto">
        <NavLink 
          to="/settings" 
          className={({ isActive }) => 
            `flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold transition-all ${
              isActive ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`
          }
        >
          <Settings size={20} /> Settings
        </NavLink>
      </div>
    </aside>
  );
}
