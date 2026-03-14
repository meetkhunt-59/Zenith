import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Package, Plus, Search, Edit2, Trash2, Loader2, RefreshCw } from 'lucide-react';

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  category_id: string;
  unit_of_measure: string;
  reorder_point: number;
}

interface StockLevel {
  product_id: string;
  location_id: string;
  quantity: number;
}

interface Location {
  id: string;
  name: string;
  type: string;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category_id: '',
    unit_of_measure: 'Unit',
    reorder_point: 0,
    initial_stock: 0,
    initial_location_id: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [catData, prodData, locData, stockData] = await Promise.all([
        api.get<Category[]>('/products/categories').catch(() => []),
        api.get<Product[]>('/products'),
        api.get<Location[]>('/locations'),
        api.get<StockLevel[]>('/stock/levels').catch(() => []),
      ]);

      setCategories(catData || []);
      setProducts(prodData || []);
      setLocations(locData || []);
      setStockLevels(stockData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      name: '',
      sku: '',
      category_id: categories.length > 0 ? categories[0].id : '',
      unit_of_measure: 'Unit',
      reorder_point: 0,
      initial_stock: 0,
      initial_location_id: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      sku: product.sku,
      category_id: product.category_id,
      unit_of_measure: product.unit_of_measure,
      reorder_point: product.reorder_point,
      initial_stock: 0,
      initial_location_id: ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await api.del(`/products/${id}`);
      setProducts(products.filter(p => p.id !== id));
    } catch (error: unknown) {
      alert('Error deleting product: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (!formData.category_id) {
        throw new Error('Please create/select a product category before adding products.');
      }

      if (editingId) {
        await api.put(`/products/${editingId}`, {
          name: formData.name,
          sku: formData.sku,
          category_id: formData.category_id,
          unit_of_measure: formData.unit_of_measure,
          reorder_point: formData.reorder_point,
        });
      } else {
        const newProd = await api.post<Product>('/products', {
          name: formData.name,
          sku: formData.sku,
          category_id: formData.category_id,
          unit_of_measure: formData.unit_of_measure,
          reorder_point: formData.reorder_point,
        });

        if (formData.initial_location_id) {
          const qty = Math.max(0, Number(formData.initial_stock || 0));
          if (qty >= 0) {
          const move = await api.post<{ id: string }>('/operations/moves', {
            product_id: newProd.id,
            from_location_id: null,
            to_location_id: formData.initial_location_id,
            quantity: qty,
            type: 'adjustment',
            status: 'draft',
          });
          await api.post(`/operations/moves/${move.id}/validate`, {});
          }
        }
      }
      setIsModalOpen(false);
      loadData();
    } catch (error: unknown) {
      alert('Error saving product: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Products Engine</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage your catalog, SKUs, and reorder points</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search SKU or Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400 shadow-sm"
            />
          </div>
          <button 
            onClick={openAddModal}
            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Plus size={16} /> <span className="hidden sm:inline">Add Product</span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="premium-card !p-0 overflow-hidden">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
            <RefreshCw size={24} className="animate-spin text-emerald-500" />
            <span className="text-sm font-semibold">Loading Catalog...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Product Details</th>
                  <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest">SKU</th>
                  <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Stock per Location</th>
                  <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Reorder Pt</th>
                  <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-sm font-medium text-slate-500">
                      No products found. Add your first item!
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => {
                    const prodStocks = stockLevels.filter(s => s.product_id === product.id && s.quantity > 0);
                    const totalStock = prodStocks.reduce((sum, s) => sum + s.quantity, 0);

                    return (
                      <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border ${
                              totalStock <= product.reorder_point && totalStock !== 0
                                ? 'bg-orange-50 text-orange-500 border-orange-200'
                                : totalStock === 0
                                ? 'bg-red-50 text-red-500 border-red-200'
                                : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:shadow-sm border-transparent group-hover:border-slate-200'
                            }`}>
                              <Package size={18} />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-900">{product.name}</div>
                              <div className="text-xs font-semibold text-slate-500 mt-0.5">
                                {categories.find(c => c.id === product.category_id)?.name || 'Uncategorized'} • {product.unit_of_measure}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-bold tracking-wide font-mono">
                            {product.sku}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          {prodStocks.length === 0 ? (
                            <span className="text-xs font-bold text-slate-400">Out of Stock</span>
                          ) : (
                            <div className="space-y-1">
                              {prodStocks.map(stock => {
                                const loc = locations.find(l => l.id === stock.location_id);
                                return (
                                  <div key={`${stock.product_id}:${stock.location_id}`} className="flex items-center gap-2 text-xs">
                                    <span className="font-semibold text-slate-700 w-24 truncate" title={loc?.name}>{loc?.name || 'Unknown'}</span>
                                    <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">{stock.quantity}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`text-sm font-bold ${
                            totalStock <= product.reorder_point ? 'text-orange-600' : 'text-slate-900'
                          }`}>
                            {product.reorder_point}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => openEditModal(product)}
                              className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDelete(product.id)}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CRUD Modal Wrapper */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[24px] shadow-2xl border border-slate-100 overflow-hidden transform transition-all flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                {editingId ? 'Edit Product' : 'Create New Product'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
              <div className="space-y-5">
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Product Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400"
                    placeholder="e.g. Wireless Mouse"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">SKU Code</label>
                    <input
                      type="text"
                      required
                      value={formData.sku}
                      onChange={e => setFormData({...formData, sku: e.target.value.toUpperCase()})}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400"
                      placeholder="WM-001"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Unit of Measure</label>
                    <select
                      value={formData.unit_of_measure}
                      onChange={e => setFormData({...formData, unit_of_measure: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    >
                      <option value="Unit">Unit</option>
                      <option value="Box">Box</option>
                      <option value="Kg">Kg</option>
                      <option value="Liter">Liter</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {categories.length > 0 && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Category</label>
                      <select
                        required
                        value={formData.category_id}
                        onChange={e => setFormData({...formData, category_id: e.target.value})}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      >
                        <option value="" disabled>Select Category</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Reorder Point</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.reorder_point}
                      onChange={e => setFormData({...formData, reorder_point: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>

                {!editingId && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Initial Stock (Optional)</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.initial_stock}
                        onChange={e => setFormData({...formData, initial_stock: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        placeholder="0"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Initial Location</label>
                      <select
                        value={formData.initial_location_id}
                        onChange={e => setFormData({...formData, initial_location_id: e.target.value})}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        disabled={formData.initial_stock <= 0}
                      >
                        <option value="">Select Location</option>
                        {locations
                          .filter(l => l.type === 'warehouse' || l.type === 'rack')
                          .map(l => (
                            <option key={l.id} value={l.id}>{l.name}</option>
                          ))}
                      </select>
                    </div>
                  </div>
                )}

              </div>

              <div className="mt-8 pt-5 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || (categories.length > 0 && !formData.category_id)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
