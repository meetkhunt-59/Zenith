import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  ArrowDownLeft,
  Boxes,
  CheckCircle2,
  Clock,
  MapPinned,
  Package,
  PackageCheck,
  PackageX,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Truck,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';

// --- Types ---
type KpiResponse = {
  totalProducts: number;
  totalSKUs: number;
  lowStock: number;
  pendingReceipts: number;
  pendingDeliveries: number;
  pendingTransfers: number;
};

type Product = {
  id: string;
  name: string;
  sku: string;
  reorder_point: number;
  category_id: string;
};

type Location = {
  id: string;
  name: string;
  type: string;
};

type StockLevel = {
  product_id: string;
  location_id: string;
  quantity: number;
  last_updated: string;
};

type Category = {
  id: string;
  name: string;
};

type StockMove = {
  id: string;
  product_id: string;
  from_location_id: string | null;
  to_location_id: string | null;
  quantity: number;
  type: 'receipt' | 'delivery' | 'transfer' | 'adjustment';
  status: 'draft' | 'pending' | 'done' | 'cancelled';
  created_at: string;
  completed_at: string | null;
  product?: { id: string; name: string; sku: string; category_id: string } | null;
  from_loc?: { id: string; name: string } | null;
  to_loc?: { id: string; name: string } | null;
};

type DataState<T> = {
  loading: boolean;
  error: string | null;
  data: T;
};

// --- Data Fetching Hook ---
function useDashboardData() {
  const [kpis, setKpis] = useState<DataState<KpiResponse | null>>({ loading: true, error: null, data: null });
  const [products, setProducts] = useState<DataState<Product[]>>({ loading: true, error: null, data: [] });
  const [locations, setLocations] = useState<DataState<Location[]>>({ loading: true, error: null, data: [] });
  const [stockLevels, setStockLevels] = useState<DataState<StockLevel[]>>({ loading: true, error: null, data: [] });
  const [moves, setMoves] = useState<DataState<StockMove[]>>({ loading: true, error: null, data: [] });
  const [categories, setCategories] = useState<DataState<Category[]>>({ loading: true, error: null, data: [] });

  const load = async () => {
    setKpis((s) => ({ ...s, loading: true, error: null }));
    setProducts((s) => ({ ...s, loading: true, error: null }));
    setLocations((s) => ({ ...s, loading: true, error: null }));
    setStockLevels((s) => ({ ...s, loading: true, error: null }));
    setMoves((s) => ({ ...s, loading: true, error: null }));
    setCategories((s) => ({ ...s, loading: true, error: null }));

    try {
      const [kpiRes, productRes, locationRes, stockRes, movesRes, catRes] = await Promise.all([
        api.get<KpiResponse>('/dashboard/kpis'),
        api.get<Product[]>('/products'),
        api.get<Location[]>('/locations'),
        api.get<StockLevel[]>('/stock/levels'),
        api.get<StockMove[]>('/operations/moves'),
        api.get<Category[]>('/products/categories').catch(() => []), 
      ]);

      setKpis({ loading: false, error: null, data: kpiRes });
      setProducts({ loading: false, error: null, data: productRes });
      setLocations({ loading: false, error: null, data: locationRes });
      setStockLevels({ loading: false, error: null, data: stockRes });
      setMoves({ loading: false, error: null, data: movesRes });
      setCategories({ loading: false, error: null, data: catRes });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load dashboard data';
      setKpis((s) => ({ ...s, loading: false, error: message }));
      setProducts((s) => ({ ...s, loading: false, error: message }));
      setLocations((s) => ({ ...s, loading: false, error: message }));
      setStockLevels((s) => ({ ...s, loading: false, error: message }));
      setMoves((s) => ({ ...s, loading: false, error: message }));
    }
  };

  useEffect(() => {
    load();
  }, []);

  return { kpis, products, locations, stockLevels, moves, categories, reload: load };
}

// --- Components ---

function KpiSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between h-32 animate-pulse shadow-sm">
      <div className="h-4 w-24 bg-slate-100 rounded-md"></div>
      <div className="flex justify-between items-end mt-4">
        <div className="h-10 w-16 bg-slate-100 rounded-md"></div>
        <div className="h-10 w-10 bg-slate-50 rounded-full"></div>
      </div>
    </div>
  );
}

