import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { MapPin, Plus, Edit2, Trash2, Warehouse } from 'lucide-react';

interface Location {
  id: string;
  name: string;
  type: string;
  parent_id: string | null;
}

export default function Locations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'warehouse',
    parent_id: null as string | null
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.get<Location[]>('/locations');
      setLocations(data || []);
    } catch (e) {
      console.error('Failed to load locations:', e);
      setLocations([]);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/locations/${editingId}`, formData);
      } else {
        await api.post('/locations', formData);
      }
      setIsModalOpen(false);
      loadData();
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Failed to save location');
    } finally {
      setSaving(false);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: '', type: 'warehouse', parent_id: null });
    setIsModalOpen(true);
  };

  const openEditModal = (loc: Location) => {
    setEditingId(loc.id);
    setFormData({ name: loc.name, type: loc.type, parent_id: loc.parent_id });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    await api.del(`/locations/${id}`);
    loadData();
  };

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Locations & Infrastructure</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage your warehouses, aisles, and racks</p>
        </div>
        <button onClick={openAddModal} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg">
          <Plus size={18} /> Add Location
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full py-20 text-center text-slate-400">Loading infrastructure...</div>
        ) : locations.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-400">No locations defined. Create your first warehouse!</div>
        ) : (
          locations.map(loc => (
            <div key={loc.id} className="premium-card group hover:border-emerald-200 transition-all flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-all border border-slate-100">
                  {loc.type === 'warehouse' ? <Warehouse size={24} /> : <MapPin size={24} />}
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-lg">{loc.name}</div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{loc.type}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEditModal(loc)} className="p-2 text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDelete(loc.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-lg rounded-[32px] p-10 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 mb-8">{editingId ? 'Edit Location' : 'New Location'}</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Location Name</label>
                <input 
                  required 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                  placeholder="e.g. Warehouse North"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Type</label>
                <select 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold outline-none"
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                >
                  <option value="warehouse">Warehouse</option>
                  <option value="rack">Rack / Aisle</option>
                  <option value="virtual_customer">Customer (Virtual)</option>
                  <option value="virtual_vendor">Supplier (Virtual)</option>
                </select>
              </div>
              <div className="pt-6 flex justify-end gap-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-all">Cancel</button>
                <button type="submit" disabled={saving} className="bg-emerald-500 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
