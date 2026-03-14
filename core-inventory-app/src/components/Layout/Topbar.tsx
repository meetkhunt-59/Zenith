import { Menu } from 'lucide-react';

interface TopbarProps {
  onMenuClick?: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  return (
    <header className="flex items-center lg:hidden pb-2">
      <button
        type="button"
        onClick={onMenuClick}
        className="icon-btn bg-white border border-slate-200 shadow-sm"
        aria-label="Open menu"
      >
        <Menu size={20} className="text-slate-700" />
      </button>
    </header>
  );
}
