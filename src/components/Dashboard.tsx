import { useState } from 'react';
import { 
  FileText, Users, Clock, CheckCircle, XCircle, TrendingUp, Plus, 
  ArrowRight, FileSpreadsheet, Download, RefreshCw, Layers 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie 
} from 'recharts';
import { Quotation, Customer, AuditLog } from '../types';

interface DashboardProps {
  quotations: Quotation[];
  customers: Customer[];
  auditLogs: AuditLog[];
  onCreateNew: () => void;
  onSelectQuotation: (id: string) => void;
  onNavigateToCustomers: () => void;
}

export default function Dashboard({ 
  quotations, 
  customers, 
  auditLogs, 
  onCreateNew, 
  onSelectQuotation,
  onNavigateToCustomers
}: DashboardProps) {
  
  // Format Indian Currency nicely
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Calculations
  const totalQuotations = quotations.length;
  const pendingCount = quotations.filter(q => q.status === 'Pending').length;
  const approvedCount = quotations.filter(q => q.status === 'Approved').length;
  const rejectedCount = quotations.filter(q => q.status === 'Rejected').length;
  const totalCustomers = customers.length;

  // Total Quoted Revenue (summing (Amount after item discount) + GST)
  const calculateQuotationTotal = (q: Quotation) => {
    let subtotal = 0;
    q.items.forEach(item => {
      // Apply master discount
      const discountedRate = item.rate * (1 - q.masterDiscountPercent / 100);
      subtotal += item.qty * discountedRate;
    });

    const isLocal = q.customerId === 'c1'; // mock state-based check
    const gstRate = 0.18;
    const gstAmount = subtotal * gstRate;
    return subtotal + gstAmount;
  };

  const totalRevenueQuoted = quotations.reduce((acc, q) => acc + calculateQuotationTotal(q), 0);
  
  // Chart 1: Monthly Distribution
  const monthlyData = [
    { name: 'Jan', count: 1, amount: 65000 },
    { name: 'Feb', count: 2, amount: 140000 },
    { name: 'Mar', count: 4, amount: 380000 },
    { name: 'Apr', count: 3, amount: 240000 },
    { name: 'May', count: 5, amount: 490000 },
    { name: 'Jun', count: totalQuotations, amount: totalRevenueQuoted }
  ];

  // Chart 2: Status breakdown
  const statusData = [
    { name: 'Approved', value: approvedCount, color: '#10b981' },
    { name: 'Pending', value: pendingCount, color: '#f59e0b' },
    { name: 'Rejected', value: rejectedCount, color: '#ef4444' }
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Top Welcome Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-lg font-bold font-display text-slate-900 tracking-tight">Swaraj Furniture Pvt Ltd</h1>
          <p className="text-[11px] text-slate-500">Furniture Quotation & Manufacturing ERP Dashboard (High Density)</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button 
            id="quick-create-btn"
            onClick={onCreateNew}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded text-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            New Quotation
          </button>
          
          <button 
            id="cust-nav-btn"
            onClick={onNavigateToCustomers}
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-bold py-1.5 px-3 rounded border border-slate-200 transition shadow-2xs cursor-pointer text-xs"
          >
            <Users className="w-3.5 h-3.5 text-slate-400" />
            Manage Customers
          </button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Rev */}
        <div className="bg-white rounded p-4 border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Quoted (Inc. GST)</span>
            <div className="text-xl font-bold font-mono text-slate-900">{formatCurrency(totalRevenueQuoted)}</div>
            <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +12% vs last month
            </span>
          </div>
          <div className="bg-blue-50 text-blue-600 p-2.5 rounded">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Quotes */}
        <div className="bg-white rounded p-4 border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Quotations</span>
            <div className="text-xl font-bold font-display text-slate-900">{totalQuotations}</div>
            <span className="text-[10px] text-slate-400">All registered items</span>
          </div>
          <div className="bg-slate-50 text-slate-500 p-2.5 rounded">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* Customers */}
        <div className="bg-white rounded p-4 border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Customers</span>
            <div className="text-xl font-bold font-display text-slate-900">{totalCustomers}</div>
            <span className="text-[10px] text-slate-400">B2B & retail clients</span>
          </div>
          <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* State Statuses */}
        <div className="bg-white rounded p-4 border border-slate-200/80 shadow-2xs flex flex-col justify-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Quotation Pipelines</span>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold">
              <CheckCircle className="w-3 h-3" /> {approvedCount} Approved
            </div>
            <div className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[10px] font-bold">
              <Clock className="w-3 h-3" /> {pendingCount} Pending
            </div>
            {rejectedCount > 0 && (
              <div className="flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[10px] font-bold">
                <XCircle className="w-3 h-3" /> {rejectedCount} Void
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Visual Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Trend Area Chart */}
        <div className="bg-white rounded border border-slate-200/80 p-4 shadow-2xs lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xs font-bold font-display text-slate-800">Revenue & Bid Trends</h2>
              <p className="text-[10px] text-slate-400">Monthly breakdown of Swaraj quotation transactions</p>
            </div>
            <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded">FY 2026-27</span>
          </div>
          <div className="h-44 cursor-default">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={9} tickFormatter={(v) => `₹${v/1000}k`} tickLine={false} />
                <Tooltip 
                  formatter={(value: any) => [formatCurrency(value), 'Value Quoted']}
                  contentStyle={{ background: '#0f172a', borderRadius: '4px', color: '#fff', fontSize: '10px', border: 'none' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#2563eb" strokeWidth={1.5} fillOpacity={1} fill="url(#colorAmount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="bg-white rounded border border-slate-200/80 p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-bold font-display text-slate-800">Approval Health</h2>
            <p className="text-[10px] text-slate-400">Current status of issued ERP estimates</p>
          </div>
          
          <div className="h-28 flex items-center justify-center relative my-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={36}
                  outerRadius={48}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center">
              <span className="text-lg font-bold font-display text-slate-700">{totalQuotations}</span>
              <span className="text-[8px] uppercase text-slate-400 tracking-wider">Estimates</span>
            </div>
          </div>

          <div className="space-y-1 border-t border-slate-100 pt-2">
            {statusData.map((entry, idx) => (
              <div key={idx} className="flex items-center justify-between text-[10px] text-slate-600">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                  <span>{entry.name}</span>
                </div>
                <span className="font-semibold font-mono">{entry.value} ({totalQuotations > 0 ? Math.round((entry.value/totalQuotations)*100) : 0}%)</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom split: Recent list + Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        
        {/* Recent Quotation list */}
        <div className="bg-white rounded border border-slate-200/80 p-4 shadow-2xs lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xs font-bold font-display text-slate-800">Recent Quotations</h2>
              <p className="text-[10px] text-slate-400">Click to preview, edit, or output A4 documents</p>
            </div>
            <Layers className="w-3.5 h-3.5 text-slate-400" />
          </div>

          <div className="divide-y divide-slate-100 max-h-[220px] overflow-y-auto pr-1">
            {quotations.map((quote) => {
              const matchedCustomer = customers.find(c => c.id === quote.customerId);
              const isGroup = quote.type === 'Group-Wise';
              return (
                <div 
                  key={quote.id} 
                  className="py-1.5 flex items-center justify-between hover:bg-slate-50 px-1.5 rounded transition cursor-pointer"
                  onClick={() => onSelectQuotation(quote.id)}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-[11px] text-slate-900">{quote.id}</span>
                      <span className={`text-[8px] px-1.5 py-0.2 rounded-sm font-bold ${isGroup ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                        {quote.type}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-semibold">{matchedCustomer?.name || 'Unknown Client'} ({matchedCustomer?.companyName || 'Retail'})</div>
                  </div>

                  <div className="text-right space-y-0.5">
                    <div className="text-[11px] font-bold font-mono text-slate-905">{formatCurrency(calculateQuotationTotal(quote))}</div>
                    <div>
                      {quote.status === 'Approved' && (
                        <span className="text-[8px] bg-emerald-50 text-emerald-600 px-1 py-0.2 rounded font-bold">Approved</span>
                      )}
                      {quote.status === 'Pending' && (
                        <span className="text-[8px] bg-amber-50 text-amber-700 px-1 py-0.2 rounded font-bold">Pending</span>
                      )}
                      {quote.status === 'Rejected' && (
                        <span className="text-[8px] bg-rose-50 text-rose-600 px-1 py-0.2 rounded font-bold">Void</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {quotations.length === 0 && (
              <div className="text-center py-6 text-slate-400 text-[10px] italic">
                No active quotations present. Click "New Quotation" to construct your first ERP estimate.
              </div>
            )}
          </div>
        </div>

        {/* Audit Logs panel */}
        <div className="bg-white rounded border border-slate-200/80 p-4 shadow-2xs lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xs font-bold font-display text-slate-800">ERP Audit Trails</h2>
              <p className="text-[10px] text-slate-400">History of state modifications</p>
            </div>
            <RefreshCw className="w-3 h-3 text-slate-400 animate-spin-slow" />
          </div>

          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {auditLogs.map((log) => (
              <div key={log.id} className="text-[9px] space-y-0.5 bg-slate-50 p-2 rounded border border-slate-100">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="font-mono text-[8px]">{log.timestamp}</span>
                  <span className="bg-slate-200/60 text-slate-700 px-1 py-0.2 rounded font-extrabold text-[8px]">{log.action}</span>
                </div>
                <div className="font-bold text-slate-750">{log.details}</div>
                <div className="text-slate-400 italic text-[8px]">By {log.user.split(' ')[0]}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
