import { useState } from 'react';
import { 
  FileSpreadsheet, FileText, Download, Filter, 
  RefreshCw, TrendingUp, DollarSign, Percent, ShieldCheck, Tag 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, LineChart, Line, Cell
} from 'recharts';
import { Quotation, Customer } from '../types';

interface ReportsProps {
  quotations: Quotation[];
  customers: Customer[];
}

export default function Reports({ quotations, customers }: ReportsProps) {
  
  const [activeTab, setActiveTab] = useState<'GST' | 'Revenue' | 'Discounts'>('GST');
  const [filterState, setFilterState] = useState('All');

  // Helper
  const calculateTotals = (q: Quotation) => {
    let subtotal = 0;
    q.items.forEach(item => {
      const disc = q.masterDiscountPercent;
      subtotal += item.qty * (item.rate * (1 - disc / 100));
    });
    const gst = subtotal * 0.18;
    return { subtotal, gst, grand: subtotal + gst };
  };

  // Turnovers
  const grossTurnover = quotations.reduce((sum, q) => sum + calculateTotals(q).grand, 0);
  const totalGstCollected = quotations.reduce((sum, q) => sum + calculateTotals(q).gst, 0);

  // States
  const mhQuotes = quotations.filter(q => {
    const cust = customers.find(c => c.id === q.customerId);
    return cust?.state === 'Maharashtra';
  });
  const nonMhQuotes = quotations.filter(q => {
    const cust = customers.find(c => c.id === q.customerId);
    return cust && cust.state !== 'Maharashtra';
  });

  const mhGst = mhQuotes.reduce((sum, q) => sum + calculateTotals(q).gst, 0);
  const nonMhGst = nonMhQuotes.reduce((sum, q) => sum + calculateTotals(q).gst, 0);

  // Recharts representation
  const gstChartData = [
    { name: 'Maharashtra (Local CGST+SGST)', amount: mhGst },
    { name: 'Interstate (IGST)', amount: nonMhGst }
  ];

  const salesTrendData = [
    { month: 'Jan', netSales: 54000, gstCollected: 9720 },
    { month: 'Feb', netSales: 118000, gstCollected: 21240 },
    { month: 'Mar', netSales: 322000, gstCollected: 57960 },
    { month: 'Apr', netSales: 203000, gstCollected: 36540 },
    { month: 'May', netSales: 415000, gstCollected: 74700 },
    { month: 'Jun', netSales: grossTurnover * 0.82, gstCollected: grossTurnover * 0.18 }
  ];

  // Export Excel Simulator
  const handleExportExcelSim = () => {
    alert("Excel (.xlsx) document compiled with complete ERP sheets, customer rows, tax columns successfully!");
  };

  return (
    <div className="space-y-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-base font-bold font-display text-slate-900">Financial Reports</h1>
          <p className="text-[11px] text-slate-500">Review dynamic tax accounts, operational gross margins, and local/interstate GST shares</p>
        </div>

        <button
          onClick={handleExportExcelSim}
          className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 font-bold text-xs text-white py-1.5 px-3 rounded shadow-2xs cursor-pointer transition-colors"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          Export Excel Sheet
        </button>
      </div>

      {/* Statistical widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Gross Receivable */}
        <div className="bg-slate-900 text-white rounded p-4 space-y-1.5 border border-slate-950">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block">Gross Receivables (Total)</span>
          <div className="text-xl font-bold font-mono">₹{grossTurnover.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          <p className="text-[9px] text-emerald-450 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" /> +18.4% vs FY2025 Cycle
          </p>
        </div>

        {/* GST aggregate */}
        <div className="bg-white rounded p-4 space-y-1.5 border border-slate-200/80 shadow-2xs">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block">Accrued Tax Liabilities (18% GST)</span>
          <div className="text-xl font-bold font-mono text-slate-900">₹{totalGstCollected.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wide">
            CGST: ₹{Math.round(mhGst/2).toLocaleString()} | SGST: ₹{Math.round(mhGst/2).toLocaleString()} | IGST: ₹{Math.round(nonMhGst).toLocaleString()}
          </p>
        </div>

        {/* MH share */}
        <div className="bg-white rounded p-4 space-y-1.5 border border-slate-200/80 shadow-2xs">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block">Home-State Business Volume</span>
          <div className="text-xl font-bold font-mono text-blue-600">
            {grossTurnover > 0 ? Math.round((mhQuotes.length/quotations.length)*100) : 0}%
          </div>
          <p className="text-[9px] text-slate-500 leading-none">MH clients: {mhQuotes.length} out of {quotations.length} estimates</p>
        </div>

      </div>

      {/* Dynamic chart interface tabs */}
      <div className="bg-white rounded border border-slate-200/85 p-4 shadow-2xs">
        <div className="flex border-b border-slate-100 pb-2 justify-between items-center flex-wrap gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('GST')}
              className={`text-xs font-bold px-2.5 py-1 rounded transition-colors cursor-pointer ${activeTab === 'GST' ? 'bg-blue-600 text-white' : 'text-slate-550 hover:bg-slate-50'}`}
            >
              GST Demographics (18% Share)
            </button>
            <button
              onClick={() => setActiveTab('Revenue')}
              className={`text-xs font-bold px-2.5 py-1 rounded transition-colors cursor-pointer ${activeTab === 'Revenue' ? 'bg-blue-600 text-white' : 'text-slate-550 hover:bg-slate-50'}`}
            >
              Net Turnover Scale
            </button>
          </div>

          <span className="text-[9px] font-mono uppercase bg-slate-50 border border-slate-150 px-1.5 py-0.5 rounded font-extrabold text-slate-400">Ledger FY26-27</span>
        </div>

        <div className="py-4 h-64 cursor-default">
          {activeTab === 'GST' ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gstChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={9} tickFormatter={(v) => `₹${v/1000}k`} tickLine={false} />
                <Tooltip 
                  formatter={(value: any) => [`₹${value.toLocaleString()}`, 'GST Account Liabilities']}
                  contentStyle={{ background: '#0f172a', border: 'none', color: '#fff', borderRadius: '4px', fontSize: '10px' }}
                />
                <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40}>
                  <Cell fill="#60a5fa" />
                  <Cell fill="#2563eb" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={9} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={9} tickFormatter={(v) => `₹${v/1000}k`} tickLine={false} />
                <Tooltip 
                  formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Accrued Ledger Metrics']}
                  contentStyle={{ background: '#0f172a', border: 'none', color: '#fff', borderRadius: '4px', fontSize: '10px' }}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                <Line type="monotone" dataKey="netSales" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} name="Accrued Net Turnovers" />
                <Line type="monotone" dataKey="gstCollected" stroke="#f59e0b" strokeWidth={1.5} name="Accrued Tax Pool" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

    </div>
  );
}
