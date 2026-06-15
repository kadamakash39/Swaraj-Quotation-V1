import React, { useState, FormEvent } from 'react';
import { 
  Printer, ArrowLeft, Mail, Phone, ExternalLink, Calendar, 
  MapPin, CheckSquare, Plus, FileText, Send, Share2, ShieldCheck, SquareCode 
} from 'lucide-react';
import { Quotation, Customer, CompanyProfile } from '../types';

// Convert numbers into Words in standard Indian Rupees / Paise formatting
export function convertNumberToWords(num: number): string {
  if (num === 0) return 'Zero';
  
  const singleDigits = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const doubleDigits = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tensMultiple = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  
  const getWord = (n: number): string => {
    let str = "";
    if (n > 99) {
      str += singleDigits[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n > 19) {
      str += tensMultiple[Math.floor(n / 10)] + " ";
      n %= 10;
    }
    if (n > 9 && n < 20) {
      str += doubleDigits[n - 10] + " ";
    } else if (n > 0) {
      str += singleDigits[n] + " ";
    }
    return str;
  };

  let numStr = Math.floor(num);
  let words = "";

  if (numStr >= 10000000) {
    words += getWord(Math.floor(numStr / 10000000)) + "Crore ";
    numStr %= 10000000;
  }
  if (numStr >= 100000) {
    words += getWord(Math.floor(numStr / 100000)) + "Lakh ";
    numStr %= 100000;
  }
  if (numStr >= 1000) {
    words += getWord(Math.floor(numStr / 1000)) + "Thousand ";
    numStr %= 1000;
  }
  words += getWord(numStr);

  const paise = Math.round((num - Math.floor(num)) * 100);
  let paiseWords = "";
  if (paise > 0) {
    let p = paise;
    if (p > 19) {
      paiseWords += tensMultiple[Math.floor(p / 10)] + " ";
      p %= 10;
    }
    if (p > 9 && p < 20) {
      paiseWords += doubleDigits[p - 10] + " ";
    } else if (p > 0) {
      paiseWords += singleDigits[p] + " ";
    }
    paiseWords = "and " + paiseWords.trim() + " Paise";
  }

  return (words.trim() + " " + paiseWords.trim()).trim();
}

interface A4PreviewProps {
  quotation: Quotation;
  customers: Customer[];
  companyProfile: CompanyProfile;
  onBack: () => void;
}

// Logical TableRow type for discrete paginator allocation
type TableRow =
  | { type: 'section_header'; sectionName: string }
  | { type: 'item'; item: any; idx: number }
  | { type: 'section_subtotal'; sectionName: string; subtotal: number };

interface PageTemplate {
  pageNumber: number;
  rows: TableRow[];
  hasHeader: boolean;
  hasBillingInfo: boolean;
  hasTableHeader: boolean;
  hasFinancialTotals: boolean;
  termIndices: number[];
  specIndices: number[];
  hasSignature: boolean;
}

// Helper to calculate row heights
function calculateRowHeight(row: TableRow, showImages: boolean): number {
  if (row.type === 'section_header' || row.type === 'section_subtotal') {
    return 26;
  }
  if (row.type === 'item') {
    if (showImages && row.item.image) {
      return 160;
    }
  }
  return 34; // standard item row height
}

// Robust, predictive pagination splitter to allocate table items page-by-page inside A4 limits
function paginateQuotation(
  quote: Quotation,
  companyProfile: CompanyProfile,
  activeTerms: any[],
  activeSpecs: any[],
  showImages: boolean
): PageTemplate[] {
  const tableRows: TableRow[] = [];
  const uniqueGroups = Array.from(new Set(quote.items.map(item => (item.groupName || '').trim()).filter(Boolean)));
  const isGroupWise = uniqueGroups.length > 0;

  if (isGroupWise) {
    const ungroupedItems = quote.items.filter(item => !(item.groupName || '').trim());
    if (ungroupedItems.length > 0) {
      tableRows.push({ type: 'section_header', sectionName: 'General Items' });
      ungroupedItems.forEach(item => {
        const idx = quote.items.findIndex(qi => qi.id === item.id);
        tableRows.push({ type: 'item', item, idx });
      });
      const subtotal = ungroupedItems.reduce((sum, item) => {
        const discountedRate = item.rate * (1 - quote.masterDiscountPercent / 100);
        return sum + (item.qty * discountedRate);
      }, 0);
      tableRows.push({ type: 'section_subtotal', sectionName: 'General Items', subtotal });
    }
    
    uniqueGroups.forEach(gName => {
      tableRows.push({ type: 'section_header', sectionName: gName });
      const groupItems = quote.items.filter(item => (item.groupName || '').trim() === gName);
      groupItems.forEach(item => {
        const idx = quote.items.findIndex(qi => qi.id === item.id);
        tableRows.push({ type: 'item', item, idx });
      });
      const subtotal = groupItems.reduce((sum, item) => {
        const discountedRate = item.rate * (1 - quote.masterDiscountPercent / 100);
        return sum + (item.qty * discountedRate);
      }, 0);
      tableRows.push({ type: 'section_subtotal', sectionName: gName, subtotal });
    });
  } else {
    quote.items.forEach((item, idx) => {
      tableRows.push({ type: 'item', item, idx });
    });
  }

  const pages: PageTemplate[] = [];
  
  // Available height limit for layout blocks inside A4 portrait inside safe print bounds
  const totalA4Height = 930; 
  const headerHeight = 125;
  const billingInfoHeight = 115;
  const tableHeaderHeight = 36;
  const termHeaderHeight = 25;
  const specHeaderHeight = 25;
  const financialTotalsHeight = 145;
  const signatureHeight = 135;

  let currentPageIndex = 0;
  
  // Cursor indices
  let rowCursor = 0;
  let termCursor = 0;
  let specCursor = 0;
  
  // Flags for blocks that must be placed
  let placedTotals = false;
  let placedSignature = false;

  while (
    rowCursor < tableRows.length ||
    !placedTotals ||
    termCursor < activeTerms.length ||
    specCursor < activeSpecs.length ||
    !placedSignature
  ) {
    const isPage1 = currentPageIndex === 0;
    
    // Start with base page overhead
    let heightUsed = headerHeight;
    if (isPage1) {
      heightUsed += billingInfoHeight;
    }
    
    const pageRows: TableRow[] = [];
    let pageHasTableHeader = false;
    let pageHasFinancialTotals = false;
    const pageTermIndices: number[] = [];
    const pageSpecIndices: number[] = [];
    let pageHasSignature = false;

    // 1. Pack Table Rows
    if (rowCursor < tableRows.length) {
      // We are going to pack some rows. First add the table header overhead.
      heightUsed += tableHeaderHeight;
      pageHasTableHeader = true;
      
      while (rowCursor < tableRows.length) {
        const row = tableRows[rowCursor];
        const rHeight = calculateRowHeight(row, showImages);
        if (heightUsed + rHeight <= totalA4Height) {
          pageRows.push(row);
          heightUsed += rHeight;
          rowCursor++;
        } else {
          // No more rows fit on this page
          break;
        }
      }
    }

    // 2. Pack Financial Totals Block
    if (rowCursor === tableRows.length && !placedTotals) {
      if (heightUsed + financialTotalsHeight <= totalA4Height) {
        pageHasFinancialTotals = true;
        heightUsed += financialTotalsHeight;
        placedTotals = true;
      }
    }

    // 3. Pack Terms & Conditions
    if (placedTotals && termCursor < activeTerms.length) {
      let termSectionHeaderAdded = false;
      const originalHeight = heightUsed;
      
      if (heightUsed + termHeaderHeight + 20 <= totalA4Height) {
        heightUsed += termHeaderHeight;
        termSectionHeaderAdded = true;
        
        while (termCursor < activeTerms.length) {
          const tHeight = 20; // safe single term points height
          if (heightUsed + tHeight <= totalA4Height) {
            pageTermIndices.push(termCursor);
            heightUsed += tHeight;
            termCursor++;
          } else {
            break;
          }
        }
      }
      
      if (pageTermIndices.length === 0 && termSectionHeaderAdded) {
        heightUsed = originalHeight;
      }
    }

    // 4. Pack Material Specifications
    if (placedTotals && termCursor === activeTerms.length && specCursor < activeSpecs.length) {
      let specSectionHeaderAdded = false;
      const originalHeight = heightUsed;
      
      if (heightUsed + specHeaderHeight + 20 <= totalA4Height) {
        heightUsed += specHeaderHeight;
        specSectionHeaderAdded = true;
        
        while (specCursor < activeSpecs.length) {
          const sHeight = 20; // safe single spec points height
          if (heightUsed + sHeight <= totalA4Height) {
            pageSpecIndices.push(specCursor);
            heightUsed += sHeight;
            specCursor++;
          } else {
            break;
          }
        }
      }
      
      if (pageSpecIndices.length === 0 && specSectionHeaderAdded) {
        heightUsed = originalHeight;
      }
    }

    // 5. Pack Signature Block
    if (
      placedTotals &&
      termCursor === activeTerms.length &&
      specCursor === activeSpecs.length &&
      !placedSignature
    ) {
      if (heightUsed + signatureHeight <= totalA4Height) {
        pageHasSignature = true;
        heightUsed += signatureHeight;
        placedSignature = true;
      }
    }

    // Guard: if nothing was placed on this page, force pack something to avoid infinite loops
    if (
      pageRows.length === 0 &&
      !pageHasFinancialTotals &&
      pageTermIndices.length === 0 &&
      pageSpecIndices.length === 0 &&
      !pageHasSignature
    ) {
      if (rowCursor < tableRows.length) {
        const row = tableRows[rowCursor];
        pageRows.push(row);
        rowCursor++;
      } else if (!placedTotals) {
        pageHasFinancialTotals = true;
        placedTotals = true;
      } else if (termCursor < activeTerms.length) {
        pageTermIndices.push(termCursor);
        termCursor++;
      } else if (specCursor < activeSpecs.length) {
        pageSpecIndices.push(specCursor);
        specCursor++;
      } else if (!placedSignature) {
        pageHasSignature = true;
        placedSignature = true;
      }
    }

    pages.push({
      pageNumber: currentPageIndex + 1,
      rows: pageRows,
      hasHeader: true,
      hasBillingInfo: isPage1,
      hasTableHeader: pageHasTableHeader,
      hasFinancialTotals: pageHasFinancialTotals,
      termIndices: pageTermIndices,
      specIndices: pageSpecIndices,
      hasSignature: pageHasSignature,
    });

    currentPageIndex++;
  }

  return pages;
}

export default function A4Preview({
  quotation,
  customers,
  companyProfile,
  onBack
}: A4PreviewProps) {

  const [shareType, setShareType] = useState<'Email' | 'WhatsApp' | null>(null);
  const [recipient, setRecipient] = useState('');
  const [subjectMsg, setSubjectMsg] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const matchedCustomer = customers.find(c => c.id === quotation.customerId);

  // India ERP standard taxation calculations
  const grossSubtotal = quotation.items.reduce((sum, item) => sum + (item.qty * item.rate), 0);

  const taxableValue = quotation.items.reduce((sum, item) => {
    const activeDisc = quotation.masterDiscountPercent;
    const discountedRate = item.rate * (1 - activeDisc / 100);
    return sum + (item.qty * discountedRate);
  }, 0);

  const totalDiscount = grossSubtotal - taxableValue;
  
  const isLocal = !matchedCustomer || matchedCustomer.state === 'Maharashtra';
  const cgstAmount = isLocal ? taxableValue * 0.09 : 0;
  const sgstAmount = isLocal ? taxableValue * 0.09 : 0;
  const igstAmount = !isLocal ? taxableValue * 0.18 : 0;
  const totalGstAmount = isLocal ? (cgstAmount + sgstAmount) : igstAmount;
  const grandTotal = taxableValue + totalGstAmount;

  // Render continuous Terms numbering properly
  const activeTerms = quotation.terms ? quotation.terms.filter(t => t.checked) : [];

  // Material Specifications unified array
  const activeSpecs = Array.isArray(quotation.materialSpecs)
    ? quotation.materialSpecs.filter(s => s.checked)
    : [
        { id: 'p', text: `Plywood Core: ${(quotation.materialSpecs as any).plywood || ''}` },
        { id: 'e', text: `External: ${(quotation.materialSpecs as any).externalLaminate || ''}` },
        { id: 'i', text: `Internal: ${(quotation.materialSpecs as any).internalLaminate || ''}` },
        { id: 'h', text: `Hardware: ${(quotation.materialSpecs as any).hardware || ''}` },
      ].filter(s => s.text.split(': ')[1]);

  // Boolean state to determine image printing
  const showImages = quotation.showImages !== false;

  // Paginate pages dynamically
  const pages = paginateQuotation(quotation, companyProfile, activeTerms, activeSpecs, showImages);

  // Trigger web system printing
  const triggerPrint = () => {
    window.print();
  };

  // Open share dialogue logic
  const handleOpenShare = (type: 'Email' | 'WhatsApp') => {
    setShareType(type);
    if (!matchedCustomer) return;

    if (type === 'Email') {
      setRecipient(matchedCustomer.email || 'customer@client.com');
      setSubjectMsg(`Quotation Estimate: ${quotation.id} | ${companyProfile.name}`);
      setBodyText(`Dear ${matchedCustomer.name},\n\nPlease find attached our formal quotation (${quotation.id}) for your custom furniture fabrication project.\n\nSummary:\n- Subtotal: Rs. ${taxableValue.toLocaleString('en-IN')}\n- Grand Total (Inc. 18% GST): Rs. ${grandTotal.toLocaleString('en-IN')}\n- Validity Until: ${quotation.validityDate}\n\nWe look forward to partnering with you on this project.\n\nBest regards,\n${companyProfile.name}\nMIDC Road, Baramati`);
    } else {
      setRecipient(matchedCustomer.mobile || '+91 99000 00000');
      setBodyText(`*${companyProfile.name} Quotation Estimate* \n\n*Code*: ${quotation.id}\n*Client*: ${matchedCustomer.name}\n*Amount*: Rs. ${grandTotal.toLocaleString('en-IN')} (Incl. GST)\n*Validity*: ${quotation.validityDate}\n\nView or download your professional A4 PDF invoice directly from our portal. Feel free to contact our sales manager for terms sign-off.\n\n_Thank you for choosing ${companyProfile.name}!_`);
    }
  };

  const executeSendSimulation = async (e: FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    try {
      const response = await fetch('/api/actions/send-quotation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: shareType,
          recipient,
          quotationId: quotation.id,
          templateText: bodyText
        })
      });
      const data = await response.json();
      alert(data.message);
      setShareType(null);
    } catch (err) {
      alert("Failed to submit digital dispatch simulation.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Scope print inline overrides to force full background print graphics and clean sizing */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0 !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            float: none !important;
            width: 210mm !important;
            height: 297mm !important;
            background: #ffffff !important;
            color: #000000 !important;
            overflow: visible !important;
          }
          #root {
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          #swraj-a4-pdf-canvas {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 210mm !important;
            background: transparent !important;
            display: block !important;
          }
          .print-page {
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            page-break-after: always !important;
            page-break-before: auto !important;
            page-break-inside: avoid !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            padding: 12mm 15mm 12mm 15mm !important;
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            position: relative !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #swraj-a4-pdf-canvas .print-page img {
            max-height: 120px !important;
            width: auto !important;
            object-fit: contain !important;
          }
          .no-print-background {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
      
      {/* Top action commands */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 text-white p-5 rounded-2xl shadow-md no-print border border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition text-slate-300 cursor-pointer"
            title="Return to list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold font-display">A4 Print & Export Center</h2>
            <p className="text-xs text-slate-400">Generate legal A4 tax sheets and trigger client WhatsApp receipts</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={triggerPrint}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white py-2 px-4 rounded-xl shadow cursor-pointer transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print / Save A4 PDF
          </button>

          <button
            onClick={() => handleOpenShare('WhatsApp')}
            className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-500 font-bold text-xs text-white py-2 px-4 rounded-xl cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            WhatsApp PDF
          </button>

          <button
            onClick={() => handleOpenShare('Email')}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white py-2 px-4 rounded-xl cursor-pointer"
          >
            <Mail className="w-4 h-4" />
            Email PDF
          </button>
        </div>
      </div>

      {/* Main split preview: Screen simulation representation */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Printable Document Sheet LHS (A4 standard preview pages) */}
        <div className="lg:col-span-3 space-y-6 select-text overflow-x-auto">
          
          {/* Printable Page Canvas wrapping multiple pagination containers */}
          <div 
            id="swraj-a4-pdf-canvas"
            className="space-y-6 print:space-y-0"
          >
            {pages.map((page, pIdx) => (
              <div 
                key={page.pageNumber}
                className="print-page w-[210mm] h-[297mm] min-h-[297mm] max-h-[297mm] mx-auto bg-white border border-slate-200 p-[12mm_15mm_12mm_15mm] font-sans shadow-lg text-slate-800 tracking-tight relative flex flex-col justify-start"
                style={{
                  pageBreakAfter: 'always',
                  marginBottom: pIdx === pages.length - 1 ? '0' : '24px',
                }}
              >
                
                {/* 1. TOP WRAPPER containing Header, billing details, and items table */}
                <div className="flex flex-col">
                  
                  {/* Page Header - Identical full branding header on all pages */}
                  <div className="flex justify-between items-start border-b border-slate-300 pb-3 mb-3 shrink-0">
                    <div className="flex items-start gap-1">
                      {!companyProfile.logo && (
                        <span className="font-extrabold text-[#1E3A8A] text-xl select-none mr-2">{'{LOGO}'}</span>
                      )}
                      {companyProfile.logo && (
                        <img 
                          src={companyProfile.logo} 
                          alt="Company Logo" 
                          className="w-18 h-18 object-contain rounded border border-slate-100 mr-2.5 shrink-0" 
                        />
                      )}
                      <div className="text-left font-sans">
                        <h1 className="text-xl font-black tracking-tight text-slate-900 leading-tight mb-1 text-left uppercase">
                          {companyProfile.name}
                        </h1>
                        <p className="text-[9px] text-slate-500 max-w-[340px] leading-snug text-left">{companyProfile.address}</p>
                        <p className="text-[9px] text-slate-555 font-medium font-sans text-left">
                          Email: {companyProfile.email} | Mobile: {companyProfile.mobile}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <h2 className="text-xl font-black text-[#1E3A8A] tracking-widest font-sans leading-none uppercase">QUOTATION</h2>
                      {page.pageNumber > 1 && (
                        <span className="font-mono text-[9px] font-bold text-slate-500 mt-1 block text-right">
                          Ref: {quotation.id}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Billing Info & Metadata */}
                  {page.hasBillingInfo && (
                    <div className="grid grid-cols-2 gap-4 pb-2.5 border-b border-slate-300 text-[10px] leading-snug font-sans mb-3 shrink-0">
                      <div className="space-y-0.5 text-left">
                        <p className="font-bold text-[#1E3A8A] text-[13px] mb-1.5 text-left">Bill To</p>
                        <p className="font-extrabold text-slate-900 text-[11.5px] tracking-tight leading-none mb-0.5 text-left">{matchedCustomer?.name || '[Client Name]'}</p>
                        {matchedCustomer?.companyName && (
                          <p className="font-bold text-slate-700 leading-none text-[10px] text-left">{matchedCustomer.companyName}</p>
                        )}
                        <p className="text-slate-655 max-w-[320px] leading-snug text-left">{matchedCustomer?.address || '[Client Address]'}</p>
                        {matchedCustomer?.city && (
                          <p className="text-slate-655 font-bold text-left">{matchedCustomer.city}, {matchedCustomer.state} - {matchedCustomer.pincode}</p>
                        )}
                        <p className="text-slate-500 font-bold mt-0.5 text-[9.5px] text-left">
                          GST: {matchedCustomer?.gstin || '[Client GST]'} {matchedCustomer?.mobile ? `| Mob: ${matchedCustomer.mobile}` : ''}
                        </p>
                      </div>

                      <div className="flex justify-end items-end pb-0.5 text-right">
                        <div className="space-y-0.5 text-slate-800 text-[10.5px] font-semibold leading-tight text-right flex flex-col items-end">
                          <p><span className="font-bold text-slate-500 uppercase tracking-widest text-[8.5px] pr-1">Quotation No:</span> <span className="font-mono font-extrabold text-slate-950 text-[11px]">{quotation.id}</span></p>
                          <p><span className="font-bold text-slate-500 uppercase tracking-widest text-[8.5px] pr-1">Date:</span> <span className="font-mono font-bold text-slate-950">{quotation.date}</span></p>
                          <p><span className="font-bold text-slate-500 uppercase tracking-widest text-[8.5px] pr-1">Validity:</span> <span className="font-mono text-slate-700 font-bold">{quotation.validityDate}</span></p>
                          <p><span className="font-bold text-slate-500 uppercase tracking-widest text-[8.5px] pr-1">Prepared By:</span> <span className="font-bold text-[#1E3A8A] uppercase tracking-wide text-[10px]">{quotation.createdBy || 'Admin'}</span></p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Table of items */}
                  {page.rows.length > 0 ? (
                    <div className="w-full overflow-hidden">
                      <table className="w-full text-left text-[11px] border-collapse border-2 border-slate-800 font-sans shadow-none">
                        <thead>
                          <tr className="bg-slate-50 text-slate-900 border-b-2 border-slate-800 no-print-background">
                            <th className="p-2 w-[6%] text-center border-r-2 border-slate-800 font-black uppercase text-[10px] tracking-tight">SR NO</th>
                            <th className={`p-2 ${showImages ? 'w-[26%]' : 'w-[48%]' } text-left border-r-2 border-slate-800 font-black uppercase text-[10px] tracking-tight`}>ITEM DESCRIPTION</th>
                            {showImages && (
                              <th className="p-2 w-[22%] text-center border-r-2 border-slate-800 font-black uppercase text-[10px] tracking-tight">ITEM IMAGE</th>
                            )}
                            <th className="p-2 w-[6%] text-center border-r-2 border-slate-800 font-black uppercase text-[10px] tracking-tight">QTY</th>
                            <th className="p-2 w-[7%] text-center border-r-2 border-slate-800 font-black uppercase text-[10px] tracking-tight">UNIT</th>
                            <th className="p-2 w-[10%] text-center border-r-2 border-slate-800 font-black uppercase text-[10px] tracking-tight">RATE</th>
                            <th className="p-2 w-[6%] text-center border-r-2 border-slate-800 font-black uppercase text-[10px] tracking-tight">DISC %</th>
                            <th className="p-2 w-[8%] text-center border-r-2 border-slate-800 font-black uppercase text-[10px] tracking-tight">DISC. AMT</th>
                            <th className="p-2 w-[10%] text-center border-r-2 border-slate-800 font-black uppercase text-[10px] tracking-tight">NET RATE</th>
                            <th className="p-2 w-[11%] text-center font-black uppercase text-[10px] tracking-tight">AMOUNT</th>
                          </tr>
                        </thead>
                        <tbody className="font-semibold text-slate-900">
                          {page.rows.map((row, rIdx) => {
                            if (row.type === 'section_header') {
                              return (
                                <tr key={`section-h-${rIdx}`} className="bg-slate-50 border-b-2 border-slate-800 no-print-background">
                                  <td colSpan={showImages ? 10 : 9} className="py-2 px-3 text-[#1E3A8A] uppercase font-black text-[9.5px] tracking-wide bg-[#1E3A8A]/5 text-left border-r-2 border-l-0 border-slate-800">
                                    📂 Section: {row.sectionName}
                                  </td>
                                </tr>
                              );
                            } else if (row.type === 'section_subtotal') {
                              return (
                                <tr key={`section-s-${rIdx}`} className="bg-slate-100/40 border-b-2 border-slate-800 font-bold text-[9px] no-print-background select-none">
                                  <td colSpan={2} className="py-2 px-3 text-slate-600 uppercase text-right lg:tracking-wider border-r-2 border-slate-800">
                                    {row.sectionName} Subtotal:
                                  </td>
                                  {showImages && <td className="p-1 border-r-2 border-slate-800"></td>}
                                  <td className="p-1 border-r-2 border-slate-800"></td>
                                  <td className="p-1 border-r-2 border-slate-800"></td>
                                  <td className="p-1 border-r-2 border-slate-800"></td>
                                  <td className="p-1 border-r-2 border-slate-800"></td>
                                  <td className="p-1 border-r-2 border-slate-800"></td>
                                  <td className="p-1 border-r-2 border-slate-800"></td>
                                  <td className="p-1.5 pr-2.5 text-center font-mono text-[#1E3A8A] font-black bg-slate-100/60 font-sans">
                                    ₹{row.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                </tr>
                              );
                            } else {
                              const item = row.item;
                              const activeDisc = quotation.masterDiscountPercent;
                              const discountAmt = item.rate * (activeDisc / 100);
                              const discountedRate = item.rate * (1 - activeDisc / 100);
                              const finalAmount = item.qty * discountedRate;

                              return (
                                <tr key={`item-row-${row.idx}`} className="align-middle border-b-2 border-slate-800 hover:bg-slate-50/40 text-center text-[10px] text-slate-900 font-sans">
                                  {/* Sr No */}
                                  <td className="p-1.5 text-center border-r-2 border-slate-800 font-mono font-bold text-slate-800">{row.idx + 1}</td>
                                  
                                  {/* Description */}
                                  <td className="py-1.5 px-2 border-r-2 border-slate-800 font-bold text-slate-900 leading-snug text-left">
                                    {item.description}
                                  </td>

                                  {/* Image cell (rendered only if showImages is checked on template) */}
                                  {showImages && (
                                    <td className="p-2 border-r-2 border-slate-800 text-center">
                                      {item.image ? (
                                        <img 
                                          src={item.image} 
                                          alt={item.description} 
                                          className="w-36 h-36 object-contain bg-white p-1 mx-auto rounded-lg border-2 border-slate-200 shadow-xs" 
                                          style={{ maxHeight: '144px' }}
                                        />
                                      ) : (
                                        <span className="text-slate-400 text-[8.5px] font-bold block uppercase tracking-tighter">No Pic</span>
                                      )}
                                    </td>
                                  )}

                                  {/* Qty */}
                                  <td className="p-1.5 text-center border-r-2 border-slate-800 font-bold text-slate-900">{item.qty}</td>

                                  {/* Unit */}
                                  <td className="p-1.5 text-center border-r-2 border-slate-800 font-bold text-slate-900 uppercase">
                                    {item.uom || 'Nos'}
                                  </td>

                                  {/* Rate */}
                                  <td className="p-1.5 text-center border-r-2 border-slate-800 font-bold text-slate-900">
                                    {item.rate.toFixed(2)}
                                  </td>

                                  {/* Discount % */}
                                  <td className="p-1.5 text-center border-r-2 border-slate-800 font-bold text-slate-900">
                                    {activeDisc > 0 ? `${activeDisc}%` : '0%'}
                                  </td>

                                  {/* Discount Amount */}
                                  <td className="p-1.5 text-center border-r-2 border-slate-800 font-bold text-slate-900">
                                    {discountAmt.toFixed(2)}
                                  </td>

                                  {/* Net Rate */}
                                  <td className="p-1.5 text-center border-r-2 border-slate-800 font-bold text-slate-900">
                                    {discountedRate.toFixed(2)}
                                  </td>

                                  {/* Final amount */}
                                  <td className="p-1.5 text-center font-bold text-slate-900">
                                    {finalAmount.toFixed(2)}
                                  </td>
                                </tr>
                              );
                            }
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : null}

                </div>

                {/* 2. BOTTOM WRAPPER containing summary fields page-by-page */}
                <div className="flex flex-col mt-3 shrink-0 text-left">
                  
                  {page.hasFinancialTotals && (
                    <div className="flex flex-col mb-1 shrink-0 w-full animate-fade-in">
                      {/* Amount in Words */}
                      <div className="text-[11px] font-sans font-medium text-slate-800 mb-2.5 text-left">
                        <strong className="text-slate-500 uppercase tracking-wider text-[9px] mr-1.5 font-bold">Amount in Words:</strong>
                        <span className="font-extrabold text-slate-900">Rupees {convertNumberToWords(grandTotal)} Only</span>
                      </div>

                      {/* Side by side grid wrap for bank and totals */}
                      <div className="grid grid-cols-2 gap-6 items-start text-[10px] font-sans w-full">
                        {/* Left Column: Bank details */}
                        <div>
                          {quotation.bankDetails.showInQuotation ? (
                            <div className="border border-slate-300 rounded-xl p-3 bg-white shadow-3xs text-left space-y-1">
                              <p className="font-bold text-[#1E3A8A] uppercase tracking-wider text-[8.5px] pb-1 border-b border-slate-200">
                                BANK TRANSFER DETAILS:
                              </p>
                              <ul className="text-[9px] text-slate-700 font-bold space-y-0.5 font-sans">
                                <li className="flex items-start gap-1">
                                  <span className="text-slate-400 select-none shrink-0">•</span>
                                  <span><strong className="text-slate-600 font-semibold font-medium">Account Name:</strong> {quotation.bankDetails.accountName || companyProfile.name}</span>
                                </li>
                                <li className="flex items-start gap-1">
                                  <span className="text-slate-400 select-none shrink-0">•</span>
                                  <span><strong className="text-slate-600 font-semibold font-medium">Account No:</strong> <span className="font-mono text-slate-950 font-bold">{quotation.bankDetails.accountNo}</span></span>
                                </li>
                                <li className="flex items-start gap-1">
                                  <span className="text-slate-400 select-none shrink-0">•</span>
                                  <span><strong className="text-slate-600 font-semibold font-medium">IFSC Code:</strong> <span className="font-mono text-slate-950 font-bold">{quotation.bankDetails.ifsc}</span></span>
                                </li>
                                <li className="flex items-start gap-1">
                                  <span className="text-slate-400 select-none shrink-0">•</span>
                                  <span><strong className="text-slate-600 font-semibold font-medium">Bank & Branch:</strong> {quotation.bankDetails.bankBranch}</span>
                                </li>
                              </ul>
                            </div>
                          ) : (
                            <div className="text-slate-400 italic text-[9px] text-left pt-2">
                              Bank transfer options available upon invoice confirmation.
                            </div>
                          )}
                        </div>

                        {/* Right Column: Totals details table with decreased line spacing */}
                        <div className="flex flex-col justify-start">
                          <div className="w-full max-w-[240px] ml-auto space-y-0.5 text-right text-slate-850 text-[10px] font-medium leading-tight font-sans">
                            <h3 className="font-bold text-[#1E3A8A] text-right mb-1 text-[10px] uppercase tracking-wider">Totals</h3>
                            <div className="flex justify-between border-b border-slate-100 py-0.5">
                              <span className="text-slate-500 font-semibold font-medium">Subtotal:</span>
                              <span className="font-bold text-slate-900">₹{grossSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 py-0.5">
                              <span className="text-slate-500 font-semibold font-medium">Discount:</span>
                              <span className="font-bold text-slate-700">₹{totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between border-b border-dashed border-slate-350 py-0.5 uppercase text-slate-900">
                              <span className="font-bold text-[8.5px] text-slate-550">Taxable Amount:</span>
                              <span className="font-extrabold text-slate-900">₹{taxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>

                            {isLocal ? (
                              <>
                                <div className="flex justify-between border-b border-slate-100 py-0.5 text-slate-600">
                                  <span>CGST 9%:</span>
                                  <span className="font-semibold text-slate-800">₹{cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-100 py-0.5 text-slate-600">
                                  <span>SGST 9%:</span>
                                  <span className="font-semibold text-slate-800">₹{sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                              </>
                            ) : (
                              <div className="flex justify-between border-b border-slate-100 py-0.5 text-slate-600">
                                  <span>IGST 18%:</span>
                                  <span className="font-semibold text-slate-800">₹{igstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            )}

                            <div className="flex justify-between border-t border-slate-400 pt-1 font-black text-[10.5px] text-[#1E3A8A] uppercase tracking-wider">
                              <span>GRAND TOTAL:</span>
                              <span>₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Terms & Conditions - FULL WIDE rectangular space */}
                  {page.termIndices.length > 0 && (
                    <div className="space-y-1 text-left mt-3 pt-3 border-t border-slate-300 w-full animate-fade-in">
                      <p className="font-bold text-[#1E3A8A] uppercase tracking-widest text-[9.5px] border-b border-slate-200 pb-1 mb-1.5">
                        Terms & Conditions
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 text-slate-700 font-bold leading-normal text-left text-[9px] w-full">
                        {page.termIndices.map((idx) => {
                          const term = activeTerms[idx];
                          return (
                            <p key={term.id} className="flex gap-1.5 items-start">
                              <span className="font-black text-slate-700 shrink-0">{idx + 1}.</span>
                              <span>{term.text}</span>
                            </p>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Material Specifications - FULL WIDE rectangular space */}
                  {page.specIndices.length > 0 && (
                    <div className="space-y-1 text-left mt-3 pt-3 border-t border-slate-300 w-full animate-fade-in">
                      <p className="font-bold text-[#1E3A8A] uppercase tracking-widest text-[9.5px] border-b border-slate-200 pb-1 mb-1.5">
                        Material Specification
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 text-slate-700 font-bold leading-normal text-left text-[9px] w-full">
                        {page.specIndices.map((idx) => {
                          const spec = activeSpecs[idx];
                          return (
                            <p key={spec.id} className="flex gap-1.5 items-start">
                              <span className="font-black text-[#1E3A8A] shrink-0">•</span>
                              <span className="text-slate-800">{spec.text}</span>
                            </p>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Signature box stamp - Align Right below items */}
                  {page.hasSignature && (
                    <div className="flex justify-end pt-3 w-full animate-fade-in">
                      <div className="border border-slate-300 rounded-xl p-3 w-full max-w-[320px] bg-slate-50/15 shadow-3xs flex flex-col items-center justify-between text-center space-y-1.5 h-[155px] overflow-hidden">
                        <div className="text-[9px] font-black text-slate-700 uppercase tracking-wide leading-none">
                          FOR {companyProfile.name.toUpperCase()}
                        </div>
                        
                        <div className="h-24 flex items-center justify-center w-full relative">
                          {companyProfile.showStampSignature && (companyProfile.stampAndSignature || companyProfile.stamp) ? (
                            <img 
                              src={companyProfile.stampAndSignature || companyProfile.stamp} 
                              alt="Authorized Stamp & Seal" 
                              className="max-h-24 max-w-full object-contain mix-blend-multiply rotate-[-1deg] opacity-95 transition-all" 
                            />
                          ) : (
                            <div className="text-[8px] text-slate-300 italic flex items-center justify-center h-full select-none leading-none">
                              (Stamp & Signature Area)
                            </div>
                          )}
                        </div>
                        
                        <div className="w-full text-[9px] font-black text-slate-900 uppercase tracking-wider border-t border-slate-200 pt-1.5 leading-none">
                          AUTHORISED SIGNATORY
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* Bottom branding footer bar & pagination counter */}
                <div className="flex justify-between items-center bg-slate-100 border border-slate-200 rounded mt-auto py-1.5 px-3 text-[8.5px] text-slate-600 uppercase font-black tracking-wide leading-none select-none font-sans no-print-background shadow-3xs w-full shrink-0">
                  <div className="truncate max-w-[480px]">
                    {companyProfile.address ? companyProfile.address.replace(/\n/g, ' ') : ''} | Phone: {companyProfile.mobile}
                  </div>
                  <div className="font-mono text-[9px] font-bold shrink-0 text-[#1E3A8A]">
                    Page {page.pageNumber} of {pages.length}
                  </div>
                </div>

              </div>
            ))}
          </div>

        </div>

        {/* Action Panel RHS details (e.g. print parameters, checklist helper) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 no-print">
          <h3 className="font-bold font-display text-slate-800 text-sm border-b border-slate-100 pb-2">
            Print Master Guidelines
          </h3>
          
          <div className="space-y-3.5 text-xs text-slate-650 leading-relaxed font-medium font-sans">
            <p className="flex gap-1.5 items-start">
              <CheckSquare className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <span>Use standard Chrome PDF printer setting Margins: **None** for ideal A4 flush output matching preview.</span>
            </p>
            <p className="flex gap-1.5 items-start">
              <CheckSquare className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <span>Ensure **Background Graphics** checkbox is checked inside chrome printing configuration to output styled sections.</span>
            </p>
            <p className="flex gap-1.5 items-start">
              <CheckSquare className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <span>The digital paginating engine dynamically monitors item dimensions and generates physical sheets perfectly!</span>
            </p>
            <p className="flex gap-1.5 items-start">
              <CheckSquare className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <span>Signature stamp and bank details are mathematically grouped, avoiding overlaps or cutoff boundaries.</span>
            </p>
          </div>
        </div>

      </div>

      {/* MODAL DIALOGUE DIGITAL DISPATCH */}
      {shareType && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 animate-fade-in no-print">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-slide-in space-y-4">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5 font-sans">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${shareType === 'WhatsApp' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                  {shareType === 'WhatsApp' ? <Send className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                </div>
                <h3 className="font-bold font-display text-slate-800 text-base">
                  Simulate {shareType} Delivery
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShareType(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={executeSendSimulation} className="space-y-3.5 text-xs font-sans">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Recipient Contact</label>
                <input
                  type="text"
                  required
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full text-xs text-slate-800 border border-slate-200 rounded-lg p-2.5 focus:border-slate-400 focus:outline-none"
                  placeholder={shareType === 'WhatsApp' ? '+91 XXXXX XXXXX' : 'client@domain.com'}
                />
              </div>

              {shareType === 'Email' && (
                <div className="space-y-1 font-sans">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Email Title</label>
                  <input
                    type="text"
                    required
                    value={subjectMsg}
                    onChange={(e) => setSubjectMsg(e.target.value)}
                    className="w-full text-xs text-slate-800 border border-slate-200 rounded-lg p-2.5 focus:border-slate-400 focus:outline-none"
                  />
                </div>
              )}

              <div className="space-y-1 font-sans">
                <label className="text-[10px] uppercase font-bold text-slate-400">Draft Content Message Text</label>
                <textarea
                  required
                  rows={6}
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  className="w-full text-xs text-slate-800 border border-slate-200 rounded-lg p-2.5 focus:border-slate-400 focus:outline-none resize-none font-sans"
                />
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-slate-400 text-[10px] leading-relaxed font-sans">
                📎 System auto-attaches active quotation PDF A4 draft generated sheet digitally as secure encrypted attachment link.
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSending}
                  className={`w-full text-white font-bold py-2 px-4 rounded-xl cursor-pointer ${shareType === 'WhatsApp' ? 'bg-green-600 hover:bg-green-500' : 'bg-blue-600 hover:bg-blue-500'}`}
                >
                  {isSending ? 'Transmitting...' : 'Simulate Send Receipt'}
                </button>
                <button
                  type="button"
                  onClick={() => setShareType(null)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl"
                >
                  Cancel
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
