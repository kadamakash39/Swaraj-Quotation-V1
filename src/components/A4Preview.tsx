import React, { useState, FormEvent } from 'react';
import { 
  Printer, ArrowLeft, Mail, Phone, ExternalLink, Calendar, 
  MapPin, CheckSquare, Plus, FileText, Send, Share2, ShieldCheck, SquareCode,
  Download, Loader2
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
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

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
  const activeTerms = quotation.terms.filter(t => t.checked);

  // Trigger web system printing
  const triggerPrint = () => {
    window.print();
  };

  // Dynamically compile & download document canvas block as custom named PDF file
  const handleDownloadPDF = () => {
    const element = document.getElementById('swraj-a4-pdf-canvas');
    if (!element) {
      alert("Error: Print canvas selector could not be acquired.");
      return;
    }

    setIsDownloadingPdf(true);

    const opt = {
      margin: 0,
      filename: `Quotation_${quotation.id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2.0, // Generates ultra crisp high density images and scaling text
        useCORS: true, 
        logging: false,
        allowTaint: false, // Prevent security exception with untrusted canvas tainting
        backgroundColor: '#ffffff'
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'], after: '.a4-page-print' }
    };

    const runHtml2Pdf = (html2pdfLib: any) => {
      html2pdfLib().from(element).set(opt).save().then(() => {
        setIsDownloadingPdf(false);
      }).catch((err: any) => {
        console.error("PDF generation failure:", err);
        alert("Failed to generate PDF automatically. Please try the printer option instead.");
        setIsDownloadingPdf(false);
      });
    };

    if ((window as any).html2pdf) {
      runHtml2Pdf((window as any).html2pdf);
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = () => {
        runHtml2Pdf((window as any).html2pdf);
      };
      script.onerror = () => {
        alert("Could not load PDF engine from remote secure network source. Please use standard Print/Save Option.");
        setIsDownloadingPdf(false);
      };
      document.body.appendChild(script);
    }
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

  const itemsCount = quotation.items.length;

  // Build the flat list of layout rows (sections, items, subtotals)
  const uniqueGroups = Array.from(new Set(quotation.items.map(item => (item.groupName || '').trim()).filter(Boolean)));
  const isGroupWise = uniqueGroups.length > 0;
  const hasAnyImages = quotation.items.some(item => item.image && item.image.trim().length > 0);

  interface LayoutRow {
    type: 'section-header' | 'item' | 'section-subtotal';
    name?: string;
    item?: any;
    idx?: number;
    items?: any[];
  }

  const flatRows: LayoutRow[] = [];
  if (isGroupWise) {
    const ungroupedItems = quotation.items.filter(item => !(item.groupName || '').trim());
    if (ungroupedItems.length > 0) {
      flatRows.push({ type: 'section-header', name: 'General Items' });
      ungroupedItems.forEach(item => {
        const idx = quotation.items.findIndex(qi => qi.id === item.id);
        flatRows.push({ type: 'item', item, idx });
      });
      flatRows.push({ type: 'section-subtotal', name: 'General Items', items: ungroupedItems });
    }
    uniqueGroups.forEach(gName => {
      const gItems = quotation.items.filter(item => (item.groupName || '').trim() === gName);
      flatRows.push({ type: 'section-header', name: gName });
      gItems.forEach(item => {
        const idx = quotation.items.findIndex(qi => qi.id === item.id);
        flatRows.push({ type: 'item', item, idx });
      });
      flatRows.push({ type: 'section-subtotal', name: gName, items: gItems });
    });
  } else {
    quotation.items.forEach((item, idx) => {
      flatRows.push({ type: 'item', item, idx });
    });
  }

  // Calculate row heights in mm
  const getRowHeight = (row: LayoutRow) => {
    if (row.type === 'section-header') return 8;
    if (row.type === 'section-subtotal') return 10;
    if (row.item && row.item.image && hasAnyImages) return 30; // compact image row
    return 13; // item with no image
  };

  interface PageData {
    rows: LayoutRow[];
    showBillTo: boolean;
    showTotals: boolean;
  }

  const getPages = (): PageData[] => {
    const pages: PageData[] = [];
    let currentRows: LayoutRow[] = [];
    let currentHeight = 0;
    
    const totalRowHeight = flatRows.reduce((sum, r) => sum + getRowHeight(r), 0);
    // Overhead on single-page document = Top margin (12) + Header (32) + Bill To (35) + Table Header (9) + Totals block (130) + Bottom stripe (8) + Page indicator (4) = 230mm
    // Inside 297mm height, available rows space = 297 - 230 = 67mm.
    const singlePageRowBudget = 67;

    if (totalRowHeight <= singlePageRowBudget) {
      pages.push({
        rows: flatRows,
        showBillTo: true,
        showTotals: true
      });
      return pages;
    }

    // Otherwise we need multiple pages
    let i = 0;
    
    // Page 1 Setup
    // Page 1 Overhead: Margins (24) + Header (32) + Bill To (35) + Table Header (9) + Bottom stripe (8) + Page indicator (4) = 112mm
    // Available row budget space = 297 - 112 = 185mm. Let's use 175mm to be safe and spacious
    const page1RowBudget = 175;
    while (i < flatRows.length) {
      const row = flatRows[i];
      const h = getRowHeight(row);
      if (currentHeight + h > page1RowBudget) {
        break;
      }
      currentRows.push(row);
      currentHeight += h;
      i++;
    }
    pages.push({
      rows: currentRows,
      showBillTo: true,
      showTotals: false
    });

    // Pages 2+
    while (i < flatRows.length) {
      currentRows = [];
      currentHeight = 0;
      
      const remainingRows = flatRows.slice(i);
      const remainingRowsHeight = remainingRows.reduce((sum, r) => sum + getRowHeight(r), 0);
      
      // Final page Overhead: Margins (24) + Header (32) + Table Header (9) + Totals block (130) + Bottom stripe (8) + Page indicator (4) = 207mm
      // Space for rows on Final Page = 297 - 207 = 90mm. Let's use 80mm to be safe
      const finalPageRowBudget = 80;
      
      if (remainingRowsHeight <= finalPageRowBudget) {
        pages.push({
          rows: remainingRows,
          showBillTo: false,
          showTotals: true
        });
        i = flatRows.length;
        break;
      }
      
      // Middle Page (Header + Table Header)
      // Overhead = Margins (24) + Header (32) + Table Header (9) + Bottom stripe (8) + Page indicator (4) = 77mm
      // Space for rows on Middle Page = 297 - 77 = 220mm. Let's use 210mm to be safe
      const middlePageRowBudget = 210;
      while (i < flatRows.length) {
        const row = flatRows[i];
        const h = getRowHeight(row);
        if (currentHeight + h > middlePageRowBudget) {
          break;
        }
        currentRows.push(row);
        currentHeight += h;
        i++;
      }
      
      if (currentRows.length === 0 && i < flatRows.length) {
        currentRows.push(flatRows[i]);
        i++;
      }
      
      pages.push({
        rows: currentRows,
        showBillTo: false,
        showTotals: false
      });
    }

    // End safety: If the last page does not contain totals, append a clean Signatures page
    if (pages.length > 0 && !pages[pages.length - 1].showTotals) {
      pages.push({
        rows: [],
        showBillTo: false,
        showTotals: true
      });
    }

    return pages;
  };

  const pages = getPages();

  return (
    <div className="space-y-6 flex flex-col min-h-screen">
      
      {/* Scope print inline overrides to force full background print graphics and clean page-by-page sizing */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0mm !important;
          }
          body, #root {
            background: #ffffff !important;
            color: #000055 !important;
          }
          .no-print {
            display: none !important;
          }
          #swraj-a4-pdf-canvas {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            background: transparent !important;
          }
        }
        
        /* Direct page box mirroring strict physical A4 standards */
        .a4-page-print {
          width: 210mm;
          height: 297mm;
          min-height: 297mm;
          max-height: 297mm;
          padding: 12mm 15mm;
          margin: 0 auto;
          box-sizing: border-box;
          background: #ffffff;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
          color: #1e293b;
        }

        @media print {
          .a4-page-print {
            page-break-after: always !important;
            break-after: always !important;
            border: none !important;
            box-shadow: none !important;
            margin: 0 auto !important;
          }
          .a4-page-print:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
        }
      `}</style>
      
      {/* Top action commands */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 text-white p-5 rounded-2xl shadow-md no-print border border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition text-slate-350 cursor-pointer"
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
            onClick={handleDownloadPDF}
            disabled={isDownloadingPdf}
            className="inline-flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 disabled:bg-sky-800 disabled:opacity-80 font-bold text-xs text-white py-2 px-4 rounded-xl shadow cursor-pointer transition-colors"
          >
            {isDownloadingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Download PDF
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
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start flex-grow">
        
        {/* Printable Document Sheet LHS (A4 standard preview pages) */}
        <div className="lg:col-span-3 space-y-6 select-text overflow-x-auto bg-slate-100 p-8 rounded-2xl">
          
          <div id="swraj-a4-pdf-canvas" className="space-y-6 p-1 bg-slate-100 print:bg-white print:p-0">
            {pages.map((page, pageIdx) => (
              <div 
                key={pageIdx}
                className="a4-page-print border border-slate-200 shadow-xl print:shadow-none print:border-none"
              >
                {/* Content block: aligned to top layout */}
                <div className="space-y-2 flex-grow">
                  
                  {/* Dynamic Repeating Company Header (No borders as requested) */}
                  <div className="flex justify-between items-start pb-4 text-left">
                    <div className="flex items-start gap-4">
                      {companyProfile.logo ? (
                        <img 
                          src={companyProfile.logo} 
                          alt="Logo" 
                          className="w-16 h-16 object-contain rounded border border-slate-100 bg-white" 
                        />
                      ) : (
                        <div className="w-16 h-16 bg-slate-50 text-slate-350 flex items-center justify-center font-bold text-xs rounded border border-dashed border-slate-200 uppercase">
                          Logo
                        </div>
                      )}
                      <div>
                        <h1 className="text-lg font-extrabold tracking-tight text-slate-900 leading-tight mb-1">{companyProfile.name}</h1>
                        <p className="text-[10px] text-slate-500 max-w-[320px] leading-relaxed font-semibold">{companyProfile.address}</p>
                        <p className="text-[10px] text-slate-500 font-bold">Email: {companyProfile.email} | Mobile: {companyProfile.mobile}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <h2 className="text-2xl font-black text-[#1E40AF] tracking-widest font-sans leading-none uppercase">QUOTATION</h2>
                    </div>
                  </div>

                  {/* Billing Parties & Metadata grid (No borders as requested) - Only on Page 1 */}
                  {page.showBillTo && (
                    <div className="grid grid-cols-2 gap-4 py-3 text-[11px] leading-normal font-sans">
                      <div className="space-y-0.5 text-left">
                        <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Bill To:</p>
                        <p className="font-extrabold text-slate-900 text-xs tracking-tight">{matchedCustomer?.name || '[Client Name]'}</p>
                        {matchedCustomer?.companyName && (
                          <p className="font-bold text-slate-700 leading-none">{matchedCustomer.companyName}</p>
                        )}
                        <p className="text-slate-600 max-w-[280px] leading-snug">{matchedCustomer?.address || '[Client Address]'}</p>
                        {matchedCustomer?.city && (
                          <p className="text-slate-600 font-medium">{matchedCustomer.city}, {matchedCustomer.state} - {matchedCustomer.pincode}</p>
                        )}
                        <p className="text-slate-500 font-semibold mt-1">
                          GST: {matchedCustomer?.gstin || '[Client GST]'} {matchedCustomer?.mobile ? `| Mob: ${matchedCustomer.mobile}` : ''}
                        </p>
                      </div>

                      <div className="flex justify-end items-end pb-1.5 text-right font-sans">
                        <div className="space-y-1 text-slate-800 text-[11px] font-medium leading-tight">
                          <p><span className="font-bold text-slate-500 uppercase tracking-widest text-[9.5px] pr-1">Quotation No:</span> <span className="font-mono font-extrabold text-slate-950 text-xs">{quotation.id}</span></p>
                          <p><span className="font-bold text-slate-500 uppercase tracking-widest text-[9.5px] pr-1">Date:</span> <span className="font-mono">{quotation.date}</span></p>
                          <p><span className="font-bold text-slate-500 uppercase tracking-widest text-[9.5px] pr-1">Validity:</span> <span className="font-mono text-slate-700">{quotation.validityDate}</span></p>
                          <p><span className="font-bold text-slate-500 uppercase tracking-widest text-[9.5px] pr-1">Prepared By:</span> <span className="font-bold text-[#1E3A8A] uppercase tracking-wide">{quotation.createdBy || 'Admin'}</span></p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dynamic Items Table */}
                  {page.rows.length > 0 && (
                    <div className="py-1">
                      <table className="w-full text-left text-[11px] border-collapse font-sans shadow-2xs">
                        <thead>
                          {/* Column Headers replicated perfectly across pages */}
                          <tr className="bg-[#1E3A8A] text-white border-y border-slate-300">
                            <th className="p-1.5 w-[5%] text-center border-l border-r border-slate-300 font-bold uppercase tracking-tight text-[10px]">Sr No</th>
                            <th className={`p-1.5 ${hasAnyImages ? 'w-[25%]' : 'w-[50%]'} text-left border-r border-slate-300 font-bold uppercase tracking-tight text-[10px]`}>Item Description</th>
                            {hasAnyImages && (
                              <th className="p-1.5 w-[25%] text-center border-r border-slate-300 font-bold uppercase tracking-tight text-[10px]">Item Image</th>
                            )}
                            <th className="p-1.5 w-[8%] text-center border-r border-slate-300 font-bold uppercase tracking-tight text-[10px]">HSN/SAC</th>
                            <th className="p-1.5 w-[5%] text-center border-r border-slate-300 font-bold uppercase tracking-tight text-[10px]">Qty</th>
                            <th className="p-1.5 w-[5%] text-center border-r border-slate-300 font-bold uppercase tracking-tight text-[10px]">Unit</th>
                            <th className="p-1.5 w-[9%] text-right border-r border-slate-300 font-bold uppercase tracking-tight text-[10px]">Rate</th>
                            <th className="p-1.5 w-[5%] text-center border-r border-slate-300 font-bold uppercase tracking-tight text-[10px]">Disc %</th>
                            <th className="p-1.5 w-[9%] text-right border-r border-slate-300 font-bold uppercase tracking-tight text-[10px]">Net Rate</th>
                            <th className="p-1.5 w-[8%] text-right border-r border-slate-300 font-bold uppercase tracking-tight text-[10px]">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="font-medium text-slate-750">
                          {page.rows.map((row, rIdx) => {
                            if (row.type === 'section-header') {
                              return (
                                <tr key={`sh-${rIdx}`} className="bg-slate-50 border-b border-slate-300">
                                  <td colSpan={hasAnyImages ? 10 : 9} className="py-2 px-3 text-[#1E3A8A] uppercase font-black text-[9.5px] tracking-wide bg-[#1E3A8A]/5 text-left border-r border-l border-slate-300 animate-fade-in">
                                    📂 Section: {row.name}
                                  </td>
                                </tr>
                              );
                            }

                            if (row.type === 'section-subtotal') {
                              return (
                                <tr key={`sst-${rIdx}`} className="bg-slate-100/40 border-b border-slate-300 font-bold text-[9px] no-print-background select-none">
                                  <td colSpan={2} className="py-1.5 px-3 text-slate-600 uppercase text-right tracking-wider border-l border-r border-slate-300">
                                    {row.name} Subtotal:
                                  </td>
                                  {hasAnyImages && <td className="p-1 border-r border-slate-300"></td>}
                                  <td className="p-1 border-r border-slate-300"></td>
                                  <td className="p-1 border-r border-slate-300"></td>
                                  <td className="p-1 border-r border-slate-300"></td>
                                  <td className="p-1 border-r border-slate-300"></td>
                                  <td className="p-1 border-r border-slate-300"></td>
                                  <td className="p-1 border-r border-slate-300"></td>
                                  <td className="p-1 pr-2.5 text-right border-r border-slate-300 font-mono text-[#1E3A8A] font-black bg-slate-100/60 shadow-inner">
                                    ₹{row.items?.reduce((sum, item) => {
                                      const activeDisc = quotation.masterDiscountPercent;
                                      const discountedRate = item.rate * (1 - activeDisc / 100);
                                      return sum + (item.qty * discountedRate);
                                    }, 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                </tr>
                              );
                            }

                            const item = row.item;
                            const idx = row.idx ?? 0;
                            const activeDisc = quotation.masterDiscountPercent;
                            const discountedRate = item.rate * (1 - activeDisc / 100);
                            const finalAmount = item.qty * discountedRate;

                            return (
                              <tr key={`item-${item.id}-${rIdx}`} className="align-middle border-b border-slate-200 hover:bg-slate-50/40">
                                <td className="p-1 text-center border-l border-r border-slate-300 font-mono font-bold text-slate-500 text-[10px]">{idx + 1}</td>
                                <td className="p-1.5 border-r border-slate-300 font-semibold text-slate-900 leading-snug">{item.description}</td>
                                {hasAnyImages && (
                                  <td className="p-1.5 border-r border-slate-300 text-center">
                                    {item.image ? (
                                      <img 
                                        src={item.image} 
                                        alt={item.description} 
                                        className="h-10 max-h-12 w-auto object-contain bg-white p-0.5 mx-auto rounded border border-slate-200" 
                                      />
                                    ) : (
                                      <span className="text-slate-300 text-[9px] font-bold block uppercase tracking-tighter">No Pic</span>
                                    )}
                                  </td>
                                )}
                                <td className="p-1 text-center border-r border-slate-300 font-mono text-slate-650 font-bold">9403</td>
                                <td className="p-1 text-center border-r border-slate-300 font-mono text-slate-800 font-bold">{item.qty}</td>
                                <td className="p-1 text-center border-r border-slate-300">
                                  <span className="bg-slate-100 text-slate-600 rounded px-1.5 py-0.5 text-[9px] font-bold border border-slate-200 inline-block uppercase leading-none min-w-[38px] text-center shadow-3xs">
                                    {item.uom || 'Nos'}
                                  </span>
                                </td>
                                <td className="p-1 pr-1.5 text-right border-r border-slate-300 font-mono text-slate-700">
                                  ₹{item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="p-1 text-center border-r border-slate-300 font-mono text-slate-700">
                                  {activeDisc > 0 ? `${activeDisc}%` : '—'}
                                </td>
                                <td className="p-1 pr-1.5 text-right border-r border-slate-300 font-mono text-slate-705 font-semibold">
                                  ₹{discountedRate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="p-1 pr-1.5 text-right border-r border-slate-300 font-mono font-bold text-slate-900">
                                  ₹{finalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Total Grand Amount Chargeable in Words & Specs Grid - Only on the Final Page */}
                  {page.showTotals && (
                    <div className="space-y-4">
                      
                      {/* Total Grand Amount Chargeable in Words */}
                      <div className="border border-slate-300 bg-slate-50/40 rounded-lg px-3 py-1.5 mt-2 text-[10px] font-sans flex items-center gap-2 shadow-3xs flex-wrap">
                        <span className="font-extrabold text-slate-550 uppercase tracking-widest text-[8.5px] bg-slate-200/70 border border-slate-300 rounded px-1.5 py-0.5 leading-none select-none">
                          Amount in Words
                        </span>
                        <span className="font-black text-slate-800 capitalize font-mono text-[10.5px]">
                          Rupees {convertNumberToWords(grandTotal)} Only
                        </span>
                      </div>

                      {/* Under Table Breakdown layout */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start mt-3 text-[11px] font-sans">
                        
                        {/* Left Side: Specs & terms conditions */}
                        <div className="space-y-4">
                          
                          {/* Custom Material specification block */}
                          <div>
                            <p className="font-extrabold text-slate-800 uppercase tracking-widest text-[9.5px] border-b border-slate-200 pb-1 mb-1 font-bold">
                              Material Specifications:
                            </p>
                            <div className="space-y-1 text-slate-650 font-semibold leading-relaxed text-[10.5px]">
                              {Array.isArray(quotation.materialSpecs) ? (
                                quotation.materialSpecs.filter(s => s.checked).map((spec, index) => (
                                  <p key={spec.id} className="flex gap-1.5 items-start">
                                    <span className="font-bold text-slate-800 shrink-0">{(index + 1)}.</span>
                                    <span>{spec.text}</span>
                                  </p>
                                ))
                              ) : (
                                <p className="text-slate-650 leading-relaxed font-semibold">
                                  <span className="font-semibold text-slate-950">Plywood Core:</span> {(quotation.materialSpecs as any).plywood} |{' '}
                                  <span className="font-semibold text-slate-950">External:</span> {(quotation.materialSpecs as any).externalLaminate} |{' '}
                                  <span className="font-semibold text-slate-950">Internal Linker:</span> {(quotation.materialSpecs as any).internalLaminate} |{' '}
                                  <span className="font-semibold text-slate-950">Hardware:</span> {(quotation.materialSpecs as any).hardware}
                                  {(quotation.materialSpecs as any).laminateBrand && (
                                    <> | <span className="font-semibold text-slate-950">Laminates:</span> {(quotation.materialSpecs as any).laminateBrand}</>
                                  )}
                                </p>
                              )}
                              {Array.isArray(quotation.materialSpecs) && quotation.materialSpecs.filter(s => s.checked).length === 0 && (
                                <p className="text-slate-400 italic">No material specifications included.</p>
                              )}
                            </div>
                          </div>

                          {/* Terms and conditions */}
                          <div>
                            <p className="font-extrabold text-[#1E3A8A] uppercase tracking-widest text-[9.5px] border-b border-slate-200 pb-1 mb-1 font-bold">
                              Terms & Conditions:
                            </p>
                            <div className="space-y-1 text-slate-650 font-semibold leading-relaxed text-[10.5px]">
                              {activeTerms.map((term, index) => (
                                <p key={term.id} className="flex gap-1.5 items-start">
                                  <span className="font-bold text-slate-800 shrink-0">{(index + 1)}.</span>
                                  <span>{term.text}</span>
                                </p>
                              ))}
                              {activeTerms.length === 0 && (
                                <>
                                  <p className="flex gap-1.5 items-start">
                                    <span className="font-bold text-slate-800">1.</span>
                                    <span>Payment structure is subject to standard mutual 30 days contract terms.</span>
                                  </p>
                                  <p className="flex gap-1.5 items-start">
                                    <span className="font-bold text-slate-800">2.</span>
                                    <span>Goods and raw carcasses remain the property of the seller until cleared.</span>
                                  </p>
                                </>
                              )}
                            </div>
                          </div>

                        </div>

                        {/* Right Side: Calculation metrics table, Signature block & Bank details */}
                        <div className="space-y-4">
                          
                          {/* Math layout aligned to extreme right */}
                          <div className="w-full max-w-[280px] ml-auto space-y-1 text-right text-slate-850 font-medium [content-visibility:auto]">
                            <table className="w-full text-[11px] font-mono leading-tight">
                              <tbody>
                                <tr>
                                  <td className="text-left py-0.5 text-slate-500 font-sans font-semibold">Subtotal</td>
                                  <td className="font-bold text-right py-0.5">₹{grossSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>
                                <tr>
                                  <td className="text-left py-0.5 text-slate-500 font-sans font-semibold font-medium">Discount</td>
                                  <td className="font-bold text-right py-0.5 text-slate-750">₹{totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>
                                <tr className="border-[0.5px] border-slate-200 border-dashed border-x-0">
                                  <td className="text-left py-1 text-slate-800 font-sans font-extrabold uppercase text-[10px]">Taxable Value</td>
                                  <td className="font-extrabold text-right py-1 text-slate-900">₹{taxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>

                                {isLocal ? (
                                  <>
                                    <tr>
                                      <td className="text-left py-0.5 text-slate-500 font-sans font-medium">CGST 9%</td>
                                      <td className="font-bold text-right py-0.5 text-slate-700">₹{cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    </tr>
                                    <tr>
                                      <td className="text-left py-0.5 text-slate-500 font-sans font-medium">SGST 9%</td>
                                      <td className="font-bold text-right py-0.5 text-slate-700">₹{sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    </tr>
                                  </>
                                ) : (
                                  <tr>
                                    <td className="text-left py-0.5 text-slate-500 font-sans font-semibold">IGST 18%</td>
                                    <td className="font-bold text-right py-0.5 text-slate-700">₹{igstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                  </tr>
                                )}

                                <tr className="border-t border-slate-350">
                                  <td className="text-left py-1.5 text-[#1E3A8A] font-sans font-extrabold uppercase text-xs tracking-tight">Grand Total</td>
                                  <td className="font-extrabold text-right py-1.5 text-xs text-[#1E3A8A]">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          {/* Signature Block with Relative Stamp overlay */}
                          <div className="border border-slate-300 rounded-xl p-3 max-w-[280px] ml-auto bg-slate-50/20 shadow-3xs flex flex-col items-center justify-between text-center space-y-1 h-[135px] overflow-hidden">
                            <div className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wide">
                              For {companyProfile.name}
                            </div>
                            
                            <div className="h-16 flex items-center justify-center w-full relative">
                              {companyProfile.showStampSignature && (companyProfile.stampAndSignature || companyProfile.stamp) ? (
                                <img 
                                  src={companyProfile.stampAndSignature || companyProfile.stamp} 
                                  alt="Authorized Stamp & Seal" 
                                  className="max-h-16 max-w-full object-contain mix-blend-multiply rotate-[-1deg] opacity-95 animate-fade-in" 
                                />
                              ) : (
                                <div className="text-[9px] text-slate-300 italic flex items-center justify-center h-full select-none font-bold">
                                  (Stamp & Signature Area)
                                </div>
                              )}
                            </div>
                            
                            <div className="w-full text-[9.5px] font-extrabold text-slate-900 uppercase tracking-wider border-t border-slate-200 pt-1">
                              Authorised Signatory
                            </div>
                          </div>

                          {/* Bank Details in sleek list layout */}
                          {quotation.bankDetails.showInQuotation ? (
                            <div className="border border-slate-200 rounded-xl p-3 max-w-[280px] ml-auto bg-slate-50/5 shadow-3xs text-left space-y-1 text-[10.5px]">
                              <p className="font-extrabold text-[#1E3A8A] uppercase tracking-wider text-[8.5px] pb-1 border-b border-slate-200 font-sans font-bold">
                                Bank Transfer Details:
                              </p>
                              <ul className="text-[10px] text-slate-650 font-semibold space-y-1 font-sans">
                                <li className="flex items-start gap-1">
                                  <span className="text-slate-400 select-none shrink-0">•</span>
                                  <span><strong className="text-slate-755 font-extrabold">Account Name:</strong> {quotation.bankDetails.accountName || companyProfile.name}</span>
                                </li>
                                <li className="flex items-start gap-1">
                                  <span className="text-slate-400 select-none shrink-0">•</span>
                                  <span><strong className="text-slate-755 font-extrabold">Account No:</strong> <span className="font-mono text-slate-900 font-bold">{quotation.bankDetails.accountNo}</span></span>
                                </li>
                                <li className="flex items-start gap-1">
                                  <span className="text-slate-400 select-none shrink-0">•</span>
                                  <span><strong className="text-slate-755 font-extrabold">IFSC Code:</strong> <span className="font-mono text-slate-900 font-bold">{quotation.bankDetails.ifsc}</span></span>
                                </li>
                                <li className="flex items-start gap-1">
                                  <span className="text-slate-400 select-none shrink-0">•</span>
                                  <span><strong className="text-slate-755 font-extrabold">Bank & Branch:</strong> {quotation.bankDetails.bankBranch}</span>
                                </li>
                              </ul>
                            </div>
                          ) : (
                            <div className="max-w-[280px] ml-auto text-[9px] text-slate-400 italic text-right select-none font-sans mt-0.5">
                              Bank details omitted by customer request.
                            </div>
                          )}

                        </div>

                      </div>

                    </div>
                  )}

                </div>

                {/* Bottom block: aligned exactly to bottom of page */}
                <div className="space-y-1 pt-1 border-t border-slate-100 mt-2 select-none">
                  {/* Address, Mobile, Email banner stripes */}
                  <div className="bg-slate-100 border border-slate-200 rounded py-1.5 px-3 text-[8.5px] sm:text-[9.5px] text-slate-650 text-center uppercase font-black tracking-wide leading-none select-none font-sans no-print-background shadow-3xs whitespace-nowrap overflow-hidden text-ellipsis w-full">
                    {companyProfile.address ? companyProfile.address.replace(/\n/g, ' ') : ''} | Phone: {companyProfile.mobile} | Email: {companyProfile.email}
                  </div>
                  {/* Page indicator */}
                  <div className="text-right text-[8.5px] font-bold uppercase tracking-widest text-slate-400 select-none font-mono pr-1 pt-0.5">
                    Page {pageIdx + 1} of {pages.length}
                  </div>
                </div>

              </div>
            ))}
          </div>

        </div>

        {/* Action Panel RHS details (e.g. print parameters, checklist helper) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 no-print sm:sticky sm:top-6">
          <h3 className="font-bold font-display text-slate-800 text-sm border-b border-slate-100 pb-2">
            Print Master Guidelines
          </h3>
          
          <div className="space-y-3.5 text-xs text-slate-650 leading-relaxed font-semibold">
            <p className="flex gap-1.5 items-start">
              <CheckSquare className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <span>Beautiful landscape page-by-page rendering matches exact dimensions of physical A4 standard sheets.</span>
            </p>
            <p className="flex gap-1.5 items-start">
              <CheckSquare className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <span>Use standard Chrome PDF printer setting Margins: **None** or **Default** for accurate scaling.</span>
            </p>
            <p className="flex gap-1.5 items-start">
              <CheckSquare className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <span>Verify that standard printer **Background Graphics** checkbox is checked before trigger signature prints.</span>
            </p>
          </div>
        </div>

      </div>

      {/* MODAL DIALOGUE DIGITAL DISPATCH */}
      {shareType && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 animate-fade-in no-print">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-slide-in space-y-4">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
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

            <form onSubmit={executeSendSimulation} className="space-y-3.5 text-xs">
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
                <div className="space-y-1">
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

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Draft Content Message Text</label>
                <textarea
                  required
                  rows={6}
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  className="w-full text-xs text-slate-800 border border-slate-200 rounded-lg p-2.5 focus:border-slate-400 focus:outline-none resize-none font-sans"
                />
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-slate-450 text-[10px] leading-relaxed">
                📎 System auto-attaches active quotation PDF A4 draft generated sheet digitally as secure encrypted attachment link.
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSending}
                  className={`w-full text-white font-bold py-2 px-4 rounded-xl cursor-pointer ${shareType === 'WhatsApp' ? 'bg-green-600 hover:bg-green-500' : 'bg-blue-650 hover:bg-blue-600'}`}
                >
                  {isSending ? 'Transmitting digital packages...' : 'Simulate Send Receipt'}
                </button>
                <button
                  type="button"
                  onClick={() => setShareType(null)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-xl cursor-pointer font-bold"
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