function SectionSkeleton({ height }: { height: string }) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200 p-6 animate-pulse shadow-sm ${height}`}
    >
      <div className="h-5 w-48 bg-slate-100 rounded-md mb-6"></div>
      <div className="h-full w-full bg-slate-50/50 rounded-xl"></div>
    </div>
  );
}

// --- Main Page ---
export default function Dashboard() {
  const { kpis, products, locations, stockLevels, moves, categories, reload } = useDashboardData();

  // --- Filter State ---
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterLocId, setFilterLocId] = useState<string>('all');
  const [filterCatId, setFilterCatId] = useState<string>('all');

  // --- Derived Data ---
  const productMap = useMemo(() => Object.fromEntries(products.data.map((p) => [p.id, p])), [products.data]);
  const locationMap = useMemo(() => Object.fromEntries(locations.data.map((l) => [l.id, l])), [locations.data]);

  const stockByProduct = useMemo(() => {
    const grouped = new Map<string, { product: Product; quantity: number }>();
    stockLevels.data.forEach((row) => {
      const prod = productMap[row.product_id];
      if (!prod) return;
      const current = grouped.get(row.product_id) || { product: prod, quantity: 0 };
      grouped.set(row.product_id, { ...current, quantity: current.quantity + row.quantity });
    });
    // Add 0-quantity products
    products.data.forEach((p) => {
      if (!grouped.has(p.id)) grouped.set(p.id, { product: p, quantity: 0 });
    });
    return Array.from(grouped.values()).sort((a, b) => b.quantity - a.quantity);
  }, [productMap, products.data, stockLevels.data]);

  const lowStockProducts = useMemo(
    () => stockByProduct.filter(({ product, quantity }) => quantity > 0 && quantity <= product.reorder_point),
    [stockByProduct]
  );

  const outOfStockProducts = useMemo(
    () => stockByProduct.filter(({ quantity }) => quantity === 0),
    [stockByProduct]
  );

  const filteredMoves = useMemo(() => {
    return moves.data.filter(move => {
      const product = productMap[move.product_id];
      const matchType = filterType === 'all' || move.type === filterType;
      const matchStatus = filterStatus === 'all' || move.status === filterStatus;
      const matchLoc = filterLocId === 'all' || move.from_location_id === filterLocId || move.to_location_id === filterLocId;
      const matchCat = filterCatId === 'all' || product?.category_id === filterCatId;
      return matchType && matchStatus && matchLoc && matchCat;
    });
  }, [moves.data, filterType, filterStatus, filterLocId, filterCatId, productMap]);

  const recentMoves = useMemo(
    () => [...filteredMoves].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 8),
    [filteredMoves]
  );

  const movementSeries = useMemo(() => {
    const now = new Date();
    const days = 14;
    const buckets: Record<string, { label: string; receipt: number; delivery: number }> = {};

    for (let i = days - 1; i >= 0; i -= 1) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      buckets[key] = { label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), receipt: 0, delivery: 0 };
    }

    moves.data.forEach((move) => {
      const day = move.created_at.slice(0, 10);
      const bucket = buckets[day];
      if (!bucket) return;
      if (move.type === 'receipt') bucket.receipt += move.quantity;
      if (move.type === 'delivery') bucket.delivery += move.quantity;
    });

    return Object.values(buckets);
  }, [moves.data]);

  const stockByLocation = useMemo(() => {
    const map = new Map<string, number>();
    stockLevels.data.forEach((row) => {
      const loc = locationMap[row.location_id];
      // Only chart parent warehouse levels if possible, or broad racks
      if (!loc) return;
      map.set(row.location_id, (map.get(row.location_id) || 0) + row.quantity);
    });
    return Array.from(map.entries())
      .map(([loc_id, qty]) => ({
        location: locationMap[loc_id]?.name || 'Unknown',
        quantity: qty,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5); // top 5
  }, [locationMap, stockLevels.data]);

  const anyLoading = kpis.loading || products.loading || locations.loading || stockLevels.loading || moves.loading;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out space-y-8 pb-12 w-full max-w-[1500px] mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="mt-1.5 text-slate-500 text-sm font-medium">
            Real-time warehouse operations and inventory pulse.
          </p>
        </div>
        <button
          onClick={reload}
          disabled={anyLoading}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw size={16} className={anyLoading ? "animate-spin text-slate-400" : ""} />
          Sync Data
        </button>
      </div>

      {/* KPIs Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
        
        {kpis.loading ? <KpiSkeleton /> : (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
            <div className="text-sm font-semibold text-slate-500 flex items-center gap-2">
              <Package size={16} className="text-slate-400" /> Total Items in Stock
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div className="text-4xl font-bold text-slate-900 tracking-tight">
                {kpis.data?.totalProducts.toLocaleString()}
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-600 border border-slate-100">
                <Boxes size={18} />
              </div>
            </div>
          </div>
        )}

        {kpis.loading ? <KpiSkeleton /> : (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
            <div className="text-sm font-semibold text-slate-500 flex items-center gap-2">
              <TrendingDown size={16} className="text-amber-500" /> Low Stock Alerts
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div className="text-4xl font-bold text-slate-900 tracking-tight">
                {kpis.data?.lowStock.toLocaleString()}
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-600 border border-amber-100">
                <AlertCircle size={18} />
              </div>
            </div>
          </div>
        )}

        {kpis.loading ? <KpiSkeleton /> : (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
            <div className="text-sm font-semibold text-slate-500 flex items-center gap-2">
              <ArrowUpRight size={16} className="text-emerald-500" /> Pending Receipts
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div className="text-4xl font-bold text-slate-900 tracking-tight">
                {kpis.data?.pendingReceipts.toLocaleString()}
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                <PackageCheck size={18} />
              </div>
            </div>
          </div>
        )}

        {kpis.loading ? <KpiSkeleton /> : (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
            <div className="text-sm font-semibold text-slate-500 flex items-center gap-2">
              <Truck size={16} className="text-blue-500" /> Pending Deliveries
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div className="text-4xl font-bold text-slate-900 tracking-tight">
                {kpis.data?.pendingDeliveries.toLocaleString()}
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                <ArrowRight size={18} />
              </div>
            </div>
          </div>
        )}

        {kpis.loading ? <KpiSkeleton /> : (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
            <div className="text-sm font-semibold text-slate-500 flex items-center gap-2">
              <RefreshCw size={16} className="text-indigo-500" /> Pending Transfers
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div className="text-4xl font-bold text-slate-900 tracking-tight">
                {kpis.data?.pendingTransfers.toLocaleString()}
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                <TrendingUp size={18} />
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Chart Column (Span 2) */}
        <div className="xl:col-span-2 space-y-6">
          {moves.loading ? <SectionSkeleton height="h-[420px]" /> : (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Throughput Volume</h2>
                  <p className="text-sm text-slate-500 mt-1">Receipts vs Deliveries over the last 14 days.</p>
                </div>
              </div>
              
              {movementSeries.some(m => m.receipt > 0 || m.delivery > 0) ? (
                <div className="h-[280px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={movementSeries} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorReceipt" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorDelivery" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="label" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} 
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', fontWeight: 500 }}
                        cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '13px', fontWeight: 500 }} />
                      <Area type="monotone" name="Receipts (In)" dataKey="receipt" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorReceipt)" />
                      <Area type="monotone" name="Deliveries (Out)" dataKey="delivery" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorDelivery)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[280px] flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-slate-500">
                  <TrendingUp size={32} className="text-slate-300 mb-3" />
                  <span className="text-sm font-medium">Not enough movement data to chart.</span>
                </div>
              )}
            </div>
          )}

          {/* Bottom row of xl:col-span-2: Locations & Alerts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Stock by Location */}
            {stockLevels.loading ? <SectionSkeleton height="h-[340px]" /> : (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900">Top Locations by Volume</h2>
                <div className="h-[220px] mt-6 w-full">
                  {stockByLocation.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stockByLocation} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="location" type="category" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }} width={90} />
                        <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="quantity" fill="#0f766e" radius={[0, 4, 4, 0]} barSize={24}>
                          {stockByLocation.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#0d9488' : index === 1 ? '#14b8a6' : '#5eead4'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-sm font-medium text-slate-400 border border-dashed border-slate-200 rounded-xl">
                      No location data
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Inventory Alerts */}
            {products.loading ? <SectionSkeleton height="h-[340px]" /> : (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-900">Critical Alerts</h2>
                  <Link to="/products" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">View all</Link>
                </div>
                
                <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                  {outOfStockProducts.length === 0 && lowStockProducts.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                      <CheckCircle2 size={32} className="text-emerald-400 mb-2" />
                      <span className="text-sm font-medium">Inventory looks healthy</span>
                    </div>
                  ) : (
                    <>
                      {outOfStockProducts.slice(0, 3).map(({product}) => (
                        <div key={product.id} className="flex items-center p-3 rounded-xl border border-red-100 bg-red-50/50">
                          <PackageX size={18} className="text-red-500 mr-3 hidden sm:block" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-red-900 truncate">{product.name}</div>
                            <div className="text-xs text-red-700 font-medium">Out of stock</div>
                          </div>
                        </div>
                      ))}
                      {lowStockProducts.slice(0, 4 - Math.min(outOfStockProducts.length, 3)).map(({product, quantity}) => (
                        <div key={product.id} className="flex items-center p-3 rounded-xl border border-amber-100 bg-amber-50/50">
                          <AlertCircle size={18} className="text-amber-500 mr-3 hidden sm:block" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-amber-900 truncate">{product.name}</div>
                            <div className="text-xs text-amber-700 font-medium">Only {quantity} left (reorder at {product.reorder_point})</div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}
            
          </div>
        </div>

        {/* Right Column: Recent Activity Feed */}
        <div className="xl:col-span-1">
          {moves.loading ? <SectionSkeleton height="h-[784px]" /> : (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-full flex flex-col">
              <div className="flex flex-col gap-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Recent Transactions</h2>
                    <p className="text-sm text-slate-500">Latest stock movements.</p>
                  </div>
                  <Link to="/history" className="text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg whitespace-nowrap">
                    View ledger
                  </Link>
                </div>

                {/* Dynamic Filters */}
                <div className="grid grid-cols-2 gap-2">
                  <select 
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="text-[10px] font-bold uppercase tracking-wider bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-slate-600 outline-none focus:ring-1 focus:ring-slate-300"
                  >
                    <option value="all">All Types</option>
                    <option value="receipt">Receipts</option>
                    <option value="delivery">Deliveries</option>
                    <option value="transfer">Internal</option>
                    <option value="adjustment">Adjustments</option>
                  </select>

                  <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="text-[10px] font-bold uppercase tracking-wider bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-slate-600 outline-none focus:ring-1 focus:ring-slate-300"
                  >
                    <option value="all">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="pending">Waiting</option>
                    <option value="ready">Ready</option>
                    <option value="done">Done</option>
                    <option value="cancelled">Canceled</option>
                  </select>

                  <select 
                    value={filterLocId}
                    onChange={(e) => setFilterLocId(e.target.value)}
                    className="text-[10px] font-bold uppercase tracking-wider bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-slate-600 outline-none focus:ring-1 focus:ring-slate-300"
                  >
                    <option value="all">All Locations</option>
                    {locations.data.filter(l => l.type !== 'virtual').map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>

                <select 
                  value={filterCatId}
                  onChange={(e) => setFilterCatId(e.target.value)}
                  className="text-[10px] font-bold uppercase tracking-wider bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-slate-600 outline-none focus:ring-1 focus:ring-slate-300"
                >
                  <option value="all">All Categories</option>
                  {categories.data.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                </div>
              </div>

              <div className="flex-1 -mx-2">
                {recentMoves.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center border border-dashed border-slate-200 rounded-xl m-2">
                    <Clock size={28} className="text-slate-300 mb-3" />
                    <span className="text-sm font-medium">No recorded movements yet.</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {recentMoves.map((move) => {
                      const product = productMap[move.product_id];
                      const isReceipt = move.type === 'receipt';
                      const isDelivery = move.type === 'delivery';
                      
                      const Icon = isReceipt ? ArrowDownLeft : isDelivery ? ArrowUpRight : MapPinned;
                      const toneBg = isReceipt ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                     isDelivery ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                                     'bg-indigo-50 text-indigo-600 border-indigo-100';

                      return (
                        <div key={move.id} className="group flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                          <div className={`mt-1 flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full border ${toneBg}`}>
                            <Icon size={18} strokeWidth={2.5} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-bold text-slate-900 truncate">
                                {product?.name || 'Unknown Item'}
                              </p>
                              <span className="text-sm font-bold whitespace-nowrap text-slate-700 bg-white border border-slate-200 px-2 rounded-md shadow-sm">
                                {isReceipt ? '+' : isDelivery ? '-' : ''}{move.quantity}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                move.status === 'done' ? 'text-slate-500 bg-slate-100' : 
                                move.status === 'pending' ? 'text-amber-600 bg-amber-50' : 
                                'text-slate-400 bg-slate-50 border border-slate-100'
                              }`}>
                                {move.status}
                              </span>
                              <span className="text-xs font-medium text-slate-500 truncate">
                                {new Date(move.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
