import { 
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, AreaChart, Area
} from 'recharts';
import { 
  Box, AlertTriangle, Clock, TrendingUp, Package
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface LocationMini {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

interface ProductMini {
  id: string;
  name: string;
  sku: string;
  category_id: string;
}

interface StockLevel {
  product_id: string;
  location_id: string;
  quantity: number;
}

interface StockMove {
  id: string;
  type: string;
  status: string;
  quantity: number;
  created_at: string;
  completed_at?: string | null;
  product_id: string;
  from_location_id: string | null;
  to_location_id: string | null;
  product?: ProductMini | null;
  from_loc?: LocationMini | null;
  to_loc?: LocationMini | null;
}

function dayLabel(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: 'short' });
}

function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSKUs: 0,
    lowStock: 0,
    pendingReceipts: 0,
    pendingDeliveries: 0,
    pendingTransfers: 0
  });

  const [moves, setMoves] = useState<StockMove[]>([]);
  const [locations, setLocations] = useState<LocationMini[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  const [stockTrend, setStockTrend] = useState<{ name: string; value: number }[]>([]);
  const [categoryData, setCategoryData] = useState<{ name: string; value: number; color: string }[]>([]);

  useEffect(() => {
    async function fetchStats() {
      try {
        const kpis = await api.get<{
          totalProducts: number;
          totalSKUs: number;
          lowStock: number;
          pendingReceipts: number;
          pendingDeliveries: number;
          pendingTransfers: number;
        }>('/dashboard/kpis');
        setStats({
          totalProducts: kpis.totalProducts || 0,
          totalSKUs: kpis.totalSKUs || 0,
          lowStock: kpis.lowStock || 0,
          pendingReceipts: kpis.pendingReceipts || 0,
          pendingDeliveries: kpis.pendingDeliveries || 0,
          pendingTransfers: kpis.pendingTransfers || 0,
        });
      } catch (e) {
        console.error('Failed to load dashboard KPIs:', e);
      }
    }
    async function fetchMovesAndCharts() {
      try {
        const [movesData, locData, catData, products, levels] = await Promise.all([
          api.get<StockMove[]>('/operations/moves'),
          api.get<LocationMini[]>('/locations'),
          api.get<Category[]>('/products/categories').catch(() => []),
          api.get<ProductMini[]>('/products'),
          api.get<StockLevel[]>('/stock/levels').catch(() => []),
        ]);

        setMoves(movesData || []);
        setLocations(locData || []);
        setCategories(catData || []);

        // Trend: count completed operations per day (last 7 days)
        const today = new Date();
        const days: Date[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          days.push(d);
        }
        const byDay: Record<string, number> = Object.fromEntries(days.map(d => [ymd(d), 0]));
        (movesData || []).forEach(m => {
          const when = m.completed_at || m.created_at;
          const key = ymd(new Date(when));
          if (key in byDay) byDay[key] += 1;
        });
        setStockTrend(days.map(d => ({ name: dayLabel(d), value: byDay[ymd(d)] || 0 })));

        // Category distribution: stock quantity by category
        const productById = new Map<string, ProductMini>((products || []).map(p => [p.id, p]));
        const catById = new Map<string, string>((catData || []).map(c => [c.id, c.name]));
        const qtyByCat: Record<string, number> = {};
        (levels || []).forEach(l => {
          if (l.quantity <= 0) return;
          const p = productById.get(l.product_id);
          const catName = p ? (catById.get(p.category_id) || 'Other') : 'Other';
          qtyByCat[catName] = (qtyByCat[catName] || 0) + l.quantity;
        });

        const palette = ['#10b981', '#3b82f6', '#f59e0b', '#6366f1', '#ef4444', '#14b8a6'];
        const rows = Object.entries(qtyByCat)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);
        const total = rows.reduce((s, [, v]) => s + v, 0) || 1;
        setCategoryData(
          rows.map(([name, qty], idx) => ({
            name,
            value: Math.round((qty / total) * 100),
            color: palette[idx % palette.length],
          }))
        );
      } catch (e) {
        console.error('Failed to load dashboard operations:', e);
      }
    }

    fetchStats();
    fetchMovesAndCharts();
  }, []);

  const filteredMoves = moves
    .filter(m => {
      const matchesSearch =
        !search ||
        m.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
        m.id.toLowerCase().includes(search.toLowerCase());
      const matchesType = filterType === 'all' || m.type === filterType;
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'draft' && m.status === 'draft') ||
        (filterStatus === 'waiting' && m.status === 'draft') ||
        (filterStatus === 'ready' && m.status === 'pending') ||
        (filterStatus === 'done' && m.status === 'done') ||
        (filterStatus === 'canceled' && m.status === 'cancelled');
      const matchesLoc =
        filterLocation === 'all' ||
        m.from_location_id === filterLocation ||
        m.to_location_id === filterLocation;
      const matchesCat = filterCategory === 'all' || m.product?.category_id === filterCategory;
      return matchesSearch && matchesType && matchesStatus && matchesLoc && matchesCat;
    })
    .slice(0, 20);

  return (
    <div className="space-y-10 pb-16">
      
      {/* 1st ROW: KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <KPICard title="Total Products in Stock" value={stats.totalProducts.toString()} change="Units" icon={<Box className="text-blue-500" />} />
        <KPICard title="Total SKU's" value={stats.totalSKUs.toString()} change="Catalog Size" icon={<Package className="text-emerald-500" />} />
        <KPICard title="Low Stock Alerts" value={stats.lowStock.toString()} change="Needs Attention" icon={<AlertTriangle className="text-orange-500" />} />
        <KPICard title="Pending Receipts" value={stats.pendingReceipts.toString()} change="Incoming" icon={<Clock className="text-indigo-500" />} />
        <KPICard title="Pending Delivery" value={stats.pendingDeliveries.toString()} change="Outgoing" icon={<Clock className="text-purple-500" />} />
        <KPICard title="Scheduled Transfers" value={stats.pendingTransfers.toString()} change="Internal" icon={<Clock className="text-slate-500" />} />
      </div>

      {/* 2nd ROW: Real-time tracking (Now horizontal and full width) */}
      <div className="premium-card">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Real-time Stock Pulse</h3>
            <p className="text-sm font-medium text-slate-500 mt-1">Live tracking of warehouse movements and throughput</p>
          </div>
          <div className="flex gap-2">
            <span className="pill-badge-green font-bold text-[10px] space-x-1 flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1"></span>
              LIVE DATA
            </span>
          </div>
        </div>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stockTrend}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} dy={10} />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '16px', 
                  border: 'none', 
                  boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)',
                  fontWeight: 'bold',
                  fontSize: '12px'
                }} 
              />
              <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3rd ROW: Distribution & Details */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
        
        {/* STOCK AVAILABILITY */}
        <div className="premium-card md:col-span-12">
          <div className="flex justify-between items-center mb-10">
            <div>
               <h3 className="text-xl font-bold text-slate-900">Global Inventory Distribution</h3>
               <p className="text-sm font-medium text-slate-500 mt-1">Allocated stock across categorized departments</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
             {/* Chart Side */}
             <div className="h-[300px] flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      innerRadius={85}
                      outerRadius={110}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-4xl font-extrabold text-slate-900 leading-none">{categories.length}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Total Categories</span>
                </div>
             </div>

             {/* Description Side */}
             <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-8">
                {categoryData.map(c => (
                  <div key={c.name} className="flex items-center gap-5 p-6 rounded-[24px] bg-slate-50/50 border border-slate-100/50 hover:bg-white hover:border-emerald-100 hover:shadow-md transition-all group">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-sm" style={{backgroundColor: c.color}}>
                      {c.value}%
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-700 group-hover:text-slate-900">{c.name}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Primary Segment</div>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>

      {/* 4th ROW: Operations (Dynamic Filters) */}
      <div className="premium-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Operations Ledger</h3>
            <p className="text-sm font-medium text-slate-500 mt-1">Filter by type, status, location, and category</p>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <input
              type="text"
              placeholder="Search product / ref..."
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm w-56"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />

            <select className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700" value={filterLocation} onChange={e => setFilterLocation(e.target.value)}>
              <option value="all">All Locations</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>

            <select className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
              <option value="all">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <select className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700" value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="all">All Types</option>
              <option value="receipt">Receipts</option>
              <option value="delivery">Delivery</option>
              <option value="transfer">Internal</option>
              <option value="adjustment">Adjustments</option>
            </select>

            <select className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="waiting">Waiting</option>
              <option value="ready">Ready</option>
              <option value="done">Done</option>
              <option value="canceled">Canceled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</th>
                <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Product</th>
                <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Qty</th>
                <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Route</th>
                <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMoves.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 px-6 text-sm font-semibold text-slate-500">No operations match the selected filters.</td>
                </tr>
              ) : (
                filteredMoves.map(move => (
                  <tr key={move.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 text-xs font-bold text-slate-500">
                      {new Date(move.created_at).toLocaleDateString()}
                      <div className="text-[10px] text-slate-400 font-medium">{new Date(move.created_at).toLocaleTimeString()}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${
                        move.type === 'receipt' ? 'bg-emerald-50 text-emerald-600' :
                        move.type === 'delivery' ? 'bg-orange-50 text-orange-600' :
                        move.type === 'transfer' ? 'bg-slate-50 text-slate-600' :
                        'bg-indigo-50 text-indigo-600'
                      }`}>
                        {move.type === 'transfer' ? 'internal' : move.type}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm font-bold text-slate-900">{move.product?.name || move.product_id}</div>
                      <div className="text-[10px] font-bold text-slate-400">{move.product?.sku || ''}</div>
                    </td>
                    <td className="py-4 px-6 text-sm font-mono font-bold text-slate-900">{move.quantity}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                        <span>{move.from_loc?.name || '-'}</span>
                        <span className="text-slate-300">→</span>
                        <span>{move.to_loc?.name || '-'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`pill-badge-${move.status === 'done' ? 'green' : move.status === 'pending' ? 'blue' : move.status === 'cancelled' ? 'red' : 'yellow'}`}>
                        {move.status === 'done' ? 'Done' : move.status === 'pending' ? 'Ready' : move.status === 'cancelled' ? 'Canceled' : 'Draft'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, change, icon }: { title: string, value: string, change: string, icon: React.ReactNode }) {
  const isUp = change.startsWith('+');
  return (
    <div className="premium-card group hover:-translate-y-1 transition-all">
      <div className="flex justify-between items-start mb-6">
        <div className={`w-12 h-12 rounded-2xl bg-brand-bg flex items-center justify-center shadow-inner group-hover:bg-white group-hover:shadow-md transition-all`}>
          {icon}
        </div>
        <div className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 ${
          isUp ? 'text-emerald-600 bg-emerald-50' : 'text-slate-500 bg-slate-50'
        }`}>
          {isUp ? <TrendingUp size={12} /> : null}
          {change}
        </div>
      </div>
      <div>
        <div className="text-sm font-bold text-slate-400 uppercase tracking-[0.1em] mb-1">{title}</div>
        <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</div>
      </div>
    </div>
  );
}
