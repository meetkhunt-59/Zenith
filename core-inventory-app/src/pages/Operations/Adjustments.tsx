import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { 
  Plus, Loader2, CheckCircle2, 
  AlertTriangle, Database
} from 'lucide-react';

interface ProductMini {
  id: string;
  name: string;
  sku: string;
}

interface LocationMini {
  id: string;
  name: string;
}

interface StockMove {
  id: string;
  product_id: string;
  to_location_id: string | null;
  quantity: number;
  type: string;
  status: string;
  created_at: string;
  product?: ProductMini | null;
  to_loc?: LocationMini | null;
}

export default function Adjustments() {
  const [moves, setMoves] = useState<StockMove[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [products, setProducts] = useState<ProductMini[]>([]);
  const [locations, setLocations] = useState<LocationMini[]>([]);
  const [validatingId, setValidatingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    product_id: '',
    from_location_id: null, // Adjustments don't have a 'from'
    to_location_id: '',
    quantity: 0,
    type: 'adjustment',
    status: 'draft',
    note: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [movesData, prodData, locData] = await Promise.all([
        api.get<StockMove[]>('/operations/adjustments'),
        api.get<ProductMini[]>('/products'),
        api.get<LocationMini[]>('/locations'),
      ]);

      setMoves(movesData || []);
      setProducts(prodData || []);
      setLocations(locData || []);
    } catch (error) {
      console.error('Error loading adjustments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/operations/adjustments', {
        ...formData,
        from_location_id: null,
      });
      setIsModalOpen(false);
      loadData();
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Failed to record adjustment');
    }
  };

  const handleValidate = async (move: StockMove) => {
    setValidatingId(move.id);
    try {
      await api.post(`/operations/moves/${move.id}/validate`, {});
      loadData();
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Failed to validate adjustment');
    } finally {
      setValidatingId(null);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <AlertTriangle size={20} className="text-slate-400" />
            Stock Adjustments
          </h1>
          <p className="text-[13px] font-medium text-slate-500 mt-0.5">Reconcile recorded stock with physical counts</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center gap-2 w-fit"
        >
          <Plus size={18} /> Cycle Count
        </button>
      </div>

      <div className="premium-card !p-0 overflow-hidden">
        {loading ? (
          <div className="p-20 text-center text-slate-400">Loading Adjustments...</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="py-5 px-8 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Reference</th>
                <th className="py-5 px-8 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Product</th>
                <th className="py-5 px-8 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Location</th>
                <th className="py-5 px-8 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">New Quantity</th>
                <th className="py-5 px-8 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Status</th>
                <th className="py-5 px-8 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {moves.map((move) => (
                <tr key={move.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="py-5 px-8 font-mono text-xs text-slate-500">{move.id.slice(0, 8).toUpperCase()}</td>
                  <td className="py-5 px-8">
                    <div className="text-sm font-bold text-slate-900">{move.product?.name}</div>
                    <div className="text-[10px] font-bold text-slate-400">{move.product?.sku}</div>
                  </td>
                  <td className="py-5 px-8 text-sm font-bold text-slate-700">{move.to_loc?.name}</td>
                  <td className="py-5 px-8">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-black text-slate-900">{move.quantity}</span>
                      <Database size={12} className="text-slate-300" />
                    </div>
                  </td>
                  <td className="py-5 px-8">
                    <span className={`pill-badge-${move.status === 'done' ? 'green' : 'orange'}`}>
                      {move.status}
                    </span>
                  </td>
                  <td className="py-5 px-8 text-right">
                    {move.status === 'draft' && (
                      <button 
                        onClick={() => handleValidate(move)}
                        disabled={validatingId === move.id}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/10 inline-flex items-center gap-2"
                      >
                        {validatingId === move.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                        Confirm Adjustment
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md text-left">
          <div className="bg-white w-full max-w-lg rounded-[32px] p-10 shadow-2xl">
            <div className="flex items-start gap-4 mb-8">
               <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                  <AlertTriangle size={24} />
               </div>
               <div>
                  <h3 className="text-xl font-bold text-slate-900">New Physical Adjustment</h3>
                  <p className="text-sm font-medium text-slate-500">This will overwrite the current stock level for the selected product.</p>
               </div>
            </div>
            
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Product to Adjust</label>
                <select 
                  required
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold outline-none"
                  onChange={e => setFormData({...formData, product_id: e.target.value})}
                >
                  <option value="">Select Product...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Location</label>
                  <select 
                    required
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold outline-none"
                    onChange={e => setFormData({...formData, to_location_id: e.target.value})}
                  >
                    <option value="">Select Location...</option>
                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Actual Count</label>
                  <input 
                    type="number"
                    min="0"
                    required
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-black outline-none"
                    value={formData.quantity}
                    onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div className="pt-6 flex justify-end gap-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-all">Cancel</button>
                <button type="submit" className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold shadow-xl shadow-slate-900/20">Record Count</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
