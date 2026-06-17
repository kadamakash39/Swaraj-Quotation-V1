import React, { useState, FormEvent } from 'react';
import { 
  Download, ArrowLeft, Mail, Phone, ExternalLink, Calendar, 
  MapPin, CheckSquare, Plus, FileText, Send, Share2, ShieldCheck, SquareCode 
} from 'lucide-react';
import { Quotation, Customer, CompanyProfile } from '../types';
import html2pdf from 'html2pdf.js';

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
  hasBankDetails: boolean;
  termIndices: number[];
  specIndices: number[];
  hasSignature: boolean;
  signatureColumn?: 'left' | 'right';
}

// Helper to calculate row heights
function calculateRowHeight(row: TableRow, showImages: boolean): number {
  if (row.type === 'section_header' || row.type === 'section_subtotal') {
    return 26;
  }
  if (row.type === 'item') {
    const desc = row.item.description || '';
    const linesByNewlines = desc.split('\n');
    let estimatedLines = 0;
    const charsPerLine = showImages ? 28 : 50;
    for (const line of linesByNewlines) {
      estimatedLines += Math.max(1, Math.ceil(line.length / charsPerLine));
    }
    
    let baseHeight = 34; // standard item row height
    if (showImages && row.item.image) {
      baseHeight = 160; // standard image row height
    }
    const textHeight = Math.max(0, (estimatedLines - 1) * 13);
    return Math.max(baseHeight, 30 + textHeight);
  }
  return 34;
}

