import { useState } from 'react';
import { 
  Building, MapPin, Receipt, Phone, Mail, Globe, 
  HardHat, Shield, Landmark, Sparkles, Save, ToggleLeft, ToggleRight,
  Users, Key, Plus, Trash2, ShieldAlert
} from 'lucide-react';
import { CompanyProfile, MaterialSpecs, BankDetails, ERPUser, UserRole, TermCondition } from '../types';

interface SettingsProps {
  companyProfile: CompanyProfile;
  materialSpecs: MaterialSpecs;
  bankDetails: BankDetails;
  banks: BankDetails[];
  onUpdateCompany: (comp: CompanyProfile) => void;
  onUpdateSpecs: (spec: MaterialSpecs) => void;
  onUpdateBank: (bank: BankDetails) => void;
  onUpdateBanks: (banks: BankDetails[]) => void;
  users: ERPUser[];
  onUpdateUsers: (updated: ERPUser[]) => void;
  currentUserRole: UserRole;
  masterTerms: TermCondition[];
  onUpdateTerms: (terms: TermCondition[]) => void;
}

export default function Settings({
  companyProfile,
  materialSpecs,
  bankDetails,
  banks,
  onUpdateCompany,
  onUpdateSpecs,
  onUpdateBank,
  onUpdateBanks,
  users,
  onUpdateUsers,
  currentUserRole,
  masterTerms,
  onUpdateTerms
}: SettingsProps) {

  // Local state duplication
  const [profile, setProfile] = useState<CompanyProfile>({ ...companyProfile });
  const [specs, setSpecs] = useState<MaterialSpecs>(() => {
    return Array.isArray(materialSpecs) ? materialSpecs.map(s => ({ ...s })) : [];
  });
  const [localBanks, setLocalBanks] = useState<BankDetails[]>(() => {
    return Array.isArray(banks) && banks.length > 0 ? banks.map(b => ({ ...b })) : [{ ...bankDetails, id: 'bank-1', accountType: 'Current', showInQuotation: true }];
  });
  const [terms, setTerms] = useState<TermCondition[]>(() => {
    return Array.isArray(masterTerms) ? masterTerms.map(t => ({ ...t })) : [];
  });

  // User Management state
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('Sales');
  
  // Quick in-line password edit states
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingPassword, setEditingPassword] = useState('');

  const handleSaveAll = (e: any) => {
    e.preventDefault();
    onUpdateCompany(profile);
    onUpdateSpecs(specs);
    if (localBanks.length > 0) {
      onUpdateBank(localBanks[0]);
    }
    onUpdateBanks(localBanks);
    onUpdateTerms(terms);
    alert("Company profile, manufacturing materials, bank accounts, and terms updated successfully!");
  };

  const handleAddUser = (e: any) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) {
      alert("Please enter both username and password.");
      return;
    }
    if (users.some(u => u.username.toLowerCase() === newUsername.trim().toLowerCase())) {
      alert("This username already exists.");
      return;
    }
    const newUser: ERPUser = {
      id: `u-${Date.now()}`,
      username: newUsername.trim(),
      passwordHash: newPassword.trim(),
      role: newUserRole
    };
    onUpdateUsers([...users, newUser]);
    setNewUsername('');
    setNewPassword('');
    alert(`User '${newUser.username}' added successfully.`);
  };

  const handleDeleteUser = (id: string, username: string) => {
    if (username.toLowerCase() === 'admin') {
      alert("The primary master 'Admin' account cannot be deleted.");
      return;
    }
    if (confirm(`Are you sure you want to delete user '${username}'?`)) {
      onUpdateUsers(users.filter(u => u.id !== id));
    }
  };

  const handleSavePasswordChange = (id: string) => {
    if (!editingPassword.trim()) {
      alert("Password cannot be blank.");
      return;
    }
    onUpdateUsers(users.map(u => u.id === id ? { ...u, passwordHash: editingPassword.trim() } : u));
    setEditingUserId(null);
    setEditingPassword('');
    alert("Password updated successfully.");
  };

  return (
    <div className="space-y-4">
      
      {/* Header */}
      <div className="pb-1">
        <h1 className="text-base font-bold font-display text-slate-900">ERP System Configurations</h1>
        <p className="text-[11px] text-slate-500">Configure master metadata fields, default factory material grades, or bank wiring accounts</p>
      </div>

      <form onSubmit={handleSaveAll} className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        
        {/* LHS Fields (Company & Materials settings) */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Card 1: Company Profile */}
          <div className="bg-white rounded border border-slate-200 p-4 shadow-2xs space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 font-display flex items-center gap-2 border-b border-slate-100 pb-1.5">
              <Building className="w-4 h-4 text-slate-500" />
              Company Legal Entity Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-medium">
              
              {/* Brand Logo Upload option as requested */}
              <div className="sm:col-span-2 border border-dashed border-slate-200 rounded p-3 bg-slate-50/50 flex flex-col sm:flex-row items-center gap-4 transition hover:bg-slate-50/80">
                <div className="shrink-0">
                  {profile.logo ? (
                    <img src={profile.logo} alt="Company Logo" className="w-14 h-14 object-contain border border-slate-200 rounded p-1 bg-white" />
                  ) : (
                    <div className="w-14 h-14 border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 font-bold text-[8px] bg-slate-100 uppercase tracking-tight">No Logo</div>
                  )}
                </div>
                <div className="space-y-1 flex-1 text-center sm:text-left select-none">
                  <label className="text-[9px] text-slate-400 uppercase font-bold block">Company Brand Logo</label>
                  <label className="inline-flex items-center justify-center bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 px-2.5 py-1 rounded cursor-pointer text-[10px] font-bold transition">
                    Upload Logo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setProfile({ ...profile, logo: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                  {profile.logo && (
                    <button
                      type="button"
                      onClick={() => setProfile({ ...profile, logo: '' })}
                      className="text-[9.5px] text-rose-500 hover:underline ml-3.5 font-bold cursor-pointer"
                    >
                      Remove Logo
                    </button>
                  )}
                  <p className="text-[9px] text-slate-400 mt-0.5">Recommended format: horizontal format PNG or SVG.</p>
                </div>
              </div>

              <div className="space-y-0.5">
                <label className="text-[9px] text-slate-400 uppercase font-bold">Firms Registered Name</label>
                <input
                  type="text"
                  required
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full border border-slate-200 rounded p-1.5 focus:outline-none focus:border-blue-500 bg-slate-50/30"
                />
              </div>

              <div className="space-y-0.5">
                <label className="text-[9px] text-slate-400 uppercase font-bold">Official Website URL</label>
                <input
                  type="text"
                  required
                  value={profile.website}
                  onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                  className="w-full border border-slate-200 rounded p-1.5 focus:outline-none focus:border-blue-500 bg-slate-50/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 col-span-1 sm:col-span-2">
                <div className="space-y-0.5">
                  <label className="text-[9px] text-slate-400 uppercase font-bold">Firm GST Number *</label>
                  <input
                    type="text"
                    required
                    value={profile.gstin}
                    onChange={(e) => setProfile({ ...profile, gstin: e.target.value.toUpperCase() })}
                    className="w-full border border-slate-200 rounded p-1.5 focus:outline-none focus:border-blue-500 bg-slate-50/30 font-mono text-xs uppercase"
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[9px] text-slate-400 uppercase font-bold">Firm PAN Code</label>
                  <input
                    type="text"
                    required
                    value={profile.pan}
                    onChange={(e) => setProfile({ ...profile, pan: e.target.value.toUpperCase() })}
                    className="w-full border border-slate-200 rounded p-1.5 focus:outline-none focus:border-blue-500 bg-slate-50/30 font-mono text-xs uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 col-span-1 sm:col-span-2">
                <div className="space-y-0.5">
                  <label className="text-[9px] text-slate-400 uppercase font-bold">Operational Support Mobile</label>
                  <input
                    type="text"
                    required
                    value={profile.mobile}
                    onChange={(e) => setProfile({ ...profile, mobile: e.target.value })}
                    className="w-full border border-slate-200 rounded p-1.5 focus:outline-none focus:border-blue-500 bg-slate-50/30"
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[9px] text-slate-400 uppercase font-bold">Operational Dispatch Email</label>
                  <input
                    type="email"
                    required
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full border border-slate-200 rounded p-1.5 focus:outline-none focus:border-blue-500 bg-slate-50/30 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-0.5 col-span-1 sm:col-span-2">
                <label className="text-[9px] text-slate-400 uppercase font-bold">Corporate Registered Office Address</label>
                <textarea
                  required
                  rows={2}
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  className="w-full border border-slate-200 rounded p-1.5 focus:outline-none focus:border-blue-500 bg-slate-50/30 resize-none text-xs"
                />
              </div>
            </div>

          </div>

          {/* Card 2: Default Material Specifications */}
          <div className="bg-white rounded border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 font-display flex items-center gap-2">
                <HardHat className="w-4 h-4 text-slate-500" />
                Default Material Grades & Brands
              </h3>
              <button
                type="button"
                onClick={() => {
                  setSpecs([...specs, { id: 'spec-' + Date.now() + Math.random(), text: 'New default material core spec', checked: true }]);
                }}
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 rounded px-2.5 py-1 text-[9.5px] font-black uppercase tracking-wider flex items-center gap-1 transition cursor-pointer select-none"
              >
                + Add Spec
              </button>
            </div>

            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
              {specs.map((spec, sIdx) => (
                <div key={spec.id} className="flex gap-2 p-1.5 bg-slate-50 rounded hover:bg-slate-100/50 transition text-xs items-center border border-slate-200/60 shadow-3xs">
                  <input
                    type="checkbox"
                    checked={spec.checked}
                    onChange={(e) => {
                      const updated = [...specs];
                      updated[sIdx].checked = e.target.checked;
                      setSpecs(updated);
                    }}
                    className="rounded border-slate-300 text-blue-600 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={spec.text}
                    onChange={(e) => {
                      const updated = [...specs];
                      updated[sIdx].text = e.target.value;
                      setSpecs(updated);
                    }}
                    className="flex-1 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 text-slate-850 text-xs font-semibold focus:bg-white p-0.5 outline-none font-medium h-6 leading-none"
                    placeholder="Enter material specification grade description..."
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSpecs(specs.filter((_, i) => i !== sIdx));
                    }}
                    className="text-slate-400 hover:text-rose-600 font-bold text-xs p-1 cursor-pointer"
                    title="Delete Spec"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {specs.length === 0 && (
                <p className="text-2xs text-slate-400 italic text-center py-4">No default specs configured. Click "+ Add Spec" above.</p>
              )}
            </div>
            <p className="text-[9px] text-slate-400 italic">These default specs will pre-fill any newly created Quotations.</p>
          </div>

          {/* Card 5: Default Terms & Conditions */}
          <div className="bg-white rounded border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 font-display flex items-center gap-2">
                <Shield className="w-4 h-4 text-slate-500" />
                Default Terms & Conditions
              </h3>
              <button
                type="button"
                onClick={() => {
                  setTerms([...terms, { id: 'term-' + Date.now() + Math.random(), text: 'New default terms note', checked: true }]);
                }}
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 rounded px-2.5 py-1 text-[9.5px] font-black uppercase tracking-wider flex items-center gap-1 transition cursor-pointer select-none"
              >
                + Add Term
              </button>
            </div>

            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
              {terms.map((term, tIdx) => (
                <div key={term.id} className="flex gap-2 p-1.5 bg-slate-50 rounded hover:bg-slate-100/50 transition text-xs items-center border border-slate-200/60 shadow-3xs">
                  <input
                    type="checkbox"
                    checked={term.checked}
                    onChange={(e) => {
                      const updated = [...terms];
                      updated[tIdx].checked = e.target.checked;
                      setTerms(updated);
                    }}
                    className="rounded border-slate-300 text-blue-600 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={term.text}
                    onChange={(e) => {
                      const updated = [...terms];
                      updated[tIdx].text = e.target.value;
                      setTerms(updated);
                    }}
                    className="flex-1 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 text-slate-850 text-xs font-semibold focus:bg-white p-0.5 outline-none font-medium h-6 leading-none"
                    placeholder="Enter standard term description..."
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setTerms(terms.filter((_, i) => i !== tIdx));
                    }}
                    className="text-slate-400 hover:text-rose-600 font-bold text-xs p-1 cursor-pointer"
                    title="Delete Term"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {terms.length === 0 && (
                <p className="text-2xs text-slate-400 italic text-center py-4">No default terms configured. Click "+ Add Term" above.</p>
              )}
            </div>
            <p className="text-[9px] text-slate-400 italic">These default terms and conditions will pre-fill any newly created Quotations.</p>
          </div>

        </div>

        {/* RHS Fields (Bank details & triggers) */}
        <div className="space-y-4">
          
          {/* Card 3: Bank Account */}
          <div className="bg-white rounded border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 font-display flex items-center gap-2">
                <Landmark className="w-4 h-4 text-slate-500" />
                Corporate Banking Accounts
              </h3>
              <button
                type="button"
                onClick={() => {
                  const newBank: BankDetails = {
                    id: 'bank-' + Date.now() + '-' + Math.floor(Math.random() * 100),
                    bankName: '',
                    accountName: profile.name || 'Swaraj Furniture Pvt Ltd',
                    accountNo: '',
                    ifsc: '',
                    bankBranch: '',
                    accountType: 'Current',
                    showInQuotation: true
                  };
                  setLocalBanks([...localBanks, newBank]);
                }}
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 rounded px-2.5 py-1 text-[9.5px] font-black uppercase tracking-wider flex items-center gap-1 transition cursor-pointer select-none"
              >
                + Add Account
              </button>
            </div>

            <div className="space-y-4 max-h-[310px] overflow-y-auto pr-1">
              {localBanks.map((item, bIdx) => (
                <div key={item.id || bIdx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 relative shadow-3xs">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-1 mb-1">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Account #{bIdx + 1}</span>
                    {localBanks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setLocalBanks(localBanks.filter((_, idx) => idx !== bIdx));
                        }}
                        className="text-rose-500 hover:text-rose-700 text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                      >
                        ✕ Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium">
                    <div className="space-y-0.5">
                      <label className="text-[9px] text-slate-400 uppercase font-bold">Bank Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Bank of Baroda"
                        value={item.bankName || ''}
                        onChange={(e) => {
                          const updated = [...localBanks];
                          updated[bIdx].bankName = e.target.value;
                          setLocalBanks(updated);
                        }}
                        className="w-full border border-slate-200 rounded p-1 focus:outline-none focus:border-blue-500 bg-white"
                      />
                    </div>

                    <div className="space-y-0.5">
                      <label className="text-[9px] text-slate-400 uppercase font-bold">Holder Name</label>
                      <input
                        type="text"
                        required
                        value={item.accountName}
                        onChange={(e) => {
                          const updated = [...localBanks];
                          updated[bIdx].accountName = e.target.value;
                          setLocalBanks(updated);
                        }}
                        className="w-full border border-slate-200 rounded p-1 focus:outline-none focus:border-blue-500 bg-white"
                      />
                    </div>

                    <div className="space-y-0.5">
                      <label className="text-[9px] text-slate-400 uppercase font-bold">Account Number</label>
                      <input
                        type="text"
                        required
                        value={item.accountNo}
                        onChange={(e) => {
                          const updated = [...localBanks];
                          updated[bIdx].accountNo = e.target.value;
                          setLocalBanks(updated);
                        }}
                        className="w-full border border-slate-200 rounded p-1 focus:outline-none focus:border-blue-500 bg-white font-mono text-slate-900"
                      />
                    </div>

                    <div className="space-y-0.5">
                      <label className="text-[9px] text-slate-400 uppercase font-bold">IFSC Code</label>
                      <input
                        type="text"
                        required
                        value={item.ifsc}
                        onChange={(e) => {
                          const updated = [...localBanks];
                          updated[bIdx].ifsc = e.target.value.toUpperCase();
                          setLocalBanks(updated);
                        }}
                        className="w-full border border-slate-200 rounded p-1 focus:outline-none focus:border-blue-500 bg-white font-mono text-slate-900 uppercase"
                      />
                    </div>

                    <div className="space-y-0.5">
                      <label className="text-[9px] text-slate-400 uppercase font-bold">Account Type</label>
                      <select
                        value={item.accountType || 'Current'}
                        onChange={(e) => {
                          const updated = [...localBanks];
                          updated[bIdx].accountType = e.target.value;
                          setLocalBanks(updated);
                        }}
                        className="w-full border border-slate-200 rounded p-1 focus:outline-none focus:border-blue-500 bg-white font-bold text-[11px]"
                      >
                        <option value="Current">Current</option>
                        <option value="Savings">Savings</option>
                        <option value="CC Account">CC Account</option>
                        <option value="OD Account">OD Account</option>
                      </select>
                    </div>

                    <div className="space-y-0.5">
                      <label className="text-[9px] text-slate-400 uppercase font-bold">Branch</label>
                      <input
                        type="text"
                        required
                        value={item.bankBranch}
                        onChange={(e) => {
                          const updated = [...localBanks];
                          updated[bIdx].bankBranch = e.target.value;
                          setLocalBanks(updated);
                        }}
                        className="w-full border border-slate-200 rounded p-1 focus:outline-none focus:border-blue-500 bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {localBanks.length === 0 && (
                <p className="text-2xs text-slate-400 italic text-center py-4">No bank accounts configured. Click "+ Add Account" above.</p>
              )}
            </div>
          </div>

          {/* Card 4: Signature / Stamp toggling & single upload */}
          <div className="bg-white rounded border border-slate-200 p-4 shadow-2xs space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 font-display flex items-center gap-2 border-b border-slate-100 pb-1.5">
              <Shield className="w-4 h-4 text-slate-500" />
              Document Authority Seals
            </h3>

            <div className="flex items-center justify-between gap-2.5">
              <span className="text-[11px] font-bold text-slate-600">Show Authorized Seals on Quotations?</span>
              <button
                type="button"
                onClick={() => setProfile({ ...profile, showStampSignature: !profile.showStampSignature })}
                className="focus:outline-none cursor-pointer shrink-0"
              >
                {profile.showStampSignature ? (
                  <ToggleRight className="w-8 h-8 text-blue-600" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-slate-300" />
                )}
              </button>
            </div>

            <div className="border-t border-slate-100 pt-3.5 space-y-3 text-xs text-left">
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 uppercase font-bold block">Company Stamp & Signature Image</label>
                
                <div className="flex flex-col gap-2.5">
                  <div className="relative border border-dashed border-slate-200 rounded p-4 bg-slate-50/50 text-center hover:bg-slate-50 transition">
                    {(profile.stampAndSignature || profile.stamp) ? (
                      <div className="space-y-2">
                        <img 
                          src={profile.stampAndSignature || profile.stamp} 
                          alt="Company Stamp & Signature" 
                          className="max-h-24 max-w-full mx-auto object-contain mix-blend-multiply" 
                        />
                        <button
                          type="button"
                          onClick={() => setProfile({ ...profile, stampAndSignature: '', stamp: '', signature: '' })}
                          className="text-[9px] text-rose-500 hover:underline font-bold cursor-pointer"
                        >
                          Remove Image
                        </button>
                      </div>
                    ) : (
                      <div className="py-2 text-slate-400 text-2xs">
                        No Stamp & Signature image selected
                      </div>
                    )}
                    
                    <div className="mt-2">
                      <label className="inline-flex items-center justify-center bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded cursor-pointer text-2xs font-bold transition">
                        Select Stamp & Signature Page
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setProfile({
                                  ...profile,
                                  stampAndSignature: reader.result as string
                                });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 italic">Upload a single combined image with the company stamp and signature physically placed together.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Save Action trigger */}
          <div className="sticky top-4">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded shadow transition cursor-pointer flex items-center justify-center gap-1.5 text-xs"
            >
              <Save className="w-3.5 h-3.5" />
              Save Config Settings
            </button>
          </div>

        </div>

      </form>

      {/* User Accounts & Password Management card - visible only to Admin and General Manager */}
      {(currentUserRole === 'Admin' || currentUserRole === 'General Manager') ? (
        <div className="bg-white rounded border border-slate-200 p-5 shadow-2xs space-y-4">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 font-display flex items-center gap-2 border-b border-slate-100 pb-2">
            <Users className="w-4 h-4 text-[#1E40AF]" />
            ERP User Accounts & Password control Panel
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Column 1 & 2: Users List Table */}
            <div className="lg:col-span-2 space-y-2">
              <h4 className="font-bold text-[10.5px] uppercase text-slate-500 tracking-wider">Active ERP Operator Accounts</h4>
              <div className="overflow-x-auto border border-slate-200 rounded">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-extrabold text-[9px] uppercase tracking-wider">
                      <th className="py-2 px-3">Username</th>
                      <th className="py-2 px-3">Assigned Role</th>
                      <th className="py-2 px-3">Access Password</th>
                      <th className="py-2 px-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {users.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{item.username}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            item.role === 'Admin' ? 'bg-red-50 text-red-700 border border-red-100' :
                            item.role === 'General Manager' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                            item.role === 'Accountant' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                            item.role === 'Designer' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                            item.role === 'Viewer' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                            'bg-blue-50 text-blue-700 border border-blue-100'
                          }`}>
                            {item.role}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          {editingUserId === item.id ? (
                            <div className="flex items-center gap-1.5">
                              <input 
                                type="text"
                                value={editingPassword}
                                onChange={(e) => setEditingPassword(e.target.value)}
                                className="border border-blue-400 rounded p-1 text-xs font-mono font-bold focus:outline-none"
                              />
                              <button 
                                type="button"
                                onClick={() => handleSavePasswordChange(item.id)}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-2 py-1 rounded text-[10px]"
                              >
                                Save
                              </button>
                              <button 
                                type="button"
                                onClick={() => setEditingUserId(null)}
                                className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-1 rounded text-[10px]"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 font-mono font-bold text-[#1E40AF]">
                              <span>{item.passwordHash}</span>
                              <button 
                                type="button"
                                onClick={() => {
                                  setEditingUserId(item.id);
                                  setEditingPassword(item.passwordHash);
                                }}
                                className="text-[10px] text-slate-400 hover:text-slate-600 underline font-sans font-medium"
                              >
                                Change
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            disabled={item.username.toLowerCase() === 'admin'}
                            onClick={() => handleDeleteUser(item.id, item.username)}
                            className="p-1 bg-red-50 hover:bg-red-100 text-red-650 rounded border border-red-150 disabled:opacity-30 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Column 3: Add User form */}
            <form onSubmit={handleAddUser} className="bg-slate-50/50 rounded border border-slate-200 p-3.5 space-y-3">
              <h4 className="font-bold text-[10.5px] uppercase text-blue-900 tracking-wider flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Add New Operator
              </h4>
              <div className="space-y-2 text-xs font-medium">
                <div className="space-y-0.5">
                  <label className="text-[9px] text-slate-400 uppercase font-bold">Operator Username</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Akash"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full border border-slate-200 bg-white rounded p-1.5 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[9px] text-slate-400 uppercase font-bold">Access Password</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Akash@123"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full border border-slate-200 bg-white rounded p-1.5 focus:outline-none focus:border-blue-500 font-mono font-bold"
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[9px] text-slate-400 uppercase font-bold">Assigned Operator Role</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                    className="w-full border border-slate-200 bg-white rounded p-1.5 focus:outline-none focus:border-blue-500 font-bold"
                  >
                    <option value="Admin">🛡️ Admin (All rights)</option>
                    <option value="General Manager">💼 General Manager (All rights)</option>
                    <option value="Accountant">💵 Accountant (Create/Edit his own)</option>
                    <option value="Designer">🎨 Designer (Create/Edit his own)</option>
                    <option value="Sales">💼 Sales (Create/Edit his own)</option>
                    <option value="Viewer">👁️ Viewer (Read only)</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#1E3A8A] hover:bg-[#1E40AF] text-white font-bold py-1.5 px-3 rounded text-2xs uppercase tracking-wider transition cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="bg-amber-55/10 border border-amber-200 rounded p-4 text-xs font-semibold text-slate-600 flex items-start gap-1.5 leading-relaxed bg-amber-50/10">
          <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <span>Note: User accounts and password controls are strictly view-locked and reserved for system level Administrators.</span>
        </div>
      )}
    </div>
  );
}
