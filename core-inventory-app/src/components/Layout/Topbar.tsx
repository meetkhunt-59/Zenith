import { User } from 'lucide-react';

interface TopbarProps {
  userEmail: string;
}

export default function Topbar({ userEmail }: TopbarProps) {
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
        <div className="flex items-center justify-center w-10 h-10 bg-slate-100 text-slate-500 rounded-full sm:hidden">
          <User size={18} />
        </div>
        <div className="text-right mr-2 hidden sm:block">
          <div className="text-sm font-bold text-slate-900">{userEmail}</div>
          <div className="text-[11px] font-semibold text-emerald-600 uppercase tracking-widest">Manager</div>
        </div>
      </div>
    </header>
  );
}