// Robust, predictive pagination helper pass
function runPaginationPass(
  quote: Quotation,
  companyProfile: CompanyProfile,
  tableRows: TableRow[],
  activeTerms: any[],
  activeSpecs: any[],
  showImages: boolean,
  maxRowsPerPage: number | null,
  totalA4Height: number,
  isLocal: boolean,
  includeGst: boolean
): PageTemplate[] {
  const pages: PageTemplate[] = [];
  
  const headerHeight = 145;
  const billingInfoHeight = 115;
  const tableHeaderHeight = 36;
  const termHeaderHeight = 25;
  const specHeaderHeight = 25;
  
  const bankCount = quote.bankDetails?.showInQuotation
    ? ((quote.banksSnapshot && Array.isArray(quote.banksSnapshot) && quote.banksSnapshot.length > 0)
      ? quote.banksSnapshot.length
      : 1)
    : 0;

  const hasBankDetails = quote.bankDetails?.showInQuotation === true;
  const bankDetailsBlockHeight = hasBankDetails ? bankCount * 65 : 0;
  
  // Calculate dynamic financial totals height based on taxes
  let financialTotalsHeight = 120; // Base: Subtotal, Discount, Taxable Amount, Grand Total + spacing
  if (includeGst) {
    if (isLocal) {
      financialTotalsHeight += 38; // CGST + SGST (2 lines * ~19px)
    } else {
      financialTotalsHeight += 19; // IGST (1 line * ~19px)
    }
  }
  financialTotalsHeight += 45; // Amount in Words sub-block inside totals card

  let rowCursor = 0;
  let termCursor = 0;
  let specCursor = 0;
  
  let financialTotalsPlaced = false;
  let bankDetailsPlaced = false;
  let currentPageIndex = 0;

  while (
    rowCursor < tableRows.length ||
    !financialTotalsPlaced ||
    (hasBankDetails && !bankDetailsPlaced) ||
    specCursor < activeSpecs.length ||
    termCursor < activeTerms.length
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
    let pageHasBankDetails = false;
    const pageTermIndices: number[] = [];
    const pageSpecIndices: number[] = [];

    // 1. Pack Table Rows
    if (rowCursor < tableRows.length) {
      heightUsed += tableHeaderHeight;
      pageHasTableHeader = true;
      
      while (rowCursor < tableRows.length) {
        if (maxRowsPerPage !== null && pageRows.length >= maxRowsPerPage) {
          break;
        }

        const row = tableRows[rowCursor];
        const rHeight = calculateRowHeight(row, showImages);

        // Prevent section header from being orphaned if its first item cannot fit on the current page
        if (row.type === 'section_header' && pageRows.length > 0) {
          let nextItemIdx = rowCursor + 1;
          let firstItem: TableRow | null = null;
          while (nextItemIdx < tableRows.length) {
            const nextRow = tableRows[nextItemIdx];
            if (nextRow.type === 'item') {
              firstItem = nextRow;
              break;
            } else if (nextRow.type === 'section_header') {
              break;
            }
            nextItemIdx++;
          }
          if (firstItem) {
            const firstItemHeight = calculateRowHeight(firstItem, showImages);
            if (heightUsed + rHeight + firstItemHeight > totalA4Height) {
              // Section header and first item cannot together fit on current page, so defer section to next page
              break;
            }
          }
        }

        if (heightUsed + rHeight <= totalA4Height) {
          pageRows.push(row);
          heightUsed += rHeight;
          rowCursor++;
        } else {
          break;
        }
      }
    }

    // 2. Pack Bottom Blocks in Layout Columns (Side-by-Side Simulation)
    let leftColHeight = 0;
    let rightColHeight = 0;

    if (rowCursor === tableRows.length) {
      const remainingHeight = totalA4Height - heightUsed;

      if (remainingHeight > 0) {
        // Determine Right Column elements to pack on this page
        if (!financialTotalsPlaced) {
          const bothNeedToFit = hasBankDetails && !bankDetailsPlaced;
          const fitsBoth = bothNeedToFit
            ? (financialTotalsHeight + bankDetailsBlockHeight <= remainingHeight)
            : (financialTotalsHeight <= remainingHeight);

          if (fitsBoth) {
            pageHasFinancialTotals = true;
            rightColHeight = financialTotalsHeight;
            
            if (bothNeedToFit) {
              pageHasBankDetails = true;
              rightColHeight += bankDetailsBlockHeight;
            }
          }
        } else if (hasBankDetails && !bankDetailsPlaced) {
          if (bankDetailsBlockHeight <= remainingHeight) {
            pageHasBankDetails = true;
            rightColHeight = bankDetailsBlockHeight;
          }
        }

        // Determine Left Column elements to pack on this page
        let specSectionHeaderAdded = false;
        let tempSpecCursor = specCursor;
        while (tempSpecCursor < activeSpecs.length) {
          const sText = activeSpecs[tempSpecCursor]?.text || '';
          const sLines = Math.max(1, Math.ceil(sText.length / 52));
          const sHeight = (sLines * 12) + 6;
          const potentialHeader = !specSectionHeaderAdded ? specHeaderHeight : 0;
          
          const nextLeftColHeight = leftColHeight + sHeight + potentialHeader;
          const potentialPageHeightUsed = Math.max(nextLeftColHeight, rightColHeight);
          
          if (potentialPageHeightUsed <= remainingHeight) {
            if (!specSectionHeaderAdded) {
              leftColHeight += specHeaderHeight;
              specSectionHeaderAdded = true;
            }
            pageSpecIndices.push(tempSpecCursor);
            leftColHeight += sHeight;
            tempSpecCursor++;
          } else {
            break;
          }
        }

        let termSectionHeaderAdded = false;
        let tempTermCursor = termCursor;
        while (tempTermCursor < activeTerms.length) {
          const tText = activeTerms[tempTermCursor]?.text || '';
          const tLines = Math.max(1, Math.ceil(tText.length / 52));
          const tHeight = (tLines * 12) + 6;
          const potentialHeader = !termSectionHeaderAdded ? termHeaderHeight : 0;
          
          const nextLeftColHeight = leftColHeight + tHeight + potentialHeader;
          const potentialPageHeightUsed = Math.max(nextLeftColHeight, rightColHeight);
          
          if (potentialPageHeightUsed <= remainingHeight) {
            if (!termSectionHeaderAdded) {
              leftColHeight += termHeaderHeight;
              termSectionHeaderAdded = true;
            }
            pageTermIndices.push(tempTermCursor);
            leftColHeight += tHeight;
            tempTermCursor++;
          } else {
            break;
          }
        }

        // Update the cursors and flags for what we successfully packed
        if (pageHasFinancialTotals) {
          financialTotalsPlaced = true;
        }
        if (pageHasBankDetails) {
          bankDetailsPlaced = true;
        }
        if (pageSpecIndices.length > 0) {
          specCursor = tempSpecCursor;
        }
        if (pageTermIndices.length > 0) {
          termCursor = tempTermCursor;
        }

        // Incorporate the correct height overhead we consumed on this page
        heightUsed += Math.max(leftColHeight, rightColHeight);
      }
    }

    // 6. Force-pack fallback (to prevent infinite loops if something is too big to fit)
    const anythingPlaced = 
      pageRows.length > 0 || 
      pageHasFinancialTotals || 
      pageHasBankDetails || 
      pageSpecIndices.length > 0 || 
      pageTermIndices.length > 0;

    if (!anythingPlaced) {
      if (rowCursor < tableRows.length) {
        const row = tableRows[rowCursor];
        pageRows.push(row);
        rowCursor++;
      } else if (!financialTotalsPlaced) {
        pageHasFinancialTotals = true;
        financialTotalsPlaced = true;
      } else if (hasBankDetails && !bankDetailsPlaced) {
        pageHasBankDetails = true;
        bankDetailsPlaced = true;
      } else if (specCursor < activeSpecs.length) {
        pageSpecIndices.push(specCursor);
        specCursor++;
      } else if (termCursor < activeTerms.length) {
        pageTermIndices.push(termCursor);
        termCursor++;
      }
    }

    pages.push({
      pageNumber: currentPageIndex + 1,
      rows: pageRows,
      hasHeader: true,
      hasBillingInfo: isPage1,
      hasTableHeader: pageHasTableHeader,
      hasFinancialTotals: pageHasFinancialTotals,
      hasBankDetails: pageHasBankDetails,
      termIndices: pageTermIndices,
      specIndices: pageSpecIndices,
      hasSignature: false,
    });

    currentPageIndex++;
  }

  return pages;
}

