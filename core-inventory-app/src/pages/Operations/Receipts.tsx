import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Loader2, CheckCircle2 } from 'lucide-react';

export default function Receipts() {
  const [moves, setMoves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [validatingId, setValidatingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    product_id: '',
    from_location_id: '', // For receipt, this might be a 'Vendor' type location
    to_location_id: '',
    quantity: 1,
    type: 'receipt',
    status: 'draft'
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: movesData, error: movesError } = await supabase
        .from('stock_moves')
        .select(`
          *,
          product:products(name, sku),
          from_loc:locations!from_location_id(name),
          to_loc:locations!to_location_id(name)
        `)
        .eq('type', 'receipt')
        .order('created_at', { ascending: false });

      if (movesError) throw movesError;
      setMoves(movesData || []);

      const { data: prodData } = await supabase.from('products').select('*');
      const { data: locData } = await supabase.from('locations').select('*');
      
      setProducts(prodData || []);
      setLocations(locData || []);
    } catch (error) {
      console.error('Error loading receipts:', error);
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
      const { error } = await supabase.from('stock_moves').insert([formData]);
      if (error) throw error;
      setIsModalOpen(false);
      loadData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleValidate = async (move: any) => {
    setValidatingId(move.id);
    try {
      // 1. Update stock level (Upsert)
      // Check if entry exists
      const { data: existingLevel } = await supabase
        .from('stock_levels')
        .select('*')
        .eq('product_id', move.product_id)
        .eq('location_id', move.to_location_id)
        .single();

      if (existingLevel) {
        await supabase
          .from('stock_levels')
          .update({ quantity: existingLevel.quantity + move.quantity, last_updated: new Date() })
          .eq('product_id', move.product_id)
          .eq('location_id', move.to_location_id);
      } else {
        await supabase
          .from('stock_levels')
          .insert([{ 
            product_id: move.product_id, 
            location_id: move.to_location_id, 
            quantity: move.quantity 
          }]);
      }

      // 2. Mark move as 'done'
      const { error } = await supabase
        .from('stock_moves')
        .update({ status: 'done', completed_at: new Date() })
        .eq('id', move.id);

      if (error) throw error;
      loadData();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setValidatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Incoming Receipts</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Receive and validate new stock from suppliers</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2"
        >
          <Plus size={18} /> Create Receipt
        </button>
      </div>

      <div className="premium-card !p-0 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading Receipts...</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reference</th>
                <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Product</th>
                <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Destination</th>
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
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                        {move.product?.name?.[0]}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">{move.product?.name}</div>
                        <div className="text-[10px] font-bold text-slate-400">{move.product?.sku}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm font-bold text-slate-700">{move.to_loc?.name}</td>
                  <td className="py-4 px-6 text-sm font-mono font-bold text-slate-900">{move.quantity}</td>
                  <td className="py-4 px-6">
                    <span className={`pill-badge-${move.status === 'done' ? 'green' : 'yellow'}`}>
                      {move.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    {move.status === 'draft' && (
                      <button 
                        onClick={() => handleValidate(move)}
                        disabled={validatingId === move.id}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 ml-auto"
                      >
                        {validatingId === move.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                        Validate
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
            <h3 className="text-lg font-bold text-slate-900 mb-6">New Incoming Receipt</h3>
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
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Destination</label>
                  <select 
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    onChange={e => setFormData({...formData, to_location_id: e.target.value})}
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
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancel</button>
                <button type="submit" className="bg-slate-900 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg">Save Draft</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
