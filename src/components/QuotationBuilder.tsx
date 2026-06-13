import { useState, useEffect, FormEvent } from 'react';
import { 
  Plus, Trash2, ArrowUp, ArrowDown, Eye, Save, Settings, 
  HelpCircle, ChevronRight, FileText, Image, Camera, CloudUpload, 
  Sparkles, CheckCircle, Percent, Receipt, HardHat, Landmark, ShieldCheck,
  GripVertical
} from 'lucide-react';
import { Quotation, Customer, QuotationItem, TermCondition, MaterialSpecs, BankDetails } from '../types';
import { DEFAULT_UOMS, FURNITURE_IMAGES } from '../mockData';

interface QuotationBuilderProps {
  customers: Customer[];
  existingQuotations: Quotation[];
  initialQuotationToEdit?: Quotation | null;
  onSaveQuotation: (q: Quotation) => void;
  onCancel: () => void;
  masterSpecs: MaterialSpecs;
  masterTerms: TermCondition[];
  masterBank: BankDetails;
  operatorName?: string;
  onAddCustomer?: (cust: Customer) => void;
}

export default function QuotationBuilder({
  customers,
  existingQuotations,
  initialQuotationToEdit,
  onSaveQuotation,
  onCancel,
  masterSpecs,
  masterTerms,
  masterBank,
  operatorName,
  onAddCustomer
}: QuotationBuilderProps) {

  // Auto-generate next quotation code
  const generateNextQuotationNumber = () => {
    if (initialQuotationToEdit) return initialQuotationToEdit.id;
    const year = new Date().getFullYear();
    const swrjQuotes = existingQuotations.filter(q => q.id.startsWith(`SWRJ-${year}-`));
    if (swrjQuotes.length === 0) {
      return `SWRJ-${year}-0001`;
    }
    // Sort descending
    swrjQuotes.sort((a, b) => b.id.localeCompare(a.id));
    const lastNumStr = swrjQuotes[0].id.split('-').pop();
    const lastNum = parseInt(lastNumStr || '0', 10);
    const nextNum = lastNum + 1;
    return `SWRJ-${year}-${String(nextNum).padStart(4, '0')}`;
  };

  // State
  const [quoteId] = useState(generateNextQuotationNumber());
  const [refNumber, setRefNumber] = useState(initialQuotationToEdit?.refNumber || 'SE-PR-' + Math.floor(1000 + Math.random() * 9000));
  const [date, setDate] = useState(initialQuotationToEdit?.date || new Date().toISOString().split('T')[0]);
  const [validityDate, setValidityDate] = useState(initialQuotationToEdit?.validityDate || (() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  })());
  const [customerId, setCustomerId] = useState(initialQuotationToEdit?.customerId || customers[0]?.id || '');
  
  // Quick Add Client form states
  const [showQuickAddClient, setShowQuickAddClient] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickCompanyName, setQuickCompanyName] = useState('');
  const [quickMobile, setQuickMobile] = useState('');
  const [quickEmail, setQuickEmail] = useState('');
  const [quickCity, setQuickCity] = useState('');
  const [quickState, setQuickState] = useState('Maharashtra');
  const [quickAddress, setQuickAddress] = useState('');
  const [quickPincode, setQuickPincode] = useState('');
  const [quickGstin, setQuickGstin] = useState('');

  const [type, setType] = useState<'Standard' | 'Group-Wise'>(initialQuotationToEdit?.type || 'Standard');
  const [items, setItems] = useState<QuotationItem[]>(initialQuotationToEdit?.items || [
    {
      id: 'it-' + Date.now(),
      description: 'Custom Wooden Wardrobe with internal drawers',
      uom: 'Sft',
      qty: 80,
      rate: 1500,
      discountPercent: 0,
      image: FURNITURE_IMAGES.wardrobe
    }
  ]);
  const [masterDiscountPercent, setMasterDiscountPercent] = useState<number>(initialQuotationToEdit?.masterDiscountPercent || 0);
  const [showImages, setShowImages] = useState<boolean>(initialQuotationToEdit?.showImages ?? true);
  const [status, setStatus] = useState<'Pending' | 'Approved' | 'Rejected'>(initialQuotationToEdit?.status || 'Pending');
  const [notes, setNotes] = useState(initialQuotationToEdit?.notes || '');

  // Master Spec defaults overrides
  const [specs, setSpecs] = useState<MaterialSpecs>(() => {
    const loaded = initialQuotationToEdit?.materialSpecs || masterSpecs;
    if (loaded && !Array.isArray(loaded)) {
      const old = loaded as any;
      return [
        { id: 'spec-1', text: `Plywood Core: ${old.plywood || ''}`, checked: true },
        { id: 'spec-2', text: `External Laminate: ${old.externalLaminate || ''}`, checked: true },
        { id: 'spec-3', text: `Internal Backer: ${old.internalLaminate || ''}`, checked: true },
        { id: 'spec-4', text: `Hardware Fitting: ${old.hardware || ''}`, checked: true },
        { id: 'spec-5', text: `Laminate Brands: ${old.laminateBrand || ''}`, checked: true }
      ].filter(item => item.text && item.text.split(': ')[1]?.trim().length > 0);
    }
    return (loaded || []).map(s => ({ ...s }));
  });
  const [terms, setTerms] = useState<TermCondition[]>(initialQuotationToEdit?.terms || masterTerms.map(t => ({ ...t })));
  const [bankDetails, setBankDetails] = useState<BankDetails>(initialQuotationToEdit?.bankDetails || { ...masterBank });

  // Drag and drop state for group re-assignment
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // Custom Groups List (For group wise selections)
  const [groups, setGroups] = useState<string[]>(['Bedroom Furniture', 'Living Room Furniture', 'Modular Kitchen']);
  const [newGroupName, setNewGroupName] = useState('');

  // AI Assistant Panel State
  const [aiPanelActive, setAiPanelActive] = useState(false);
  const [aiTool, setAiTool] = useState<'description' | 'recommendation' | 'audit' | 'optimize' | null>(null);
  const [aiProductTitle, setAiProductTitle] = useState('');
  const [aiProductDetails, setAiProductDetails] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiOutputText, setAiOutputText] = useState('');
  const [targetItemIndex, setTargetItemIndex] = useState<number | null>(null);

  // AI response holding structures
  const [aiRecommendResult, setAiRecommendResult] = useState<any>(null);
  const [aiAuditResult, setAiAuditResult] = useState<any>(null);
  const [aiOptimizeResult, setAiOptimizeResult] = useState<any>(null);

  // Auto-set validity dates on date changes
  useEffect(() => {
    if (date) {
      const d = new Date(date);
      d.setDate(d.getDate() + 30);
      setValidityDate(d.toISOString().split('T')[0]);
    }
  }, [date]);

  // Selected Customer detail
  const selectedCustomer = customers.find(c => c.id === customerId);

  // Math totals calculation
  const calculateSubtotal = () => {
    return items.reduce((sum, item) => {
      const rateAfterDiscount = item.rate * (1 - masterDiscountPercent / 100);
      return sum + (item.qty * rateAfterDiscount);
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const isMaharashtra = selectedCustomer?.state === 'Maharashtra';
  const gstRate = 0.18;
  const totalGstAmount = subtotal * gstRate;
  const grandTotal = subtotal + totalGstAmount;

  // Item additions
  const handleAddItem = (groupName?: string) => {
    setItems([
      ...items,
      {
        id: 'it-' + Date.now() + Math.floor(Math.random() * 100),
        description: 'New customizable furniture segment spec listing',
        uom: 'Nos',
        qty: 1,
        rate: 5000,
        discountPercent: 0,
        groupName: type === 'Group-Wise' ? (groupName || groups[0]) : undefined
      }
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      alert("Quotation must hold at least one transaction row.");
      return;
    }
    setItems(items.filter(item => item.id !== id));
  };

  const handleUpdateItem = (id: string, updates: Partial<QuotationItem>) => {
    setItems(items.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  // Up and Down moves
  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    // Swap
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;
    setItems(newItems);
  };

  // Group creation
  const handleAddGroup = (e: FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    if (groups.includes(newGroupName.trim())) {
      alert("Group already exists.");
      return;
    }
    setGroups([...groups, newGroupName.trim()]);
    setNewGroupName('');
  };

  // File Upload base64 simulation
  const handleFileChange = (itemId: string, e: any) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event: any) => {
        handleUpdateItem(itemId, { image: event.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  // Simulated Camera Capture
  const handleCameraCapture = (itemId: string) => {
    const simulatedPhotos = [
      FURNITURE_IMAGES.wardrobe,
      FURNITURE_IMAGES.bed,
      FURNITURE_IMAGES.tv_unit,
      FURNITURE_IMAGES.table,
      FURNITURE_IMAGES.sofa
    ];
    // Random select
    const selected = simulatedPhotos[Math.floor(Math.random() * simulatedPhotos.length)];
    handleUpdateItem(itemId, { image: selected });
    alert("Camera snapshot simulated and attached successfully!");
  };

  // Save call
  const handleSaveQuotation = () => {
    if (!customerId) {
      alert("Please select a valid customer.");
      return;
    }
    onSaveQuotation({
      id: quoteId,
      refNumber,
      date,
      validityDate,
      customerId,
      clientId: customerId,
      type,
      items,
      masterDiscountPercent,
      showImages,
      status,
      createdBy: initialQuotationToEdit?.createdBy || operatorName || 'Admin',
      materialSpecs: specs,
      terms: terms,
      bankDetails,
      notes
    });
  };

  // AI SERVICES CALLS
  const openAiTool = (toolName: 'description' | 'recommendation' | 'audit' | 'optimize', index?: number) => {
    setAiTool(toolName);
    setAiPanelActive(true);
    setAiOutputText('');
    setAiRecommendResult(null);
    setAiAuditResult(null);
    setAiOptimizeResult(null);

    if (toolName === 'description' && index !== undefined) {
      setTargetItemIndex(index);
      // set matching title
      const item = items[index];
      setAiProductTitle(item?.description.split(' ')[0] || 'Wardrobe');
    }
  };

  const handleCallAi = async () => {
    setAiLoading(true);
    setAiOutputText('');
    try {
      if (aiTool === 'description') {
        const response = await fetch('/api/ai/generate-description', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: aiProductTitle, details: aiProductDetails })
        });
        const data = await response.json();
        setAiOutputText(data.description);
      }
      else if (aiTool === 'recommendation') {
        const response = await fetch('/api/ai/recommend-materials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ furnitureType: aiProductTitle, qualityLevel: aiProductDetails || 'Premium' })
        });
        const data = await response.json();
        setAiRecommendResult(data);
      }
      else if (aiTool === 'audit') {
        const payloadQuote = {
          id: quoteId,
          customerId,
          items,
          masterDiscountPercent,
          materialSpecs: specs
        };
        const response = await fetch('/api/ai/analyze-quotation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quotation: payloadQuote })
        });
        const data = await response.json();
        setAiAuditResult(data);
      }
      else if (aiTool === 'optimize') {
        const response = await fetch('/api/ai/optimize-cost', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items, currentSpecs: specs })
        });
        const data = await response.json();
        setAiOptimizeResult(data);
      }
    } catch (err: any) {
      console.error(err);
      setAiOutputText("Failed to query model. Please verify your GEMINI_API_KEY environment credentials.");
    } finally {
      setAiLoading(false);
    }
  };

  const applyDescriptionToItem = () => {
    if (targetItemIndex !== null && aiOutputText) {
      const updated = [...items];
      updated[targetItemIndex].description = aiOutputText;
      setItems(updated);
      setAiPanelActive(false);
      setTargetItemIndex(null);
    }
  };

  const applyMaterialRecommendation = () => {
    if (aiRecommendResult) {
      setSpecs([
        { id: 'spec-1', text: `Plywood Core: ${aiRecommendResult.plywood || 'BWP Marine Grade Plywood'}`, checked: true },
        { id: 'spec-2', text: `External Laminate: ${aiRecommendResult.externalLaminate || '1.0mm Scratch Resistance SF Laminate'}`, checked: true },
        { id: 'spec-3', text: `Internal Backer: ${aiRecommendResult.internalLaminate || '0.8mm Liner White Balance Matte Laminate'}`, checked: true },
        { id: 'spec-4', text: `Hardware Fitting: ${aiRecommendResult.hardware || 'Soft-close Hydraulic auto-hinges'}`, checked: true },
        { id: 'spec-5', text: `Laminate Brands: ${aiRecommendResult.laminateBrand || 'Standard Premium Brands'}`, checked: true }
      ].filter(item => item.text && item.text.split(': ')[1]?.trim().length > 0));
      setAiPanelActive(false);
      alert("AI recommendations successfully loaded with Swaraj specs Sheet!");
    }
  };

  return (
    <div className="space-y-4 relative text-slate-800">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
              {initialQuotationToEdit ? 'ERP Edit Session' : 'Draft Estimate Creator'}
            </span>
          </div>
          <h1 className="text-base font-bold font-display tracking-tight text-slate-900 mt-1">
            Build Quotation {quoteId}
          </h1>
          <p className="text-[11px] text-slate-500">Complete standard Indian tax and custom furniture specifications</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveQuotation}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 font-bold text-xs text-white py-1.5 px-3 rounded shadow-2xs transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            Save & Publish
          </button>
          
          <button
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 font-bold text-xs text-slate-700 py-1.5 px-3 rounded cursor-pointer transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Main Core Form Structure */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
        
        {/* Core items form LHS */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Section 1: Customer Profile Link */}
          <div className="bg-white rounded border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex justify-between items-center pb-1.5 border-b border-slate-100">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 font-display flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[10px]">1</span>
                Client Mapping & Dates
              </h3>
              
              <button
                type="button"
                onClick={() => setShowQuickAddClient(!showQuickAddClient)}
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 border border-blue-200 rounded px-2.5 py-1 text-[9.5px] font-black uppercase tracking-wider flex items-center gap-1 transition cursor-pointer select-none"
              >
                {showQuickAddClient ? '✕ Cancel' : '⚡ + Create Client Inline'}
              </button>
            </div>

            {showQuickAddClient && (
              <div className="border border-blue-200 bg-blue-50/15 rounded-xl p-3.5 space-y-3 shadow-inner">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-800 uppercase tracking-widest">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  Quick Client Registration
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 text-2xs">
                  <div className="col-span-2 md:col-span-1 space-y-0.5">
                    <label className="text-[8px] font-extrabold text-slate-500 uppercase">Client Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Akash Kadam"
                      value={quickName}
                      onChange={(e) => setQuickName(e.target.value)}
                      className="w-full text-xs border border-slate-300 bg-white rounded p-1.5 focus:border-blue-500 outline-none font-semibold text-slate-800"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[8px] font-extrabold text-slate-500 uppercase">Business Name / Company</label>
                    <input
                      type="text"
                      placeholder="e.g. Retail or Corporate (Optional)"
                      value={quickCompanyName}
                      onChange={(e) => setQuickCompanyName(e.target.value)}
                      className="w-full text-xs border border-slate-300 bg-white rounded p-1.5 focus:border-blue-500 outline-none font-semibold text-slate-800"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[8px] font-extrabold text-slate-500 uppercase">Mobile Number</label>
                    <input
                      type="text"
                      placeholder="10 digit phone number"
                      maxLength={15}
                      value={quickMobile}
                      onChange={(e) => setQuickMobile(e.target.value)}
                      className="w-full text-xs border border-slate-300 bg-white rounded p-1.5 focus:border-blue-500 outline-none font-semibold text-slate-800"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[8px] font-extrabold text-slate-500 uppercase">Email Address</label>
                    <input
                      type="email"
                      placeholder="client@mail.com"
                      value={quickEmail}
                      onChange={(e) => setQuickEmail(e.target.value)}
                      className="w-full text-xs border border-slate-300 bg-white rounded p-1.5 focus:border-blue-500 outline-none font-semibold text-slate-800"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[8px] font-extrabold text-slate-500 uppercase">City</label>
                    <input
                      type="text"
                      placeholder="e.g. Baramati"
                      value={quickCity}
                      onChange={(e) => setQuickCity(e.target.value)}
                      className="w-full text-xs border border-slate-300 bg-white rounded p-1.5 focus:border-blue-500 outline-none font-semibold text-slate-800"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[8px] font-extrabold text-slate-500 uppercase">State *</label>
                    <select
                      value={quickState}
                      onChange={(e) => setQuickState(e.target.value)}
                      className="w-full text-xs border border-slate-300 bg-white rounded p-1.5 focus:border-blue-500 outline-none font-bold text-slate-800 cursor-pointer"
                    >
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Gujarat">Gujarat</option>
                      <option value="Karnataka">Karnataka</option>
                      <option value="Goa">Goa</option>
                      <option value="Delhi">Delhi</option>
                      <option value="Madhya Pradesh">Madhya Pradesh</option>
                      <option value="Andhra Pradesh">Andhra Pradesh</option>
                      <option value="Telangana">Telangana</option>
                      <option value="Other">Other State</option>
                    </select>
                  </div>
                  <div className="col-span-2 md:col-span-3 grid grid-cols-3 gap-2.5">
                    <div className="col-span-2 space-y-0.5">
                      <label className="text-[8px] font-extrabold text-slate-500 uppercase">Full Billing Address</label>
                      <input
                        type="text"
                        placeholder="Plot No., Industrial Sector, Landmark"
                        value={quickAddress}
                        onChange={(e) => setQuickAddress(e.target.value)}
                        className="w-full text-xs border border-slate-300 bg-white rounded p-1.5 focus:border-blue-500 outline-none font-semibold text-slate-800"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[8px] font-extrabold text-slate-500 uppercase">GSTIN Code</label>
                      <input
                        type="text"
                        placeholder="15-digit GSTIN Code"
                        value={quickGstin}
                        maxLength={15}
                        onChange={(e) => setQuickGstin(e.target.value)}
                        className="w-full text-xs border border-slate-300 bg-white rounded p-1.5 focus:border-blue-500 outline-none font-bold font-mono text-slate-800 uppercase"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 text-2xs pt-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setQuickName('');
                      setShowQuickAddClient(false);
                    }}
                    className="border border-slate-200 hover:bg-slate-100 text-slate-600 px-3 py-1.5 rounded cursor-pointer font-bold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!quickName.trim()) {
                        alert("Please specify the Client Name.");
                        return;
                      }
                      const newCust: Customer = {
                        id: `cust-${Date.now()}`,
                        name: quickName.trim(),
                        companyName: quickCompanyName.trim() || 'Retail Client',
                        address: quickAddress.trim() || 'MIDC',
                        city: quickCity.trim() || 'Baramati',
                        state: quickState,
                        pincode: quickPincode.trim() || '413102',
                        mobile: quickMobile.trim() || '—',
                        email: quickEmail.trim() || '—',
                        gstin: quickGstin.trim().toUpperCase()
                      };
                      if (onAddCustomer) {
                        onAddCustomer(newCust);
                      }
                      setCustomerId(newCust.id);
                      setQuickName('');
                      setQuickCompanyName('');
                      setQuickMobile('');
                      setQuickEmail('');
                      setQuickCity('');
                      setQuickState('Maharashtra');
                      setQuickAddress('');
                      setQuickPincode('');
                      setQuickGstin('');
                      setShowQuickAddClient(false);
                    }}
                    className="bg-blue-650 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg cursor-pointer font-extrabold uppercase tracking-wide transition shadow-sm"
                  >
                    Save & Match Client
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-0.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Selected Client *</label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full text-xs text-slate-800 border border-slate-200 rounded p-1.5 focus:border-blue-500 bg-white"
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.companyName || 'Retail'})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-0.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Quotation Date *</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-xs text-slate-800 border border-slate-200 rounded p-1.5 focus:border-blue-500 focus:outline-none bg-slate-50/20"
                />
              </div>

              <div className="space-y-0.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Validity Date *</label>
                <input
                  type="date"
                  value={validityDate}
                  onChange={(e) => setValidityDate(e.target.value)}
                  className="w-full text-xs text-slate-800 border border-slate-200 rounded p-1.5 focus:border-blue-500 focus:outline-none bg-slate-50/20"
                />
              </div>
            </div>

            {selectedCustomer && (
              <div className="bg-slate-50/60 rounded p-2 border border-slate-100 flex flex-wrap gap-x-4 gap-y-1 items-center justify-between text-[10px] text-slate-600">
                <div>
                  <span className="font-bold text-slate-700">Billing:</span> {selectedCustomer.city}, {selectedCustomer.state}
                </div>
                <div>
                  <span className="font-bold text-slate-700">GST:</span> {selectedCustomer.gstin || 'Unregistered'}
                </div>
                <div className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  {isMaharashtra ? 'CGST/SGST Mode Active (9% + 9%)' : 'IGST Mode Active (18%)'}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Layout Type & Visual Settings */}
          <div className="bg-white rounded border border-slate-200 p-4 shadow-2xs space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 font-display flex items-center gap-2 pb-1.5 border-b border-slate-100">
              <span className="w-5 h-5 rounded bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[10px]">2</span>
              Quotation Mode & Configuration
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Std / Grouped selection */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Quotation Type</label>
                <div className="flex bg-slate-100 p-0.5 rounded">
                  <button
                    type="button"
                    onClick={() => {
                      setType('Standard');
                      // Reset item groupings
                      setItems(items.map(it => ({ ...it, groupName: undefined })));
                    }}
                    className={`w-full text-center py-1 text-[11px] font-bold rounded cursor-pointer transition ${type === 'Standard' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-550 hover:text-slate-700'}`}
                  >
                    Standard
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setType('Group-Wise');
                      // Assign first group
                      setItems(items.map(it => ({ ...it, groupName: it.groupName || groups[0] })));
                    }}
                    className={`w-full text-center py-1 text-[11px] font-bold rounded cursor-pointer transition ${type === 'Group-Wise' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-550 hover:text-slate-700'}`}
                  >
                    Group-Wise
                  </button>
                </div>
              </div>

              {/* Master discount input */}
              <div className="space-y-0.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Master Discount (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={masterDiscountPercent}
                    onChange={(e) => setMasterDiscountPercent(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                    className="w-full text-xs text-slate-800 border border-slate-200 rounded p-1.5 focus:border-blue-500 focus:outline-none"
                    placeholder="e.g. 5"
                  />
                  <Percent className="w-3 h-3 text-slate-400 absolute right-2.5 top-2.5" />
                </div>
              </div>

              {/* Show Images Config Toggle */}
              <div className="space-y-0.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Show Images in Document</label>
                <select
                  value={showImages ? 'Yes' : 'No'}
                  onChange={(e) => setShowImages(e.target.value === 'Yes')}
                  className="w-full text-xs text-slate-800 border border-slate-200 rounded p-1.5 focus:border-blue-500 bg-white"
                >
                  <option value="Yes">Yes (Images rendered inside table)</option>
                  <option value="No">No (Images hidden, layout preserved)</option>
                </select>
              </div>

            </div>

            {/* Custom group setup panel for Group-Wise */}
            {type === 'Group-Wise' && (
              <div className="bg-blue-50/30 rounded p-3 border border-blue-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-blue-900 font-display">Manage Floor/Room Furniture Groups</h4>
                  <div className="flex flex-wrap gap-1">
                    {groups.map((g, idx) => (
                      <span key={idx} className="text-[9px] font-bold bg-blue-100 text-blue-700 py-0.5 px-2 rounded flex items-center gap-1">
                        {g}
                        <button 
                          type="button" 
                          onClick={() => {
                            if (groups.length <= 1) return;
                            setGroups(groups.filter(gr => gr !== g));
                          }} 
                          className="hover:text-rose-600 font-extrabold ml-1 cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleAddGroup} className="flex gap-1.5">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Office Cabinetry"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="text-[10px] bg-white border border-slate-200 rounded px-2 py-1 focus:border-blue-500 focus:outline-none text-slate-800"
                  />
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] px-2.5 py-1 rounded cursor-pointer transition">
                    Add Block
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Section 3: ITEM TABLES */}
          <div className="bg-white rounded border border-slate-200 p-4 shadow-2xs space-y-3">
            <h3 className="font-bold text-slate-850 font-display flex items-center justify-between gap-2 pb-1 text-xs">
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[10px]">3</span>
                Quotation Line Items Catalog
              </span>
              
              {type !== 'Group-Wise' && (
                <button
                  type="button"
                  onClick={() => handleAddItem()}
                  className="text-[10px] font-bold bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded inline-flex items-center gap-1 cursor-pointer transition"
                >
                  <Plus className="w-3 h-3" /> Add Item
                </button>
              )}
            </h3>

            {/* If Standard Type style */}
            {type === 'Standard' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-extrabold text-[9px] uppercase tracking-wider">
                      <th className="py-2 px-2 w-8 text-center">Sr</th>
                      {showImages && <th className="py-2 px-2 w-14">Image</th>}
                      <th className="py-2 px-2 min-w-[180px]">Furniture Description</th>
                      <th className="py-2 px-2 w-16 text-center">UOM</th>
                      <th className="py-2 px-2 w-12 text-center">Qty</th>
                      <th className="py-2 px-2 w-20 text-right">Rate (₹)</th>
                      <th className="py-2 px-2 w-20 text-right">After Disc</th>
                      <th className="py-2 px-2 w-22 text-right">Amount (₹)</th>
                      <th className="py-2 px-2 w-16 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {items.map((item, index) => {
                      const discountedRate = item.rate * (1 - masterDiscountPercent / 100);
                      const finalAmount = item.qty * discountedRate;

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/40 group text-[11px]">
                          {/* SR No */}
                          <td className="py-1.5 px-2 text-center font-mono font-semibold text-slate-500">{index + 1}</td>
                          
                          {/* Image Box */}
                          {showImages && (
                            <td className="py-1.5 px-2 text-center">
                              <div className="relative w-10 h-10 bg-slate-100 rounded overflow-hidden border border-slate-200 group/img flex items-center justify-center mx-auto">
                                {item.image ? (
                                  <img src={item.image} alt="Furniture" className="w-full h-full object-contain bg-white p-0.5" />
                                ) : (
                                  <Image className="w-4 h-4 text-slate-300" />
                                )}
                                
                                <div className="absolute inset-0 bg-slate-900/65 opacity-0 group-hover/img:opacity-100 transition flex flex-col items-center justify-center gap-0.5">
                                  <label className="cursor-pointer text-[8px] text-white font-extrabold hover:underline">
                                    Upload
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(item.id, e)} />
                                  </label>
                                  <button type="button" onClick={() => handleCameraCapture(item.id)} className="text-[8px] text-amber-300 font-extrabold hover:underline">
                                    Snap
                                  </button>
                                </div>
                              </div>
                            </td>
                          )}

                          {/* Description & AI Assist Trigger */}
                          <td className="py-2 px-2">
                            <div className="space-y-1">
                              <textarea
                                value={item.description}
                                onChange={(e) => handleUpdateItem(item.id, { description: e.target.value })}
                                className="w-full bg-transparent focus:bg-white text-xs text-slate-800 p-1 rounded border border-transparent focus:border-slate-200 resize-none font-medium text-wrap focus:outline-none leading-snug"
                                rows={2}
                              />
                              <button
                                type="button"
                                onClick={() => openAiTool('description', index)}
                                className="inline-flex items-center gap-1 text-[9px] text-blue-600 bg-blue-50/80 hover:bg-blue-100 font-bold px-1.5 py-0.5 rounded cursor-pointer transition"
                              >
                                <Sparkles className="w-2.5 h-2.5" /> AI Expand Description
                              </button>
                            </div>
                          </td>

                          {/* UOM */}
                          <td className="py-2 px-2 text-center">
                            <select
                              value={item.uom}
                              onChange={(e) => handleUpdateItem(item.id, { uom: e.target.value })}
                              className="bg-transparent border border-slate-200 p-1 rounded text-[11px] focus:outline-none focus:border-blue-500 font-bold"
                            >
                              {DEFAULT_UOMS.map(u => (
                                <option key={u} value={u}>{u}</option>
                              ))}
                            </select>
                          </td>

                          {/* Qty */}
                          <td className="py-2 px-2 text-center">
                            <input
                              type="number"
                              min="1"
                              value={item.qty}
                              onChange={(e) => handleUpdateItem(item.id, { qty: Math.max(1, parseInt(e.target.value, 10) || 0) })}
                              className="w-10 border border-slate-200 p-1 rounded text-[11px] focus:outline-none focus:border-blue-500 font-mono text-center font-bold"
                            />
                          </td>

                          {/* Rate */}
                          <td className="py-2 px-2 text-right">
                            <input
                              type="number"
                              min="0"
                              value={item.rate}
                              onChange={(e) => handleUpdateItem(item.id, { rate: Math.max(0, parseFloat(e.target.value) || 0) })}
                              className="w-18 border border-slate-200 p-1 rounded text-[11px] text-right focus:outline-none focus:border-blue-500 font-mono font-bold"
                            />
                          </td>

                          {/* Rate After Disc */}
                          <td className="py-2 px-2 text-right font-mono font-bold text-slate-500">
                            ₹{discountedRate.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </td>

                          {/* Final Amount */}
                          <td className="py-2 px-2 text-right font-mono font-bold text-slate-900 bg-slate-50/10">
                            ₹{finalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </td>

                          {/* Actions Reorders */}
                          <td className="py-2 px-2 text-center">
                            <div className="flex items-center justify-center gap-0.5">
                              <button
                                type="button"
                                disabled={index === 0}
                                onClick={() => moveItem(index, 'up')}
                                className="p-1 bg-slate-50 hover:bg-slate-100 rounded text-slate-500 disabled:opacity-30 cursor-pointer"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              
                              <button
                                type="button"
                                disabled={index === items.length - 1}
                                onClick={() => moveItem(index, 'down')}
                                className="p-1 bg-slate-50 hover:bg-slate-100 rounded text-slate-500 disabled:opacity-30 cursor-pointer"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item.id)}
                                className="p-1 bg-rose-50 hover:bg-rose-100 rounded text-rose-600 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* If Group-Wise Type Style */
              <div className="space-y-4">
                {groups.map((groupName, gIdx) => {
                  const groupedItems = items.filter(it => it.groupName === groupName);

                  return (
                    <div 
                      key={gIdx} 
                      onDragOver={(e) => {
                        e.preventDefault();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggingId) {
                          setItems(items.map(it => it.id === draggingId ? { ...it, groupName: groupName } : it));
                          setDraggingId(null);
                        }
                      }}
                      className={`border rounded p-3 space-y-2.5 transition-all duration-150 ${
                        draggingId && items.find(it => it.id === draggingId)?.groupName !== groupName
                          ? 'border-blue-500 border-dashed bg-blue-50/20 scale-[0.99] ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-slate-50/30'
                      }`}
                    >
                      <div className="flex items-center justify-between border-b border-slate-200/55 pb-1 text-xs">
                        <span className="font-bold text-blue-900 flex items-center gap-1.5">
                          <span className="w-1.5 h-3 bg-blue-600 rounded"></span>
                          Block: {groupName} ({groupedItems.length} items)
                        </span>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-slate-400 italic">Drag items here to re-group</span>
                          <button
                            type="button"
                            onClick={() => handleAddItem(groupName)}
                            className="text-[10px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-0.5 rounded cursor-pointer border border-blue-250/20"
                          >
                            + Add Row inside block
                          </button>
                        </div>
                      </div>

                      {groupedItems.length > 0 ? (
                        <div className="overflow-x-auto bg-white rounded p-1.5 border border-slate-200/70">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-slate-200 text-slate-400 font-extrabold text-[9px] uppercase tracking-wider">
                                <th className="py-2 px-2 w-14 text-center">Sr</th>
                                {showImages && <th className="py-2 px-2 w-12 text-center">Image</th>}
                                <th className="py-2 px-2 min-w-[180px]">Furniture Description</th>
                                <th className="py-2 px-2 w-14 text-center">UOM</th>
                                <th className="py-2 px-2 w-10 text-center">Qty</th>
                                <th className="py-2 px-2 w-18 text-right">Rate (₹)</th>
                                <th className="py-2 px-2 w-20 text-right">Amount (₹)</th>
                                <th className="py-2 px-2 w-28 text-center">Manage</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                              {groupedItems.map((item) => {
                                // Find overall index of this item in prime catalog
                                const primeIndex = items.findIndex(it => it.id === item.id);
                                const discountedRate = item.rate * (1 - masterDiscountPercent / 100);
                                const finalAmount = item.qty * discountedRate;

                                return (
                                  <tr 
                                    key={item.id} 
                                    draggable={true}
                                    onDragStart={() => {
                                      setDraggingId(item.id);
                                    }}
                                    onDragEnd={() => {
                                      setDraggingId(null);
                                    }}
                                    className={`hover:bg-slate-50/40 text-[11px] transition-colors focus-within:bg-slate-50/20 ${
                                      draggingId === item.id ? 'opacity-40 bg-blue-50/30 cursor-grabbing' : 'cursor-grab'
                                    }`}
                                  >
                                    {/* Continuous global numbering + Drag handle as requested */}
                                    <td className="py-1 px-2 text-center font-mono text-slate-400 font-semibold select-none">
                                      <div className="flex items-center justify-center gap-1">
                                        <GripVertical className="w-3.5 h-3.5 text-slate-350 cursor-grab active:cursor-grabbing hover:text-slate-500" />
                                        <span>{primeIndex + 1}</span>
                                      </div>
                                    </td>
                                    
                                    {showImages && (
                                      <td className="py-1 px-2 text-center">
                                        <div className="relative w-10 h-10 bg-slate-100 rounded overflow-hidden border border-slate-200 group/img flex items-center justify-center mx-auto">
                                          {item.image ? (
                                            <img src={item.image} alt="Furniture" className="w-full h-full object-contain bg-white p-0.5" />
                                          ) : (
                                            <Image className="w-4 h-4 text-slate-300" />
                                          )}
                                          
                                          <div className="absolute inset-0 bg-slate-900/65 opacity-0 group-hover/img:opacity-100 transition flex flex-col items-center justify-center gap-0.5">
                                            <label className="cursor-pointer text-[8px] text-white font-extrabold hover:underline">
                                              Upload
                                              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(item.id, e)} />
                                            </label>
                                            <button type="button" onClick={() => handleCameraCapture(item.id)} className="text-[8px] text-amber-300 font-extrabold hover:underline">
                                              Snap
                                            </button>
                                          </div>
                                        </div>
                                      </td>
                                    )}

                                    <td className="py-1.5 px-2">
                                      <div className="space-y-1">
                                        <textarea
                                          value={item.description}
                                          onChange={(e) => handleUpdateItem(item.id, { description: e.target.value })}
                                          className="w-full bg-transparent focus:bg-white text-xs text-slate-800 p-1 rounded border border-transparent focus:border-slate-200 resize-none font-medium focus:outline-none leading-snug"
                                          rows={2}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => openAiTool('description', primeIndex)}
                                          className="inline-flex items-center gap-1 text-[9px] text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded font-bold transition cursor-pointer"
                                        >
                                          <Sparkles className="w-2.5 h-2.5" /> AI expand
                                        </button>
                                      </div>
                                    </td>

                                    <td className="py-1 px-2 text-center">
                                      <select
                                        value={item.uom}
                                        onChange={(e) => handleUpdateItem(item.id, { uom: e.target.value })}
                                        className="bg-transparent border border-slate-200 rounded text-2xs focus:outline-none"
                                      >
                                        {DEFAULT_UOMS.map(u => (
                                          <option key={u} value={u}>{u}</option>
                                        ))}
                                      </select>
                                    </td>

                                    <td className="py-1 px-2 text-center">
                                      <input
                                        type="number"
                                        min="1"
                                        value={item.qty}
                                        onChange={(e) => handleUpdateItem(item.id, { qty: Math.max(1, parseInt(e.target.value, 10)) })}
                                        className="w-9 border border-slate-200 p-0.5 rounded text-2xs text-center font-mono font-bold"
                                      />
                                    </td>

                                    <td className="py-1 px-2 text-right">
                                      <input
                                        type="number"
                                        value={item.rate}
                                        onChange={(e) => handleUpdateItem(item.id, { rate: Math.max(0, parseFloat(e.target.value) || 0) })}
                                        className="w-14 border border-slate-200 p-0.5 rounded text-2xs font-mono text-right font-semibold font-bold"
                                      />
                                    </td>

                                    <td className="py-1 px-2 text-right font-mono font-bold text-slate-900 bg-slate-50/20">
                                      ₹{finalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                    </td>

                                    <td className="py-1 px-2 text-center">
                                      <div className="flex flex-col gap-1 items-center justify-center">
                                        <div className="flex justify-center gap-0.5">
                                          <button
                                            type="button"
                                            disabled={primeIndex === 0}
                                            onClick={() => moveItem(primeIndex, 'up')}
                                            className="p-1 bg-slate-50 hover:bg-slate-100 rounded text-slate-500 disabled:opacity-30 cursor-pointer"
                                          >
                                            <ArrowUp className="w-3 h-3" />
                                          </button>
                                          <button
                                            type="button"
                                            disabled={primeIndex === items.length - 1}
                                            onClick={() => moveItem(primeIndex, 'down')}
                                            className="p-1 bg-slate-50 hover:bg-slate-100 rounded text-slate-500 disabled:opacity-30 cursor-pointer opacity-80"
                                          >
                                            <ArrowDown className="w-3 h-3" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveItem(item.id)}
                                            className="p-1 bg-rose-50 hover:bg-rose-150 rounded text-rose-600 cursor-pointer"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>

                                        {/* Row Mover Selector Dropdown */}
                                        <select
                                          value={groupName}
                                          onChange={(e) => handleUpdateItem(item.id, { groupName: e.target.value })}
                                          className="text-[9px] bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-600 font-bold max-w-[100px] text-ellipsis placeholder-clip focus:outline-none focus:border-blue-500"
                                          title="Move item blocks"
                                        >
                                          {groups.map((g) => (
                                            <option key={g} value={g}>{g}</option>
                                          ))}
                                        </select>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-2xs text-slate-400 bg-white rounded border border-dashed border-slate-200">
                          Empty Block. Grab a row and drop it here, or click "+ Add Row inside block" to include items.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 4: Specifications & Terms Toggles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Spec Sheet Checklist Overrides */}
            <div className="bg-white rounded border border-slate-200 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 font-display flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[10px]">4</span>
                  Material Specifications Selectors
                </h3>
                
                <button
                  type="button"
                  onClick={() => openAiTool('recommendation')}
                  className="text-[9px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200/50 cursor-pointer transition"
                >
                  <Sparkles className="w-2.5 h-2.5 inline mr-0.5 text-blue-650" /> AI Suggestions
                </button>
              </div>

              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {specs.map((spec, sIdx) => (
                  <div key={spec.id} className="flex gap-2 p-1.5 bg-slate-50 hover:bg-slate-100/50 rounded transition text-xs items-center border border-slate-200/60 shadow-3xs">
                    <input
                      type="checkbox"
                      checked={spec.checked}
                      onChange={(e) => {
                        const updated = [...specs];
                        updated[sIdx].checked = e.target.checked;
                        setSpecs(updated);
                      }}
                      className="rounded border-slate-300 text-blue-650 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={spec.text}
                      onChange={(e) => {
                        const updated = [...specs];
                        updated[sIdx].text = e.target.value;
                        setSpecs(updated);
                      }}
                      className="flex-1 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 text-slate-850 text-[11px] font-semibold focus:bg-white p-0.5 outline-none font-medium h-6 leading-none"
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
                  <p className="text-2xs text-slate-400 italic text-center py-4">No specs configured. Click "+ Add Spec" below.</p>
                )}
              </div>
              
              <button
                type="button"
                onClick={() => {
                  setSpecs([...specs, { id: 'spec-' + Date.now() + Math.random(), text: 'New custom material core spec listing', checked: true }]);
                }}
                className="w-full mt-2 border border-dashed border-blue-300 bg-blue-50/10 hover:bg-blue-50/35 text-blue-700 hover:text-blue-800 rounded py-1.5 text-[9.5px] font-black uppercase tracking-wider text-center cursor-pointer select-none transition"
              >
                ⚡ + Add Custom Specification Inline
              </button>
            </div>

            {/* Terms of Service checklist */}
            <div className="bg-white rounded border border-slate-200 p-4 shadow-2xs space-y-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 font-display flex items-center gap-1.5 pb-1 border-b border-slate-50">
                <span className="w-5 h-5 rounded bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[10px]">5</span>
                Terms & Conditions Selectors
              </h3>
              
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {terms.map((term, tIdx) => (
                  <div key={term.id} className="flex gap-2 p-1.5 bg-slate-50 hover:bg-slate-100/50 rounded transition text-xs items-center border border-slate-200/60 shadow-3xs">
                    <input
                      type="checkbox"
                      checked={term.checked}
                      onChange={(e) => {
                        const updated = [...terms];
                        updated[tIdx].checked = e.target.checked;
                        setTerms(updated);
                      }}
                      className="rounded border-slate-300 text-blue-650 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={term.text}
                      onChange={(e) => {
                        const updated = [...terms];
                        updated[tIdx].text = e.target.value;
                        setTerms(updated);
                      }}
                      className="flex-1 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 text-slate-850 text-[11px] font-semibold focus:bg-white p-0.5 outline-none font-medium h-6 leading-none"
                      placeholder="Enter terms condition note description..."
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
                  <p className="text-2xs text-slate-400 italic text-center py-4">No terms configured. Click "+ Add Custom Term" below.</p>
                )}
              </div>
              
              <button
                type="button"
                onClick={() => {
                  setTerms([...terms, { id: 'term-' + Date.now() + Math.random(), text: 'New custom term & condition note', checked: true }]);
                }}
                className="w-full mt-2 border border-dashed border-blue-300 bg-blue-50/10 hover:bg-blue-50/35 text-blue-700 hover:text-blue-800 rounded py-1.5 text-[9.5px] font-black uppercase tracking-wider text-center cursor-pointer select-none transition"
              >
                ⚡ + Add Custom Term Inline
              </button>
            </div>

          </div>

          {/* Section 5: Bank Details & Stamp/Sign Settings */}
          <div className="bg-white rounded border border-slate-200 p-4 shadow-2xs grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <h4 className="font-bold font-display text-2xs uppercase tracking-wider text-slate-800">Bank Details Toggles</h4>
                <label className="relative inline-flex items-center cursor-pointer scale-85">
                  <input
                    type="checkbox"
                    checked={bankDetails.showInQuotation}
                    onChange={(e) => setBankDetails({ ...bankDetails, showInQuotation: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-650"></div>
                  <span className="ml-2 text-[10px] font-bold text-slate-500">Include wiring</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] font-medium text-slate-600 bg-slate-50/50 rounded border border-slate-100 p-2 font-mono">
                <div>
                  <span className="text-slate-400 block uppercase font-bold text-[8px]">holder</span>
                  {bankDetails.accountName}
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-bold text-[8px]">A/C No</span>
                  {bankDetails.accountNo}
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-bold text-[8px]">IFSC</span>
                  {bankDetails.ifsc}
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-bold text-[8px]">Branch</span>
                  {bankDetails.bankBranch}
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <h4 className="font-bold font-display text-2xs uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-1.5">Executive & Status Settings</h4>
              <div className="grid grid-cols-1 gap-2">
                <div className="space-y-0.5">
                  <label className="text-[8px] font-bold text-slate-400 uppercase">Quotation Status</label>
                  <select
                    value={status}
                    onChange={(e: any) => setStatus(e.target.value)}
                    className="w-full text-xs text-slate-800 border border-slate-200 p-1.5 rounded bg-white font-bold focus:outline-none"
                  >
                    <option value="Pending">🕒 Pending Review</option>
                    <option value="Approved">🟢 Approved/Closed</option>
                    <option value="Rejected">🔴 Declined/Void</option>
                  </select>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Quick estimate visual summary RHS panel */}
        <div className="space-y-4">
          
          {/* Summary pricing gauge card */}
          <div className="bg-white rounded border border-slate-200 p-4 shadow-2xs sticky top-4 space-y-3">
            <h3 className="font-bold font-display text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-1.5">
              Estimate Summary
            </h3>

            <div className="space-y-2 text-2xs text-slate-600 font-medium font-mono">
              <div className="flex justify-between">
                <span>Subtotal ({items.length} items)</span>
                <span>₹{subtotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              </div>
              
              {isMaharashtra ? (
                <>
                  <div className="flex justify-between text-slate-450">
                    <span>CGST (9%)</span>
                    <span>₹{(subtotal * 0.09).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex justify-between text-slate-450">
                    <span>SGST (9%)</span>
                    <span>₹{(subtotal * 0.09).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-slate-450">
                  <span>IGST (18%)</span>
                  <span>₹{totalGstAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>
              )}

              <hr className="border-slate-100" />

              <div className="flex justify-between text-slate-900 font-bold text-xs bg-slate-50 p-2 rounded border border-slate-200">
                <span className="font-display font-bold">Total Value</span>
                <span className="font-bold">₹{grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              </div>
            </div>

            {/* AI Assistant Rapid triggers */}
            <hr className="border-slate-100" />

            <div className="space-y-1.5">
              <span className="text-[9px] font-bold text-blue-700 block uppercase tracking-wider">💡 Furniture AI Assistant</span>
              
              <button
                type="button"
                onClick={() => openAiTool('audit')}
                className="w-full flex items-center justify-between text-left text-[10px] text-blue-700 bg-blue-50/60 hover:bg-blue-100/70 p-2 rounded font-bold cursor-pointer transition border border-blue-100/50"
              >
                <span>Audit Pricing & GST Rules</span>
                <ChevronRight className="w-3 h-3" />
              </button>

              <button
                type="button"
                onClick={() => openAiTool('optimize')}
                className="w-full flex items-center justify-between text-left text-[10px] text-blue-700 bg-blue-50/60 hover:bg-blue-100/70 p-2 rounded font-bold cursor-pointer transition border border-blue-100/50"
              >
                <span>Cost Saving Options</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* DOCK SLIDEOUT AI COPILOT */}
      {aiPanelActive && aiTool && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex justify-end animate-fade-in no-print">
          <div className="w-full max-w-md bg-white h-full border-l border-slate-200 shadow-2xl p-4 flex flex-col justify-between overflow-y-auto space-y-4 font-sans text-xs">
            
            <div className="space-y-4">
              {/* Slide header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold font-display text-slate-800 text-sm">Furniture AI Copilot</h3>
                    <p className="text-[10px] text-slate-400">Powered by Gemini 3.5-Flash</p>
                  </div>
                </div>
                <button
                  onClick={() => setAiPanelActive(false)}
                  className="font-bold text-slate-400 hover:text-slate-600 text-base p-1 hover:bg-slate-100 rounded focus:outline-none cursor-pointer"
                >
                  ×
                </button>
              </div>

              {/* Tool 1:expand Description */}
              {aiTool === 'description' && (
                <div className="space-y-3">
                  <div className="bg-slate-50 p-2.5 rounded text-slate-550 italic leading-relaxed text-[11px]">
                    Generate professional detailed material writeups for your quotation item list.
                  </div>

                  <div className="space-y-0.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Furniture Product Title</label>
                    <input
                      type="text"
                      value={aiProductTitle}
                      onChange={(e) => setAiProductTitle(e.target.value)}
                      placeholder="e.g. sliding 3-door wardrobe"
                      className="w-full text-xs text-slate-850 border border-slate-200 rounded p-1.5 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-0.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Optional Special Addons / Details</label>
                    <textarea
                      rows={3}
                      value={aiProductDetails}
                      onChange={(e) => setAiProductDetails(e.target.value)}
                      placeholder="e.g. high gloss laminate exterior, gold handles, integrated shoe compartment..."
                      className="w-full text-xs text-slate-850 border border-slate-200 rounded p-1.5 focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Tool 2: materials suggestion */}
              {aiTool === 'recommendation' && (
                <div className="space-y-3">
                  <div className="bg-slate-50 p-2.5 rounded text-slate-550 italic text-[11px]">
                    Find the perfect balance of plywood core, wood-grade thickness and premium brand hardware fits.
                  </div>

                  <div className="space-y-0.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Furniture Category</label>
                    <input
                      type="text"
                      value={aiProductTitle}
                      onChange={(e) => setAiProductTitle(e.target.value)}
                      placeholder="e.g. Modular Kitchen setup or LCD TV Rack Unit"
                      className="w-full text-xs text-slate-850 border border-slate-200 rounded p-1.5 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-0.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Client Quality Standard</label>
                    <select
                      value={aiProductDetails}
                      onChange={(e) => setAiProductDetails(e.target.value)}
                      className="w-full text-xs text-slate-850 border border-slate-200 rounded p-1.5 bg-white focus:border-blue-500"
                    >
                      <option value="Premium Classic">Premium Classic (standard plywood, Marino laminate)</option>
                      <option value="Luxury High-End">Luxury Premium (Acrylic high gloss, Blum channels)</option>
                      <option value="Economic Cost-Effective">Economic Core (Commercial MR Plym, basic sliders)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Tool 3: audit check */}
              {aiTool === 'audit' && (
                <div className="space-y-3">
                  <div className="bg-blue-50 text-blue-800 p-3 rounded border border-blue-100 text-xs">
                    Executing complete mathematical pricing validation, discount redundancy check and GST state alignment audits.
                  </div>
                  
                  {aiAuditResult && (
                    <div className="space-y-3.5 text-2xs font-medium">
                      <div className="bg-amber-50 text-amber-900 p-3 rounded-xl border border-amber-100 space-y-1">
                        <span className="font-bold uppercase tracking-wider text-3xs">Audit Alerts & Warnings</span>
                        <ul className="list-disc pl-4 space-y-1 mt-1 leading-normal text-slate-800">
                          {aiAuditResult.warnings?.map((w: string, idx: number) => (
                            <li key={idx}>{w}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-1">
                        <span className="text-slate-400 block uppercase text-3xs font-bold">Rates Analysis</span>
                        <p className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-normal">{aiAuditResult.pricingReview}</p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-slate-400 block uppercase text-3xs font-bold">Master Discount Impact</span>
                        <p className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-normal">{aiAuditResult.discountsCommentary}</p>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-slate-400 block uppercase text-3xs font-bold">Automatic ERP Verification Checklist</span>
                        <div className="space-y-1">
                          {aiAuditResult.checklist?.map((c: any, idx: number) => (
                            <div key={idx} className="flex gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                              <span className={`w-1.5 h-1.5 rounded-full ${c.passed ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                              <div className="leading-snug">
                                <span className="font-bold text-slate-805 block">{c.item}</span>
                                <span className="text-slate-400">{c.reason}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tool 4: Optimization savings */}
              {aiTool === 'optimize' && (
                <div className="space-y-4">
                  <div className="bg-emerald-50 text-emerald-805 p-3 rounded-xl text-xs leading-normal">
                    This module value-engineers the carcass ply composition and compares domestic hardware alternatives to save material costs.
                  </div>

                  {aiOptimizeResult && (
                    <div className="space-y-4 text-2xs font-medium">
                      <div className="space-y-2">
                        <span className="text-slate-400 block uppercase font-bold text-3xs">Value-Engineering Substitutions</span>
                        <div className="space-y-2.5">
                          {aiOptimizeResult.recommendations?.map((rec: any, idx: number) => (
                            <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-150 space-y-1">
                              <div className="flex justify-between items-center text-slate-450 uppercase font-black text-3xs">
                                <span>{rec.scope}</span>
                                <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">{rec.costReduction}</span>
                              </div>
                              <div className="text-slate-705">
                                <span className="font-bold block mt-1">Change from: <span className="ring-1 ring-slate-200 bg-white px-1 rounded text-red-500 font-mono italic">{rec.originalSpecification}</span></span>
                                <span className="font-bold block mt-1">Substitute to: <span className="ring-1 ring-emerald-200 bg-emerald-50 px-1 rounded text-emerald-600 font-mono font-bold">{rec.alternativeSpecification}</span></span>
                              </div>
                              <p className="text-slate-400 mt-1 italic leading-normal">Stuctural impact: {rec.structuralRisk || 'Minimal'}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-blue-50 text-blue-900 border border-blue-100 p-3 rounded-xl space-y-1 mt-2">
                        <span className="font-bold uppercase tracking-wider text-3xs flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-blue-700" /> Target Savings Yield
                        </span>
                        <p className="text-slate-805 leading-relaxed">{aiOptimizeResult.potentialSavingsSummary}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Standard text prompt result renderer */}
              {aiOutputText && (
                <div className="space-y-2 mt-4">
                  <span className="text-[10px] font-bold text-blue-600 block uppercase font-sans">Generated Output</span>
                  <div className="bg-slate-50 text-slate-800 p-3 rounded-xl border border-slate-150 font-medium text-xs leading-normal whitespace-pre-wrap">
                    {aiOutputText}
                  </div>
                </div>
              )}

              {aiRecommendResult && (
                <div className="space-y-3.5 mt-4 text-2xs font-medium">
                  <span className="text-[10px] font-bold text-blue-600 block uppercase">Recommended Materials</span>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150 space-y-3">
                    <p className="leading-snug"><span className="text-slate-400 block text-3xs uppercase">Plywood Core Specification</span> <span className="font-semibold text-slate-800">{aiRecommendResult.plywood}</span></p>
                    <p className="leading-snug"><span className="text-slate-400 block text-3xs uppercase">External Laminate Standard</span> <span className="font-semibold text-slate-800">{aiRecommendResult.externalLaminate}</span></p>
                    <p className="leading-snug"><span className="text-slate-400 block text-3xs uppercase">Internal Backer Backing</span> <span className="font-semibold text-slate-800">{aiRecommendResult.internalLaminate}</span></p>
                    <p className="leading-snug"><span className="text-slate-400 block text-3xs uppercase">Hardware Recommended</span> <span className="font-semibold text-slate-800">{aiRecommendResult.hardware}</span></p>
                    <p className="leading-snug"><span className="text-slate-400 block text-3xs uppercase">Laminate Brand Selection</span> <span className="font-semibold text-slate-800">{aiRecommendResult.laminateBrand}</span></p>
                  </div>
                </div>
              )}

              {aiLoading && (
                <div className="flex flex-col items-center justify-center py-10 space-y-2 text-xs text-blue-600 font-semibold">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Drafting intelligent furniture architecture blueprints...</span>
                </div>
              )}
            </div>

            {/* Slideout footer button triggers */}
            <div className="border-t border-slate-100 pt-4 flex gap-2">
              {(!aiOutputText && !aiRecommendResult && !aiAuditResult && !aiOptimizeResult) ? (
                <button
                  type="button"
                  disabled={aiLoading}
                  onClick={handleCallAi}
                  className="w-full bg-blue-600 hover:bg-blue-700 font-bold text-xs text-white py-2.5 rounded transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Execute AI Agent
                </button>
              ) : (
                <>
                  {aiTool === 'description' && (
                    <button
                      type="button"
                      onClick={applyDescriptionToItem}
                      className="w-full bg-blue-600 hover:bg-blue-700 font-bold text-xs text-white py-2.5 rounded transition cursor-pointer"
                    >
                      Apply To Item Row Description
                    </button>
                  )}
                  {aiTool === 'recommendation' && (
                    <button
                      type="button"
                      onClick={applyMaterialRecommendation}
                      className="w-full bg-blue-600 hover:bg-blue-700 font-bold text-xs text-white py-2.5 rounded transition cursor-pointer"
                    >
                      Inject into Material Specifications
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setAiOutputText('');
                      setAiRecommendResult(null);
                      setAiAuditResult(null);
                      setAiOptimizeResult(null);
                    }}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded transition cursor-pointer"
                  >
                    Clear & Query again
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
