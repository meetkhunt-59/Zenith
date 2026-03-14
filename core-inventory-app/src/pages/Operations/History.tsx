import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Search, ArrowRight } from 'lucide-react';

interface ProductMini {
  id: string;
  name: string;
  sku: string;
  category_id: string;
}

interface LocationMini {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

interface StockMove {
  id: string;
  type: string;
  status: string;
  quantity: number;
  created_at: string;
  product_id: string;
  from_location_id: string | null;
  to_location_id: string | null;
  product?: ProductMini | null;
  from_loc?: LocationMini | null;
  to_loc?: LocationMini | null;
}

export default function MoveHistory() {
  const [moves, setMoves] = useState<StockMove[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [movesData, locData, catData] = await Promise.all([
          api.get<StockMove[]>('/operations/moves'),
          api.get<LocationMini[]>('/locations'),
          api.get<Category[]>('/products/categories').catch(() => []),
        ]);

        setLocations(locData || []);
        setCategories(catData || []);
        setMoves(movesData || []);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredMoves = moves.filter(m => {
    const matchesSearch = m.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
                          m.id.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || m.type === filterType;
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'draft' && m.status === 'draft') ||
      (filterStatus === 'waiting' && m.status === 'draft') ||
      (filterStatus === 'ready' && m.status === 'pending') ||
      (filterStatus === 'done' && m.status === 'done') ||
      (filterStatus === 'canceled' && m.status === 'cancelled');
    
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <Search size={20} className="text-slate-400" />
            Stock Ledger
          </h1>
          <p className="text-[13px] font-medium text-slate-500 mt-0.5">Audit log of all movements and adjustments</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-slate-100"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select 
            className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
          >
            <option value="all">Types</option>
            <option value="receipt">Receipts</option>
            <option value="delivery">Deliveries</option>
            <option value="transfer">Transfers</option>
            <option value="adjustment">Adjustments</option>
          </select>
          <select 
            className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="all">Status</option>
            <option value="draft">Draft</option>
            <option value="waiting">Waiting</option>
            <option value="ready">Ready</option>
            <option value="done">Done</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>
      </div>

      <div className="premium-card !p-0 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading History...</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</th>
                <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Product</th>
                <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quantity</th>
                <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Route</th>
                <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMoves.map((move) => (
                <tr key={move.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 text-xs font-bold text-slate-500">
                    {new Date(move.created_at).toLocaleDateString()}
                    <div className="text-[10px] text-slate-400 font-medium">{new Date(move.created_at).toLocaleTimeString()}</div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${
                      move.type === 'receipt' ? 'bg-emerald-50 text-emerald-600' :
                      move.type === 'delivery' ? 'bg-orange-50 text-orange-600' :
                      'bg-slate-50 text-slate-600'
                    }`}>
                      {move.type}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-sm font-bold text-slate-900">{move.product?.name}</div>
                    <div className="text-[10px] font-bold text-slate-400">{move.product?.sku}</div>
                  </td>
                  <td className="py-4 px-6 text-sm font-mono font-bold text-slate-900">{move.quantity}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                      <span>{move.from_loc?.name}</span>
                      <ArrowRight size={12} className="text-slate-300" />
                      <span>{move.to_loc?.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`pill-badge-${move.status === 'done' ? 'green' : move.status === 'pending' ? 'blue' : move.status === 'cancelled' ? 'red' : 'yellow'}`}>
                      {move.status === 'done'
                        ? 'Done'
                        : move.status === 'pending'
                          ? 'Ready'
                          : move.status === 'cancelled'
                            ? 'Canceled'
                            : 'Draft'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
