import { useState, useEffect } from 'react';
import { 
  Plus, Search, Grid, Users, FileText, BarChart2, 
  Settings as SettingsIcon, Shield, ShieldAlert, Sparkles, 
  RefreshCw, Layers, CheckCircle, Clock, Trash2, Edit2, Eye, Calendar, MapPin, Copy
} from 'lucide-react';

import { 
  UserRole, CompanyProfile, Customer, Quotation, 
  AuditLog, TermCondition, MaterialSpecs, BankDetails, ERPUser 
} from './types';

import { 
  DEFAULT_COMPANY_PROFILE, DEFAULT_MATERIAL_SPECS, 
  DEFAULT_BANK_DETAILS, DEFAULT_TERMS, MOCK_CUSTOMERS, 
  MOCK_QUOTATIONS, MOCK_AUDIT_LOGS, INDIAN_STATES, normalizeBankDetails 
} from './mockData';

// Subcomponents import
import Dashboard from './components/Dashboard';
import CustomerManager from './components/CustomerManager';
import QuotationBuilder from './components/QuotationBuilder';
import A4Preview from './components/A4Preview';
import Reports from './components/Reports';
import Settings from './components/Settings';
import Login from './components/Login';

const INITIAL_USERS: ERPUser[] = [
  { id: 'u-1', username: 'Admin', passwordHash: '944360', role: 'Admin' },
  { id: 'u-2', username: 'Akash', passwordHash: 'Akash@123', role: 'Accountant' },
  { id: 'u-3', username: 'Aniket', passwordHash: 'Aniket@321', role: 'Designer' },
  { id: 'u-4', username: 'Shubham', passwordHash: 'Shubham@789', role: 'Sales' },
  { id: 'u-5', username: 'Viewer', passwordHash: 'V@123', role: 'Viewer' },
  { id: 'u-6', username: 'Amar', passwordHash: 'Amar@$123', role: 'General Manager' }
];

// Helper function to robustly load and merge state from localStorage
function getLocalStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return defaultValue;
    const parsed = JSON.parse(saved);
    if (Array.isArray(defaultValue)) {
      return (Array.isArray(parsed) ? parsed : defaultValue) as unknown as T;
    }
    if (typeof parsed === 'object' && parsed !== null && typeof defaultValue === 'object' && defaultValue !== null) {
      return { ...defaultValue, ...parsed } as unknown as T;
    }
    return parsed as unknown as T;
  } catch (e) {
    console.error(`Error loading localStorage key "${key}":`, e);
    return defaultValue;
  }
}