// Robust, predictive pagination splitter to allocate table items page-by-page inside A4 limits
function paginateQuotation(
  quote: Quotation,
  companyProfile: CompanyProfile,
  activeTerms: any[],
  activeSpecs: any[],
  showImages: boolean,
  isLocal: boolean,
  includeGst: boolean
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

  // standard available print bounds limit: 900 (with extra safe footer margin space)
  return runPaginationPass(quote, companyProfile, tableRows, activeTerms, activeSpecs, showImages, null, 900, isLocal, includeGst);
}

export default function A4Preview({
  quotation,
  customers,
  companyProfile: propCompanyProfile,
  onBack
}: A4PreviewProps) {

  // Auto-adapt snapshotted company configuration if present to freeze history perfectly!
  const companyProfile = quotation.companySnapshot || propCompanyProfile;

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
  
  const includeGst = quotation.includeGst !== false;
  const isLocal = !matchedCustomer || matchedCustomer.state === 'Maharashtra';
  const cgstAmount = isLocal && includeGst ? taxableValue * 0.09 : 0;
  const sgstAmount = isLocal && includeGst ? taxableValue * 0.09 : 0;
  const igstAmount = !isLocal && includeGst ? taxableValue * 0.18 : 0;
  const totalGstAmount = includeGst ? (isLocal ? (cgstAmount + sgstAmount) : igstAmount) : 0;
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
  const pages = paginateQuotation(quotation, companyProfile, activeTerms, activeSpecs, showImages, isLocal, includeGst);

  // Trigger PDF download
  const downloadPDF = () => {
    const canvasElement = document.getElementById('swraj-a4-pdf-canvas');
    if (!canvasElement) return;

    const clientNameCleaned = matchedCustomer?.name ? matchedCustomer.name.replace(/[^a-zA-Z0-9]/g, '_') : 'Client';
    const quoteNoCleaned = quotation.id ? quotation.id.replace(/[^a-zA-Z0-9]/g, '_') : 'Quote';
    const fileName = `${clientNameCleaned}_Quotation_No_${quoteNoCleaned}.pdf`;

    const opt = {
      margin: 0,
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, allowTaint: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(canvasElement).save();
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
            justify-content: flex-start !important;
            position: relative !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #swraj-a4-pdf-canvas .print-page img {
            max-height: 165px !important;
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
            onClick={downloadPDF}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white py-2 px-4 rounded-xl shadow cursor-pointer transition-colors"
          >
            <Download className="w-4 h-4" />
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
                  <div className="flex justify-between items-center border-b border-slate-300 pb-3 mb-3 shrink-0">
                    <div className="flex items-center gap-3">
                      {!companyProfile.logo && (
                        <span className="font-black text-[#1E3A8A] text-3xl select-none mr-2">{'{LOGO}'}</span>
                      )}
                      {companyProfile.logo && (
                        <img 
                          src={companyProfile.logo} 
                          alt="Company Logo" 
                          className="w-24 h-24 object-contain rounded border border-slate-100 mr-2 shrink-0" 
                        />
                      )}
                      <div className="text-left font-sans">
                        <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none mb-1.5 text-left uppercase">
                          {companyProfile.name}
                        </h1>
                        <p className="text-[10px] text-slate-600 max-w-[360px] leading-snug text-left font-bold">{companyProfile.address}</p>
                        <p className="text-[10px] text-slate-700 font-bold font-sans text-left mt-0.5 whitespace-nowrap">
                          Email: {companyProfile.email} | Mobile: {companyProfile.mobile}
                        </p>
                        {(companyProfile.gstin || companyProfile.pan) && (
                          <p className="text-[10px] text-slate-700 font-bold font-sans text-left mt-0.5 uppercase whitespace-nowrap">
                            {companyProfile.gstin ? `GSTIN: ${companyProfile.gstin}` : ''}
                            {companyProfile.gstin && companyProfile.pan ? ' | ' : ''}
                            {companyProfile.pan ? `PAN: ${companyProfile.pan}` : ''}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <h2 className="text-2xl font-black text-[#1E3A8A] tracking-widest font-sans leading-none uppercase">QUOTATION</h2>
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
                        <p className="text-slate-600 max-w-[320px] leading-snug text-left">{matchedCustomer?.address || '[Client Address]'}</p>
                        {matchedCustomer?.city && (
                          <p className="text-slate-600 font-bold text-left">{matchedCustomer.city}, {matchedCustomer.state} - {matchedCustomer.pincode}</p>
                        )}
                        <p className="text-slate-500 font-bold mt-0.5 text-[9.5px] text-left">
                          GST: {matchedCustomer?.gstin?.trim() ? matchedCustomer.gstin.trim() : 'Unregistered'} {matchedCustomer?.mobile ? `| Mob: ${matchedCustomer.mobile}` : ''}
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
                          <tr className="bg-[#1E3A8A] text-white border-b-2 border-slate-800 no-print-background">
                            <th className="p-2 w-[6%] text-center border-r border-white/20 font-black uppercase text-[10px] tracking-tight text-white">SR NO</th>
                            <th className={`p-2 ${showImages ? 'w-[26%]' : 'w-[48%]' } text-left border-r border-white/20 font-black uppercase text-[10px] tracking-tight text-white`}>ITEM DESCRIPTION</th>
                            {showImages && (
                              <th className="p-2 w-[22%] text-center border-r border-white/20 font-black uppercase text-[10px] tracking-tight text-white">ITEM IMAGE</th>
                            )}
                            <th className="p-2 w-[6%] text-center border-r border-white/20 font-black uppercase text-[10px] tracking-tight text-white">QTY</th>
                            <th className="p-2 w-[7%] text-center border-r border-white/20 font-black uppercase text-[10px] tracking-tight text-white">UNIT</th>
                            <th className="p-2 w-[10%] text-center border-r border-white/20 font-black uppercase text-[10px] tracking-tight text-white">RATE</th>
                            <th className="p-2 w-[6%] text-center border-r border-white/20 font-black uppercase text-[10px] tracking-tight text-white">DISC %</th>
                            <th className="p-2 w-[8%] text-center border-r border-white/20 font-black uppercase text-[10px] tracking-tight text-white">DISC. AMT</th>
                            <th className="p-2 w-[10%] text-center border-r border-white/20 font-black uppercase text-[10px] tracking-tight text-white">NET RATE</th>
                            <th className="p-2 w-[11%] text-center font-black uppercase text-[10px] tracking-tight text-white">AMOUNT</th>
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
                <div className="mt-3 shrink-0 text-left w-full grid grid-cols-2 gap-6 items-start font-sans">
                  
                  {/* Left Column: Material Specifications and Terms & Conditions */}
                  <div className="space-y-3">
                    {/* Block 3: Material Specifications */}
                    {page.specIndices.length > 0 && (
                      <div className="border border-slate-300 rounded-xl p-3.5 bg-white shadow-3xs text-left animate-fade-in w-full text-[9px]">
                        <p className="font-bold text-[#1E3A8A] uppercase tracking-widest text-[9.5px] border-b border-slate-200 pb-1 mb-2">
                          Material Specification
                        </p>
                        <div className="space-y-1 text-slate-700 font-bold leading-normal text-left">
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

                    {/* Block 4: Terms & Conditions */}
                    {page.termIndices.length > 0 && (
                      <div className="border border-slate-300 rounded-xl p-3.5 bg-white shadow-3xs text-left animate-fade-in w-full text-[9px]">
                        <p className="font-bold text-[#1E3A8A] uppercase tracking-widest text-[9.5px] border-b border-slate-200 pb-1 mb-2">
                          Terms & Conditions
                        </p>
                        <div className="space-y-1 text-slate-700 font-bold leading-normal text-left">
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
                  </div>

                  {/* Right Column: Totals and Bank Details */}
                  <div className="space-y-3">
                    {/* Block 1: Totals with Amount in Words */}
                    {page.hasFinancialTotals && (
                      <div className="border border-slate-300 rounded-xl p-3.5 bg-white shadow-3xs animate-fade-in w-full">
                        <div className="flex flex-col justify-between gap-3">
                          
                          {/* Totals calculations (Right Aligned) */}
                          <div className="w-full">
                            <div className="w-full space-y-0.5 text-right text-slate-850 text-[10px] font-medium leading-none font-sans">
                              <h3 className="font-bold text-[#1E3A8A] text-right mb-1.5 text-[10px] uppercase tracking-wider">Totals</h3>
                              <div className="flex justify-between border-b border-slate-100 py-[2px]">
                                <span className="text-slate-500 font-semibold text-left">Subtotal:</span>
                                <span className="font-bold text-slate-900">₹{grossSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex justify-between border-b border-slate-100 py-[2px]">
                                <span className="text-slate-500 font-semibold text-left">Discount:</span>
                                <span className="font-bold text-slate-700">₹{totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex justify-between border-b border-dashed border-slate-350 py-[2px] uppercase text-slate-900">
                                <span className="font-bold text-[8.5px] text-slate-550 text-left">Taxable Amount:</span>
                                <span className="font-extrabold text-slate-900">₹{taxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>

                              {includeGst ? (
                                isLocal ? (
                                  <>
                                    <div className="flex justify-between border-b border-slate-100 py-[2px] text-slate-600">
                                      <span className="text-left">CGST 9%:</span>
                                      <span className="font-semibold text-slate-800">₹{cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 py-[2px] text-slate-600">
                                      <span className="text-left">SGST 9%:</span>
                                      <span className="font-semibold text-slate-800">₹{sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                  </>
                                ) : (
                                  <div className="flex justify-between border-b border-slate-100 py-[2px] text-slate-600">
                                    <span className="text-left">IGST 18%:</span>
                                    <span className="font-semibold text-slate-800">₹{igstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                  </div>
                                )
                              ) : null}

                              <div className="flex justify-between border-t border-slate-400 pt-[4px] font-black text-[12.5px] text-[#1E3A8A] uppercase tracking-wider">
                                <span className="text-left">GRAND TOTAL:</span>
                                <span>₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                            </div>
                          </div>

                          {/* Amount in Words (Below grand total, nicely separated inside) */}
                          <div className="text-left border-t border-slate-150 pt-2 bg-slate-50/50 -mx-3.5 -mb-3.5 p-3 rounded-b-xl border-t border-slate-200">
                            <span className="text-slate-500 uppercase tracking-widest text-[7.5px] font-black block mb-0.5">
                              Amount in Words:
                            </span>
                            <span className="font-black text-slate-900 block leading-tight text-[9.5px]">
                              Rupees {convertNumberToWords(grandTotal)} Only
                            </span>
                          </div>

                        </div>
                      </div>
                    )}

                    {/* Block 2: Bank details */}
                    {page.hasBankDetails && (
                      <div className="w-full animate-fade-in text-[9.5px]">
                        {quotation.bankDetails.showInQuotation ? (
                          <div className="space-y-2">
                            {(quotation.banksSnapshot && Array.isArray(quotation.banksSnapshot) && quotation.banksSnapshot.length > 0
                              ? quotation.banksSnapshot
                              : [quotation.bankDetails]
                            ).map((bankAcc, bIdx) => (
                              <div key={bIdx} className="border border-slate-300 rounded-xl p-2.5 bg-white shadow-3xs text-left w-full">
                                <p className="font-extrabold text-[#1E3A8A] uppercase tracking-wider text-[9px] pb-1 border-b border-slate-200 leading-none mb-1.5">
                                  BANK DETAILS {quotation.banksSnapshot && quotation.banksSnapshot.length > 1 ? `#${bIdx + 1}` : ''}
                                  {bankAcc.accountType ? ` (${bankAcc.accountType})` : ''}:
                                </p>
                                <div className="grid grid-cols-2 gap-x-3 gap-y-1 font-bold font-sans leading-normal">
                                  {bankAcc.bankName && (
                                    <p className="truncate">
                                      <strong className="text-slate-500 font-semibold font-medium">Bank:</strong> <span className="text-slate-900 font-extrabold font-sans text-[9px]">{bankAcc.bankName}</span>
                                    </p>
                                  )}
                                  <p className="truncate">
                                    <strong className="text-slate-500 font-semibold font-medium">Holder:</strong> <span className="text-slate-800">{bankAcc.accountName || companyProfile.name}</span>
                                  </p>
                                  <p className="truncate">
                                    <strong className="text-slate-500 font-semibold font-medium">A/C:</strong> <span className="font-mono text-slate-950 font-extrabold text-[10px]">{bankAcc.accountNo}</span>
                                  </p>
                                  <p className="truncate">
                                    <strong className="text-slate-500 font-semibold font-medium">IFSC:</strong> <span className="font-mono text-slate-950 font-extrabold">{bankAcc.ifsc}</span>
                                  </p>
                                  {bankAcc.bankBranch && (
                                    <p className="truncate col-span-2 text-[9px]">
                                      <strong className="text-slate-500 font-semibold font-medium">Branch:</strong> <span className="text-slate-700 font-semibold">{bankAcc.bankBranch}</span>
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="border border-slate-300 rounded-xl p-2.5 bg-slate-50 text-slate-400 italic text-[9px] text-left leading-normal">
                            Bank transfer options available upon invoice confirmation.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                </div>

                {/* Bottom branding footer bar & pagination counter */}
                <div className="absolute bottom-[10mm] left-[15mm] right-[15mm] flex justify-between items-center border-t border-slate-200 pt-2 text-[8.5px] text-slate-500 uppercase font-black tracking-wide leading-none select-none font-sans no-print-background shrink-0 overflow-visible">
                  {/* Left Side: Page Numbers prominently on left side */}
                  <div className="flex flex-col gap-1 items-start text-left">
                    <div className="font-mono text-[9.5px] font-black text-[#1E3A8A] tracking-wider leading-none">
                      PAGE {page.pageNumber} OF {pages.length}
                    </div>
                  </div>

                  {/* Right Side: Stamp image whichever is uploaded, placed cleanly inside the right of the footer bar */}
                  <div className="relative h-10 w-40 flex items-center justify-end shrink-0">
                    {pIdx === pages.length - 1 ? (
                      companyProfile.showStampSignature && (companyProfile.stampAndSignature || companyProfile.stamp) ? (
                        <div className="relative w-full h-full">
                          <img 
                            src={companyProfile.stampAndSignature || companyProfile.stamp} 
                            alt="Authorized Stamp & Seal" 
                            className="max-h-[75px] max-w-[165px] object-contain mix-blend-multiply rotate-[-1deg] opacity-95 transition-all absolute right-[-4px] bottom-[-2px]" 
                          />
                          <div className="text-[7px] text-slate-500 font-bold select-none absolute right-[-4px] bottom-[-12px] tracking-wider uppercase font-sans whitespace-nowrap">
                            Authorized Signatory
                          </div>
                        </div>
                      ) : (
                        <div className="text-[7.5px] text-slate-400 italic font-bold select-none pr-1 uppercase tracking-wider">
                          (Signature Stamp)
                        </div>
                      )
                    ) : null}
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
