import { 
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, AreaChart, Area
} from 'recharts';
import { 
  Box, AlertTriangle, Clock, TrendingUp, Package
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '../lib/api';

// Sample data for charts
const stockTrend = [
  { name: 'Mon', value: 400 },
  { name: 'Tue', value: 300 },
  { name: 'Wed', value: 600 },
  { name: 'Thu', value: 800 },
  { name: 'Fri', value: 500 },
  { name: 'Sat', value: 900 },
  { name: 'Sun', value: 700 },
];

const categoryData = [
  { name: 'Electronics', value: 40, color: '#10b981' },
  { name: 'Clothing', value: 30, color: '#3b82f6' },
  { name: 'Food', value: 20, color: '#f59e0b' },
  { name: 'Other', value: 10, color: '#6366f1' },
];

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSKUs: 0,
    lowStock: 0,
    pendingReceipts: 0,
    pendingDeliveries: 0,
    pendingTransfers: 0
  });

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
    fetchStats();
  }, []);

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
                  <span className="text-4xl font-extrabold text-slate-900 leading-none">{stats.totalSKUs}</span>
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
