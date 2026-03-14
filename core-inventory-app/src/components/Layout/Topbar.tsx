import { LogOut } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface TopbarProps {
  userEmail: string;
}

export default function Topbar({ userEmail }: TopbarProps) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="flex justify-between items-center premium-card !p-5 mb-6 text-left">
      <div className="flex items-center gap-3 lg:hidden">
         {/* Mobile structural placeholder if sidebar is hidden */}
         <div className="font-bold text-xl tracking-tight text-slate-900">Stockly</div>
      </div>
      
      <div className="hidden lg:flex flex-col">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">Overview</h2>
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Inventory Management</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right mr-2 hidden sm:block">
          <div className="text-sm font-bold text-slate-900">{userEmail}</div>
          <div className="text-[11px] font-semibold text-emerald-600 uppercase tracking-widest">Admin</div>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors group"
        >
          <LogOut size={16} className="text-slate-400 group-hover:text-red-500 transition-colors" />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
}
