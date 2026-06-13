import { useState, FormEvent } from 'react';
import { Search, UserPlus, Trash2, Edit2, MapPin, Phone, Mail, Building, Plus } from 'lucide-react';
import { Customer, UserRole } from '../types';
import { INDIAN_STATES } from '../mockData';

interface CustomerManagerProps {
  customers: Customer[];
  userRole: UserRole;
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
}

export default function CustomerManager({
  customers,
  userRole,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer
}: CustomerManagerProps) {
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [activeCustomer, setActiveCustomer] = useState<Partial<Customer> | null>(null);

  // Filtered lists
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.mobile.includes(searchTerm) ||
    c.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const startNewCustomer = () => {
    if (userRole === 'Viewer') return;
    setActiveCustomer({
      id: `c-${Date.now()}`,
      name: '',
      companyName: '',
      address: '',
      city: '',
      state: 'Maharashtra',
      pincode: '',
      mobile: '',
      email: '',
      gstin: ''
    });
    setIsEditing(true);
  };

  const handleEditClick = (customer: Customer) => {
    if (userRole === 'Viewer') return;
    setActiveCustomer(customer);
    setIsEditing(true);
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    if (!activeCustomer || !activeCustomer.name || userRole === 'Viewer') return;

    const exists = customers.some(c => c.id === activeCustomer.id);
    if (exists) {
      onUpdateCustomer(activeCustomer as Customer);
    } else {
      onAddCustomer(activeCustomer as Customer);
    }
    setIsEditing(false);
    setActiveCustomer(null);
  };

  const handleDelete = (id: string) => {
    if (userRole !== 'Admin') {
      alert("Only an Administrator can delete master customer catalogs.");
      return;
    }
    if (confirm("Are you sure you want to delete this customer? This will remove them from the ERP directory.")) {
      onDeleteCustomer(id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header and Add Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-base font-bold font-display text-slate-900">Customer Management</h1>
          <p className="text-[11px] text-slate-500">Manage client directory, GST registrations, and physical deployment billing addresses</p>
        </div>

        {userRole !== 'Viewer' && (
          <button
            onClick={startNewCustomer}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded text-xs transition cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Add Customer
          </button>
        )}
      </div>

      {/* Grid Layout: Directory vs. Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        
        {/* Customer Listing Section (LHS) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="bg-white rounded p-2 border border-slate-200 shadow-2xs flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by name, company, phone or Indian state..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs text-slate-800 focus:outline-none bg-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredCustomers.map(customer => (
              <div 
                key={customer.id}
                className="bg-white rounded border border-slate-200 p-3.5 hover:border-slate-350 transition shadow-2xs space-y-2.5 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex justify-between items-start gap-1.5">
                    <div>
                      <h3 className="font-bold font-display text-slate-800 text-xs">{customer.name}</h3>
                      {customer.companyName && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-500 bg-slate-50 px-1.5 py-0.2 rounded mt-0.5">
                          <Building className="w-2.5 h-2.5 text-slate-400" />
                          {customer.companyName}
                        </span>
                      )}
                    </div>
                    <span className={`text-[8px] px-1.5 py-0.2 rounded font-bold uppercase shrink-0 ${customer.state === 'Maharashtra' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' : 'bg-blue-50 text-blue-700 border border-blue-200/50'}`}>
                      {customer.state === 'Maharashtra' ? 'Local CGST+SGST' : 'Interstate IGST'}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-500 space-y-1 pt-1 border-t border-slate-100/50">
                    <p className="flex items-start gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                      <span>{customer.address}, {customer.city}, {customer.state} - {customer.pincode}</span>
                    </p>
                    <p className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{customer.mobile}</span>
                    </p>
                    {customer.email && (
                      <p className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span className="truncate">{customer.email}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-2 flex items-center justify-between mt-auto text-[9px]">
                  <div className="font-mono text-slate-400">
                    GSTIN: <span className="font-bold text-slate-600">{customer.gstin || 'UNREGISTERED'}</span>
                  </div>
                  
                  {userRole !== 'Viewer' && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditClick(customer)}
                        className="p-1 hover:bg-slate-150 rounded bg-slate-50 border border-slate-200 text-slate-650 transition cursor-pointer"
                        title="Edit Customer"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      {userRole === 'Admin' && (
                        <button
                          onClick={() => handleDelete(customer.id)}
                          className="p-1 hover:bg-rose-100 rounded bg-rose-50 border border-rose-200 text-rose-620 transition cursor-pointer"
                          title="Delete Customer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {filteredCustomers.length === 0 && (
              <div className="col-span-full bg-slate-50 rounded border border-dashed border-slate-200 p-6 text-center text-[11px] text-slate-400">
                No customers found matching your keyword. Click "Add Customer" to persist master listings.
              </div>
            )}
          </div>
        </div>

        {/* Edit / Add Side Panel (RHS) */}
        <div className="bg-white rounded border border-slate-200 p-3.5 shadow-2xs">
          {isEditing && activeCustomer ? (
            <form onSubmit={handleSave} className="space-y-3">
              <h2 className="text-xs font-bold font-display text-slate-800 border-b border-slate-100 pb-1.5 uppercase tracking-wider">
                {customers.some(c => c.id === activeCustomer.id) ? 'Modify Client Record' : 'Create Customer'}
              </h2>

              <div className="space-y-0.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={activeCustomer.name || ''}
                  onChange={(e) => setActiveCustomer({ ...activeCustomer, name: e.target.value })}
                  placeholder="e.g. Anand Kulkarni"
                  className="w-full text-xs text-slate-800 border border-slate-200 rounded p-1.5 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-0.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Company / Agency Name</label>
                <input
                  type="text"
                  value={activeCustomer.companyName || ''}
                  onChange={(e) => setActiveCustomer({ ...activeCustomer, companyName: e.target.value })}
                  placeholder="e.g. Kulkarni Builders"
                  className="w-full text-xs text-slate-800 border border-slate-200 rounded p-1.5 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-0.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Mobile *</label>
                  <input
                    type="tel"
                    required
                    value={activeCustomer.mobile || ''}
                    onChange={(e) => setActiveCustomer({ ...activeCustomer, mobile: e.target.value })}
                    placeholder="e.g. 98XXX XXX55"
                    className="w-full text-xs text-slate-800 border border-slate-200 rounded p-1.5 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Email ID</label>
                  <input
                    type="email"
                    value={activeCustomer.email || ''}
                    onChange={(e) => setActiveCustomer({ ...activeCustomer, email: e.target.value })}
                    placeholder="e.g. client@email.com"
                    className="w-full text-xs text-slate-800 border border-slate-200 rounded p-1.5 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-0.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Billing/Site Address *</label>
                <textarea
                  required
                  rows={2}
                  value={activeCustomer.address || ''}
                  onChange={(e) => setActiveCustomer({ ...activeCustomer, address: e.target.value })}
                  placeholder="Street, project site details..."
                  className="w-full text-xs text-slate-800 border border-slate-200 rounded p-1.5 focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-0.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">City *</label>
                  <input
                    type="text"
                    required
                    value={activeCustomer.city || ''}
                    onChange={(e) => setActiveCustomer({ ...activeCustomer, city: e.target.value })}
                    placeholder="e.g. Pune"
                    className="w-full text-xs text-slate-800 border border-slate-200 rounded p-1.5 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Pincode *</label>
                  <input
                    type="text"
                    required
                    value={activeCustomer.pincode || ''}
                    onChange={(e) => setActiveCustomer({ ...activeCustomer, pincode: e.target.value })}
                    placeholder="e.g. 411001"
                    className="w-full text-xs text-slate-800 border border-slate-200 rounded p-1.5 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-0.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">State Code (GST Trigger) *</label>
                <select
                  value={activeCustomer.state || 'Maharashtra'}
                  onChange={(e) => setActiveCustomer({ ...activeCustomer, state: e.target.value })}
                  className="w-full text-xs text-slate-800 border border-slate-200 rounded p-1.5 focus:border-blue-500 focus:outline-none bg-white font-semibold"
                >
                  {INDIAN_STATES.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-0.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Client GSTIN</label>
                <input
                  type="text"
                  value={activeCustomer.gstin || ''}
                  onChange={(e) => setActiveCustomer({ ...activeCustomer, gstin: e.target.value.toUpperCase() })}
                  placeholder="e.g. 27AABCS1234F1Z8"
                  className="w-full text-xs font-mono text-slate-800 border border-slate-200 rounded p-1.5 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 rounded text-xs transition cursor-pointer"
                >
                  Save Record
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-1.5 rounded text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-8 space-y-3">
              <MapPin className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="space-y-1 max-w-[200px] mx-auto">
                <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Client Profiling</h3>
                <p className="text-[10px] text-slate-500 leading-normal">Configure directory entities to trigger real-time auto-fill algorithms inside quotations.</p>
              </div>
              {userRole !== 'Viewer' && (
                <button
                  onClick={startNewCustomer}
                  className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-1 px-2 rounded text-[10px] border border-slate-200 transition cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Start Profiler
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
