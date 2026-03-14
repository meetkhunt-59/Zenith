import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { 
  Plus, Loader2, CheckCircle2
} from 'lucide-react';

interface ProductMini {
  id: string;
  name: string;
  sku: string;
}

interface LocationMini {
  id: string;
  name: string;
  type?: string;
}

interface StockMove {
  id: string;
  product_id: string;
  from_location_id: string | null;
  to_location_id: string | null;
  quantity: number;
  type: string;
  status: string;
  created_at: string;
  product?: ProductMini | null;
  from_loc?: LocationMini | null;
  to_loc?: LocationMini | null;
}

export default function Deliveries() {
  const [moves, setMoves] = useState<StockMove[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [products, setProducts] = useState<ProductMini[]>([]);
  const [locations, setLocations] = useState<LocationMini[]>([]);
  const [validatingId, setValidatingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    product_id: '',
    from_location_id: '',
    to_location_id: '', // Might be a 'Customer' type location
    quantity: 1,
    type: 'delivery',
    status: 'draft'
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [movesData, prodData, locData] = await Promise.all([
        api.get<StockMove[]>('/operations/deliveries'),
        api.get<ProductMini[]>('/products'),
        api.get<LocationMini[]>('/locations'),
      ]);

      setMoves(movesData || []);
      setProducts(prodData || []);
      setLocations(locData || []);
    } catch (error) {
      console.error('Error loading deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Basic check: available stock (optional, RLS or function should handle this ideally)
      await api.post('/operations/deliveries', formData);
      setIsModalOpen(false);
      loadData();
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Failed to create delivery');
    }
  };

  const handleProcess = async (move: StockMove) => {
    setValidatingId(move.id);
    try {
      if (move.status === 'draft') {
        // Step 1: Confirm Pick/Pack (Status: pending)
        await api.put(`/operations/moves/${move.id}`, { status: 'pending' });
      } else if (move.status === 'pending') {
        // Step 2: Validate Delivery (Decrement Stock)
        await api.post(`/operations/moves/${move.id}/validate`, {});
      }
      loadData();
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Failed to process delivery');
    } finally {
      setValidatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <CheckCircle2 size={20} className="text-slate-400" />
            Delivery Orders
          </h1>
          <p className="text-[13px] font-medium text-slate-500 mt-0.5">Manage outgoing shipments and orders</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center gap-2 w-fit"
        >
          <Plus size={18} /> New Delivery
        </button>
      </div>

      <div className="premium-card !p-0 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading Deliveries...</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reference</th>
                <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Product</th>
                <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Source</th>
                <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Qty</th>
                <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {moves.map((move) => (
                <tr key={move.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 font-mono text-xs text-slate-500">{move.id.slice(0, 8).toUpperCase()}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-xs">
                        {move.product?.name?.[0]}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">{move.product?.name}</div>
                        <div className="text-[10px] font-bold text-slate-400">{move.product?.sku}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm font-bold text-slate-700">{move.from_loc?.name}</td>
                  <td className="py-4 px-6 text-sm font-mono font-bold text-slate-900">{move.quantity}</td>
                  <td className="py-4 px-6">
                    <span className={`pill-badge-${move.status === 'done' ? 'green' : move.status === 'pending' ? 'blue' : 'yellow'}`}>
                      {move.status === 'done' ? 'Completed' : move.status === 'pending' ? 'Ready (Packed)' : move.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    {move.status === 'draft' && (
                      <button 
                        onClick={() => handleProcess(move)}
                        disabled={validatingId === move.id}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 ml-auto"
                      >
                        {validatingId === move.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                        Confirm Pick/Pack
                      </button>
                    )}
                    {move.status === 'pending' && (
                      <button 
                        onClick={() => handleProcess(move)}
                        disabled={validatingId === move.id}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 ml-auto"
                      >
                        {validatingId === move.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                        Validate Delivery
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[24px] shadow-2xl p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-6">New Delivery Order</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Product</label>
                <select 
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  onChange={e => setFormData({...formData, product_id: e.target.value})}
                >
                  <option value="">Select Product...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Source (Warehouse)</label>
                  <select 
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    onChange={e => setFormData({...formData, from_location_id: e.target.value})}
                  >
                    <option value="">Select Location...</option>
                    {locations.filter(l => l.type === 'warehouse' || l.type === 'rack').map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Quantity</label>
                  <input 
                    type="number"
                    min="1"
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    value={formData.quantity}
                    onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Customer / Destination</label>
                <select 
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  onChange={e => setFormData({...formData, to_location_id: e.target.value})}
                >
                  <option value="">Select Customer/Store...</option>
                  {locations.filter(l => l.type === 'virtual_customer').map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancel</button>
                <button type="submit" className="bg-slate-900 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg">Create Draft</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