export default function App() {
  
  // Authenticated operator state
  const [users, setUsers] = useState<ERPUser[]>(() => 
    getLocalStorageItem<ERPUser[]>('fqmp_users', INITIAL_USERS)
  );

  const [currentUser, setCurrentUser] = useState<ERPUser | null>(() => {
    try {
      const saved = localStorage.getItem('fqmp_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Derived role for backwards compatibility containing the same reactive triggers
  const role = currentUser?.role || 'Viewer';

  // Custom visual non-blocking Toast notification state to replace window.alert
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' } | null>(null);

  useEffect(() => {
    try {
      const originalAlert = window.alert;
      const originalConfirm = window.confirm;

      window.alert = (message: any) => {
        console.log("Iframe Alert intercepted:", message);
        setToast({ message: String(message), type: 'info' });
      };

      window.confirm = (message: any) => {
        console.log("Iframe Confirm intercepted (auto-approved):", message);
        return true;
      };

      return () => {
        try {
          window.alert = originalAlert;
          window.confirm = originalConfirm;
        } catch (err) {
          console.error("Failed to restore original alert/confirm", err);
        }
      };
    } catch (e) {
      console.warn("Failed to intercept window.alert and window.confirm due to sandbox constraints.", e);
    }
  }, []);

  // Clear toast automatically after 4 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // CORE ERP STATES, preloaded & synced with LocalStorage
  const [company, setCompany] = useState<CompanyProfile>(() => {
    const loaded = getLocalStorageItem<CompanyProfile>('fqmp_company', DEFAULT_COMPANY_PROFILE);
    if (loaded && loaded.name === 'Swaraj Enterprises') {
      return {
        ...loaded,
        name: DEFAULT_COMPANY_PROFILE.name
      };
    }
    return loaded;
  });

  const [specs, setSpecs] = useState<MaterialSpecs>(() => {
    const loaded = getLocalStorageItem<any>('fqmp_specs', DEFAULT_MATERIAL_SPECS);
    if (loaded && !Array.isArray(loaded)) {
      return [
        { id: 'spec-1', text: `Plywood Core: ${loaded.plywood || ''}`, checked: true },
        { id: 'spec-2', text: `External Laminate: ${loaded.externalLaminate || ''}`, checked: true },
        { id: 'spec-3', text: `Internal Backer: ${loaded.internalLaminate || ''}`, checked: true },
        { id: 'spec-4', text: `Hardware Fitting: ${loaded.hardware || ''}`, checked: true },
        { id: 'spec-5', text: `Laminate Brands: ${loaded.laminateBrand || ''}`, checked: true }
      ].filter(item => item.text && item.text.split(': ')[1]?.trim().length > 0);
    }
    return loaded;
  });

  const [bank, setBank] = useState<BankDetails>(() => 
    normalizeBankDetails(getLocalStorageItem<any>('fqmp_bank', DEFAULT_BANK_DETAILS))
  );

  const [terms, setTerms] = useState<TermCondition[]>(() => 
    getLocalStorageItem<TermCondition[]>('fqmp_terms', DEFAULT_TERMS)
  );

  const [customers, setCustomers] = useState<Customer[]>(() => 
    getLocalStorageItem<Customer[]>('fqmp_customers', MOCK_CUSTOMERS)
  );

  const [quotations, setQuotations] = useState<Quotation[]>(() => {
    const loaded = getLocalStorageItem<Quotation[]>('fqmp_quotations', MOCK_QUOTATIONS);
    if (loaded && Array.isArray(loaded)) {
      return loaded.map(q => {
        if (q.materialSpecs && !Array.isArray(q.materialSpecs)) {
          const old = q.materialSpecs as any;
          q.materialSpecs = [
            { id: 'spec-1', text: `Plywood Core: ${old.plywood || ''}`, checked: true },
            { id: 'spec-2', text: `External Laminate: ${old.externalLaminate || ''}`, checked: true },
            { id: 'spec-3', text: `Internal Backer: ${old.internalLaminate || ''}`, checked: true },
            { id: 'spec-4', text: `Hardware Fitting: ${old.hardware || ''}`, checked: true },
            { id: 'spec-5', text: `Laminate Brands: ${old.laminateBrand || ''}`, checked: true }
          ].filter(item => item.text && item.text.split(': ')[1]?.trim().length > 0);
        }
        // Migrate any legacy single-account bank shape into the multi-account structure
        q.bankDetails = normalizeBankDetails(q.bankDetails);
        return q;
      });
    }
    return loaded;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => 
    getLocalStorageItem<AuditLog[]>('fqmp_logs', MOCK_AUDIT_LOGS)
  );

  // Navigation: 'dashboard' | 'quotations' | 'customers' | 'reports' | 'settings'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'quotations' | 'customers' | 'reports' | 'settings'>('dashboard');
  
  // Creation/Edit/Preview sub-states
  const [isCreatingQuotation, setIsCreatingQuotation] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
  const [previewingQuotation, setPreviewingQuotation] = useState<Quotation | null>(null);

  // Search filter inside master Quotations Tab
  const [quoteSearch, setQuoteSearch] = useState('');
  const [quoteStateFilter, setQuoteStateFilter] = useState('All');

  // Set the browser tab title for the portal
  useEffect(() => {
    document.title = 'Swaraj Furniture Quotation Portal';
  }, []);

  // Sync to LocalStorage on state modifications
  useEffect(() => {
    localStorage.setItem('fqmp_company', JSON.stringify(company));
  }, [company]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('fqmp_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('fqmp_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('fqmp_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('fqmp_specs', JSON.stringify(specs));
  }, [specs]);

  useEffect(() => {
    localStorage.setItem('fqmp_bank', JSON.stringify(bank));
  }, [bank]);

  useEffect(() => {
    localStorage.setItem('fqmp_terms', JSON.stringify(terms));
  }, [terms]);

  useEffect(() => {
    localStorage.setItem('fqmp_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('fqmp_quotations', JSON.stringify(quotations));
  }, [quotations]);

  useEffect(() => {
    localStorage.setItem('fqmp_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Log ERP actions to audit trail
  const appendAuditLog = (action: string, details: string) => {
    const newLog: AuditLog = {
      id: `l-${Date.now()}`,
      timestamp: new Date().toLocaleDateString('en-IN') + ' ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      user: `active-role@swaraj.in (${role})`,
      action,
      details
    };
    setAuditLogs([newLog, ...auditLogs]);
  };

  // HANDLERS
  const handleSaveQuotation = (q: Quotation) => {
    const existing = quotations.find(item => item.id === q.id);
    // Freeze the company profile at first save and preserve it across edits, so
    // later changes to company name/logo/stamp/bank never alter older quotations.
    const frozen: Quotation = {
      ...q,
      companySnapshot: existing?.companySnapshot || q.companySnapshot || { ...company }
    };
    let updated: Quotation[];
    if (existing) {
      updated = quotations.map(item => item.id === q.id ? frozen : item);
      appendAuditLog('UPDATE_QUOTATION', `Updated quotation details for ${q.id}.`);
    } else {
      updated = [frozen, ...quotations];
      appendAuditLog('CREATE_QUOTATION', `Created and published quotation ${q.id}.`);
    }
    setQuotations(updated);
    setIsCreatingQuotation(false);
    setEditingQuotation(null);
  };

  const handleDeleteQuotation = (id: string) => {
    if (role !== 'Admin') {
      alert("Only an Administrator can delete quotation sheets.");
      return;
    }
    if (confirm(`Are you sure you want to delete quotation ${id}? This action is irreversible.`)) {
      setQuotations(quotations.filter(q => q.id !== id));
      appendAuditLog('DELETE_QUOTATION', `Deleted quotation ${id}.`);
    }
  };

  const handleUpdateCompany = (updated: CompanyProfile) => {
    setCompany(updated);
    appendAuditLog('UPDATE_COMPANY', `Swaraj Enterprises company profiles and authorized signatures updated.`);
  };

  const handleUpdateSpecs = (updated: MaterialSpecs) => {
    setSpecs(updated);
    appendAuditLog('UPDATE_SPECS', `Default manufacturing materials sheets updated.`);
  };

  const handleUpdateBank = (updated: BankDetails) => {
    setBank(updated);
    appendAuditLog('UPDATE_BANK', `Corporate wire bank accounts details updated.`);
  };

  const handleUpdateTerms = (updated: TermCondition[]) => {
    setTerms(updated);
    appendAuditLog('UPDATE_TERMS', `Default standard terms and conditions sheets updated.`);
  };

  const handleDuplicateQuotation = (quote: Quotation) => {
    if (role === 'Viewer') {
      alert("A Viewer account is restricted from duplicating quotation requests.");
      return;
    }

    const year = new Date().getFullYear();
    const swrjQuotes = quotations.filter(q => q.id.startsWith(`SWRJ-${year}-`));
    let nextId = `SWRJ-${year}-0001`;
    if (swrjQuotes.length > 0) {
      const sortedQuotes = [...swrjQuotes].sort((a, b) => b.id.localeCompare(a.id));
      const lastNumStr = sortedQuotes[0].id.split('-').pop();
      const lastNum = parseInt(lastNumStr || '0', 10);
      nextId = `SWRJ-${year}-${String(lastNum + 1).padStart(4, '0')}`;
    }

    const duplicated: Quotation = {
      ...quote,
      id: nextId,
      refNumber: 'SE-PR-' + Math.floor(1000 + Math.random() * 9000),
      date: new Date().toISOString().split('T')[0],
      validityDate: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        return d.toISOString().split('T')[0];
      })(),
      status: 'Pending',
      items: quote.items.map(item => ({
        ...item,
        id: 'it-' + Date.now() + '-' + Math.floor(Math.random() * 1000)
      }))
    };

    setQuotations([duplicated, ...quotations]);
    appendAuditLog('DUPLICATE_QUOTATION', `Duplicated quotation ${duplicated.id} from existing ${quote.id}.`);
    alert(`Quotation ${quote.id} successfully duplicated as a new draft: ${duplicated.id}`);
  };

  // Quoted pricing sum
  const getQuoteTotalValue = (q: Quotation) => {
    let sub = 0;
    q.items.forEach(it => {
      const activeDisc = q.masterDiscountPercent;
      sub += it.qty * (it.rate * (1 - activeDisc / 100));
    });
    // Apply standard 18% GST unless this quotation is explicitly marked GST-free
    return q.gstEnabled === false ? sub : sub * 1.18;
  };

  // Restricted array of quotations based on active user operator rights
  const restrictedQuotations = quotations.filter(q => {
    if (role === 'Accountant' || role === 'Designer' || role === 'Sales') {
      return q.createdBy === currentUser?.username;
    }
    return true;
  });

  const restrictedAuditLogs = auditLogs.filter(log => {
    if (role === 'Accountant' || role === 'Designer' || role === 'Sales') {
      return log.user?.includes(`(${currentUser?.username})`) || log.user?.includes(currentUser?.username || '---');
    }
    return true;
  });

  // Filtered quotes list
  const filteredQuotations = restrictedQuotations.filter(q => {
    const cust = customers.find(c => c.id === q.customerId);
    const matchesSearch = q.id.toLowerCase().includes(quoteSearch.toLowerCase()) ||
                          (cust && cust.name.toLowerCase().includes(quoteSearch.toLowerCase())) ||
                          (cust && cust.mobile.includes(quoteSearch));
    
    if (quoteStateFilter === 'All') return matchesSearch;
    if (quoteStateFilter === 'Maharashtra') return matchesSearch && cust?.state === 'Maharashtra';
    return matchesSearch && cust?.state !== 'Maharashtra';
  });

  if (!currentUser) {
    return (
      <Login 
        users={users} 
        onLoginSuccess={(u) => {
          setCurrentUser(u);
          // Set a pleasant toast notification
          setToast({ message: `Welcome back, ${u.username}! Operator console initiated.`, type: 'success' });
        }}
        companyName={company.name}
        companyLogo={company.logo || ''}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      
      {/* Main split: Sidebar + Content Frame */}
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-56 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 p-3 shrink-0 no-print">
          
          {/* Logo Branding */}
          <div className="flex items-center gap-2 py-2 border-b border-slate-800 mb-4 px-1">
            <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center text-white font-black text-sm shadow-inner">
              SW
            </div>
            <div>
              <span className="text-xs font-bold font-display text-white block leading-none">SWARAJ ERP</span>
              <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold block mt-0.5">Quotation Portal</span>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="space-y-0.5">
            <button
              onClick={() => { setActiveTab('dashboard'); setIsCreatingQuotation(false); setEditingQuotation(null); setPreviewingQuotation(null); }}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded text-xs font-semibold cursor-pointer transition ${activeTab === 'dashboard' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-800 hover:text-slate-200'}`}
            >
              <Grid className="w-3.5 h-3.5" />
              Overview Dashboard
            </button>

            <button
              onClick={() => { setActiveTab('quotations'); setIsCreatingQuotation(false); setEditingQuotation(null); setPreviewingQuotation(null); }}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded text-xs font-semibold cursor-pointer transition ${activeTab === 'quotations' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-800 hover:text-slate-200'}`}
            >
              <FileText className="w-3.5 h-3.5" />
              Manage Quotations
            </button>

            <button
              onClick={() => { setActiveTab('customers'); setIsCreatingQuotation(false); setEditingQuotation(null); setPreviewingQuotation(null); }}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded text-xs font-semibold cursor-pointer transition ${activeTab === 'customers' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-800 hover:text-slate-200'}`}
            >
              <Users className="w-3.5 h-3.5" />
              Clients Directory
            </button>

            <button
              onClick={() => { setActiveTab('reports'); setIsCreatingQuotation(false); setEditingQuotation(null); setPreviewingQuotation(null); }}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded text-xs font-semibold cursor-pointer transition ${activeTab === 'reports' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-800 hover:text-slate-200'}`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              Financial Ledger Reports
            </button>

            <button
              onClick={() => { setActiveTab('settings'); setIsCreatingQuotation(false); setEditingQuotation(null); setPreviewingQuotation(null); }}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded text-xs font-semibold cursor-pointer transition ${activeTab === 'settings' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-800 hover:text-slate-200'}`}
            >
              <SettingsIcon className="w-3.5 h-3.5" />
              ERP Custom Settings
            </button>
          </nav>

          {/* User Account Capsule at bottom of sidebar */}
          <div className="mt-auto border-t border-slate-800/80 pt-3 px-1 space-y-1.5 font-sans select-none">
            <div className="flex gap-2 items-center bg-slate-950 p-2 rounded border border-slate-800">
              <div className="w-6 h-6 rounded bg-[#1E3A8A] text-white flex items-center justify-center font-bold text-xs uppercase shadow-inner">
                {currentUser?.username ? currentUser.username[0].toUpperCase() : 'O'}
              </div>
              <div className="truncate flex-1">
                <span className="text-[10px] font-bold text-slate-100 block leading-none">{currentUser?.username}</span>
                <span className="text-[8px] text-blue-400 font-bold font-mono mt-0.5 block uppercase tracking-wider">{role}</span>
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => {
                if (confirm("Are you sure you want to sign-out and lock this ERP operator terminal?")) {
                  setCurrentUser(null);
                }
              }}
              className="w-full bg-slate-800 hover:bg-slate-700/80 active:bg-slate-900 border border-slate-700 text-slate-300 rounded p-1.5 text-[9px] font-extrabold uppercase tracking-widest transition cursor-pointer text-center"
            >
              Sign Out / Lock
            </button>
          </div>
        </aside>

        {/* Core Content Body frame */}
        <main className="flex-1 p-4 md:p-5 overflow-y-auto bg-slate-100/30">
          
          {/* Conditional Sub-screens Rendering */}

          {/* Subscreen A: active A4 PDF print preview */}
          {previewingQuotation ? (
            <A4Preview
              quotation={previewingQuotation}
              customers={customers}
              companyProfile={company}
              onBack={() => setPreviewingQuotation(null)}
            />
          ) : isCreatingQuotation || editingQuotation ? (
            /* Subscreen B: create or edit builder */
            <QuotationBuilder
              customers={customers}
              existingQuotations={quotations}
              initialQuotationToEdit={editingQuotation}
              onSaveQuotation={handleSaveQuotation}
              onCancel={() => { setIsCreatingQuotation(false); setEditingQuotation(null); }}
              masterSpecs={specs}
              masterTerms={terms}
              masterBank={bank}
              operatorName={currentUser?.username}
              onAddCustomer={(newCust) => {
                setCustomers([newCust, ...customers]);
                appendAuditLog('ADD_CUSTOMER', `Linked new customer account profile for ${newCust.name} directly from quotation builder.`);
              }}
            />
          ) : (
            /* Standard Primary Navigation Tabs */
            <>
              {activeTab === 'dashboard' && (
                <Dashboard
                  quotations={restrictedQuotations}
                  customers={customers}
                  auditLogs={restrictedAuditLogs}
                  onCreateNew={() => {
                    if (role === 'Viewer') {
                      alert("A Viewer account is restricted from creating quotation requests.");
                      return;
                    }
                    setIsCreatingQuotation(true);
                  }}
                  onSelectQuotation={(id) => {
                    const q = restrictedQuotations.find(item => item.id === id);
                    if (q) setPreviewingQuotation(q);
                  }}
                  onNavigateToCustomers={() => setActiveTab('customers')}
                />
              )}

              {activeTab === 'quotations' && (
                <div className="space-y-4 animate-fade-in">
                  
                  {/* Tab header bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
                    <div>
                      <h1 className="text-base font-bold font-display text-slate-900">Manage Quotations</h1>
                      <p className="text-[11px] text-slate-500">Add, edit, or output A4 receipts directly linked with continuous sequence codes</p>
                    </div>

                    {role !== 'Viewer' && (
                      <button
                        onClick={() => setIsCreatingQuotation(true)}
                        className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded text-xs transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Create Quotation
                      </button>
                    )}
                  </div>

                  {/* Search and state filters controls */}
                  <div className="bg-white rounded border border-slate-200 p-2.5 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded text-xs w-full sm:max-w-md">
                      <Search className="w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search Quote ID, client, mobile or reference..."
                        value={quoteSearch}
                        onChange={(e) => setQuoteSearch(e.target.value)}
                        className="w-full focus:outline-none bg-transparent text-xs"
                      />
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                      <select
                        value={quoteStateFilter}
                        onChange={(e) => setQuoteStateFilter(e.target.value)}
                        className="text-xs border border-slate-200 p-1.5 rounded bg-white w-full sm:w-auto font-semibold text-slate-700"
                      >
                        <option value="All">All States (GST context)</option>
                        <option value="Maharashtra">Maharashtra (Local CGST+SGST)</option>
                        <option value="Interstate">Interstate (IGST 18%)</option>
                      </select>
                    </div>
                  </div>

                  {/* Spreadsheet Grid list */}
                  <div className="bg-white rounded border border-slate-200 shadow-2xs overflow-hidden text-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-55 bg-slate-50 text-slate-550 uppercase text-[9px] tracking-wider font-extrabold border-b border-slate-200">
                            <th className="py-2 px-3 w-28">Quote ID</th>
                            <th className="py-2 px-3 w-32">Date Ref</th>
                            <th className="py-2 px-3">Customer Entity</th>
                            <th className="py-2 px-3 w-28 text-center">Type</th>
                            <th className="py-2 px-3 w-28 text-right">Items / Volume</th>
                            <th className="py-2 px-3 w-24 text-center">Status</th>
                            <th className="py-2 px-3 w-36 text-center">Operations</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                          {filteredQuotations.map((quote) => {
                            const matchedCust = customers.find(c => c.id === quote.customerId);
                            const totalAmount = getQuoteTotalValue(quote);
                            const isGroup = quote.type === 'Group-Wise';

                            return (
                              <tr key={quote.id} className="hover:bg-slate-55/60 hover:bg-slate-50/50">
                                
                                {/* ID */}
                                <td className="py-2 px-3 font-mono font-bold text-slate-900">{quote.id}</td>
                                
                                {/* Dates */}
                                <td className="py-2 px-3 font-mono text-[10px] leading-relaxed">
                                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-slate-400" /> {quote.date}</span>
                                </td>

                                {/* Client detail block */}
                                <td className="py-2 px-3">
                                  <div>
                                    <span className="font-bold text-slate-800 block">{matchedCust?.name || 'Retail Drawer'}</span>
                                    {matchedCust?.companyName && (
                                      <span className="text-[9px] text-slate-400 block mt-0.5">Company: {matchedCust.companyName}</span>
                                    )}
                                  </div>
                                </td>

                                {/* Type */}
                                <td className="py-2 px-3 text-center">
                                  <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-sm ${isGroup ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-650'}`}>
                                    {quote.type}
                                  </span>
                                </td>

                                {/* Amount Turnovers */}
                                <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                                  <div>₹{totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                                  <span className="text-[9px] text-slate-400 font-medium leading-none block mt-0.5">{quote.items.length} segments list</span>
                                </td>

                                {/* Status */}
                                <td className="py-2 px-3 text-center">
                                  {quote.status === 'Approved' && (
                                    <span className="text-[9px] bg-emerald-55 text-emerald-700 font-bold px-1.5 py-0.5 rounded uppercase">Approved</span>
                                  )}
                                  {quote.status === 'Pending' && (
                                    <span className="text-[9px] bg-amber-55 text-amber-800 font-bold px-1.5 py-0.5 rounded uppercase">Pending</span>
                                  )}
                                  {quote.status === 'Rejected' && (
                                    <span className="text-[9px] bg-rose-55 text-rose-700 font-bold px-1.5 py-0.5 rounded uppercase">Void</span>
                                  )}
                                </td>

                                {/* Action Buttons */}
                                <td className="py-2 px-3">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      onClick={() => setPreviewingQuotation(quote)}
                                      className="p-1 hover:bg-slate-100 rounded text-slate-700 transition cursor-pointer"
                                      title="View A4 PDF layout"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>

                                    {role !== 'Viewer' && (
                                      <>
                                        <button
                                          onClick={() => setEditingQuotation(quote)}
                                          className="p-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition cursor-pointer"
                                          title="Edit Draft Specification"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" />
                                        </button>

                                        <button
                                          onClick={() => handleDuplicateQuotation(quote)}
                                          className="p-1 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition cursor-pointer"
                                          title="Duplicate Quotation (Create Copy)"
                                        >
                                          <Copy className="w-3.5 h-3.5" />
                                        </button>
                                      </>
                                    )}

                                    {role === 'Admin' && (
                                      <button
                                        onClick={() => handleDeleteQuotation(quote.id)}
                                        className="p-1.5 bg-rose-50 rounded-lg hover:bg-rose-100 text-rose-650 transition cursor-pointer"
                                        title="Delete sheets metadata"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </td>

                              </tr>
                            );
                          })}

                          {filteredQuotations.length === 0 && (
                            <tr>
                              <td colSpan={7} className="text-center py-12 text-slate-400 italic">
                                No quotation sheets found matching search criteria.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

              {activeTab === 'customers' && (
                <CustomerManager
                  customers={customers}
                  userRole={role}
                  onAddCustomer={(c) => {
                    setCustomers([c, ...customers]);
                    appendAuditLog('ADD_CUSTOMER', `Linked new customer account profile for ${c.name}.`);
                  }}
                  onUpdateCustomer={(c) => {
                    setCustomers(customers.map(item => item.id === c.id ? c : item));
                    appendAuditLog('UPDATE_CUSTOMER', `Updated master profiles details for ${c.name}.`);
                  }}
                  onDeleteCustomer={(id) => {
                    const find = customers.find(c => c.id === id);
                    setCustomers(customers.filter(c => c.id !== id));
                    appendAuditLog('DELETE_CUSTOMER', `Deleted customer entity ${find?.name || id}.`);
                  }}
                />
              )}

              {activeTab === 'reports' && (
                <Reports
                  quotations={restrictedQuotations}
                  customers={customers}
                />
              )}

              {activeTab === 'settings' && (
                <Settings
                  companyProfile={company}
                  materialSpecs={specs}
                  bankDetails={bank}
                  onUpdateCompany={handleUpdateCompany}
                  onUpdateSpecs={handleUpdateSpecs}
                  onUpdateBank={handleUpdateBank}
                  users={users}
                  onUpdateUsers={setUsers}
                  currentUserRole={role}
                  masterTerms={terms}
                  onUpdateTerms={handleUpdateTerms}
                />
              )}
            </>
          )}

        </main>

      </div>

      {/* Interactive Beautiful Float Toast Interceptor for Iframe sandboxes */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-[9999] bg-slate-900 text-white rounded border border-slate-700 shadow-xl p-3.5 max-w-xs md:max-w-sm flex items-start gap-2.5 animate-fade-in no-print">
          <div className="p-1 bg-blue-500 rounded text-white shrink-0 mt-0.5 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 text-xs">
            <p className="font-bold text-slate-100">System Alert</p>
            <p className="text-slate-300 mt-0.5 leading-relaxed font-sans">{toast.message}</p>
          </div>
          <button 
            type="button" 
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-white font-bold text-sm p-0.5 leading-none focus:outline-none cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

    </div>
  );
}
