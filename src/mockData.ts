import { CompanyProfile, Customer, Quotation, AuditLog, TermCondition, MaterialSpecs, BankDetails } from './types';

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi',
  'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

export const DEFAULT_UOMS = ['Nos', 'Sft', 'Rft', 'Set', 'Rmt', 'Sqmt', 'Lot'];

// Stylized geometric premium SVG logos
export const MOCK_LOGO = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 310" width="200" height="310">
  <!-- Top half of Hexagon border -->
  <path d="M 22 72 L 100 24 L 178 72 L 178 115" fill="none" stroke="%23e87a24" stroke-width="17" stroke-linecap="round" stroke-linejoin="round" />
  
  <!-- Bottom half of Hexagon border -->
  <path d="M 22 198 L 22 241 L 100 289 L 178 241" fill="none" stroke="%23e87a24" stroke-width="17" stroke-linecap="round" stroke-linejoin="round" />
  
  <!-- The S-Shape in the middle -->
  <path d="M 22 198 L 78 198 C 114 198, 138 212, 138 238 C 138 266, 114 274, 95 274 C 70 274, 52 260, 52 238 C 52 208, 148 168, 148 120 C 148 94, 126 80, 100 80 C 74 80, 58 98, 55 115" fill="none" stroke="%23e87a24" stroke-width="17" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M 120 120 L 178 120 L 178 78" fill="none" stroke="%23e87a24" stroke-width="17" stroke-linecap="round" stroke-linejoin="round" />
</svg>`;

export const MOCK_STAMP = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="280" height="280" viewBox="0 0 280 280">
  <defs>
    <!-- Top arch path for SWARAJ FURNITURE PVT LTD, clockwise -->
    <path id="stamp-top-arch" d="M 38 140 A 102 102 0 1 1 242 140" fill="none"/>
    <!-- Bottom arch path for ★ BARAMATI ★, counter-clockwise -->
    <path id="stamp-bottom-arch" d="M 38 140 A 102 102 0 0 0 242 140" fill="none"/>
    
    <!-- Filter for distressed/texture stamp look -->
    <filter id="distressed-stamp-filter" x="0%" y="0%" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.25" numOctaves="4" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.2" xChannelSelector="R" yChannelSelector="G" result="displaced"/>
      <feComponentTransfer in="displaced" result="final">
        <feFuncA type="linear" slope="0.94"/>
      </feComponentTransfer>
    </filter>
  </defs>

  <g filter="url(%23distressed-stamp-filter)" fill="none" stroke="%234341b5" stroke-linecap="round" stroke-linejoin="round">
    <!-- Outer boundary distressed circles -->
    <circle cx="140" cy="140" r="130" stroke-width="5"/>
    <circle cx="140" cy="140" r="118" stroke-width="1.8"/>
    
    <!-- Inner central circle -->
    <circle cx="140" cy="140" r="82" stroke-width="2"/>
    
    <!-- Curved Text Elements -->
    <text font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="18.5" fill="%234341b5" stroke="none" letter-spacing="4">
      <textPath href="%23stamp-top-arch" startOffset="50%" text-anchor="middle">SWARAJ FURNITURE PVT LTD</textPath>
    </text>
    
    <text font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="17" fill="%234341b5" stroke="none" letter-spacing="6">
      <textPath href="%23stamp-bottom-arch" startOffset="50%" text-anchor="middle">★ BARAMATI ★</textPath>
    </text>
  </g>
</svg>`;

export const MOCK_SIGNATURE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="120" viewBox="0 0 160 120">
  <g fill="none" stroke="%23114cd4" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
    <!-- Main loop signature stroke -->
    <path d="M 25 75 Q 38 18, 48 40 T 65 80 T 80 50 T 92 70 T 100 25 T 108 100 T 125 75 T 138 88" />
    <!-- Slashed underline crossing -->
    <path d="M 15 95 L 132 62" stroke-width="3" />
  </g>
</svg>`;

export const MOCK_STAMP_SIGNATURE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
  <defs>
    <!-- Top arch path for SWARAJ FURNITURE PVT LTD, clockwise -->
    <path id="stamp-top-arch-embed" d="M 38 140 A 102 102 0 1 1 242 140" fill="none"/>
    <!-- Bottom arch path for ★ BARAMATI ★, counter-clockwise -->
    <path id="stamp-bottom-arch-embed" d="M 38 140 A 102 102 0 0 0 242 140" fill="none"/>
    
    <!-- Filter for distressed/texture stamp look -->
    <filter id="distressed-stamp-filter-embed" x="0%" y="0%" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.25" numOctaves="4" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.2" xChannelSelector="R" yChannelSelector="G" result="displaced"/>
      <feComponentTransfer in="displaced" result="final">
        <feFuncA type="linear" slope="0.94"/>
      </feComponentTransfer>
    </filter>
  </defs>

  <!-- Recreated Official Round Distressed Stamp -->
  <g transform="translate(10, 10)" filter="url(%23distressed-stamp-filter-embed)" fill="none" stroke="%234341b5" stroke-linecap="round" stroke-linejoin="round">
    <!-- Outer boundary distressed circles -->
    <circle cx="140" cy="140" r="130" stroke-width="5"/>
    <circle cx="140" cy="140" r="118" stroke-width="1.8"/>
    
    <!-- Inner central circle -->
    <circle cx="140" cy="140" r="82" stroke-width="2"/>
    
    <!-- Curved Text Elements -->
    <text font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="18.5" fill="%234341b5" stroke="none" letter-spacing="4">
      <textPath href="%23stamp-top-arch-embed" startOffset="50%" text-anchor="middle">SWARAJ FURNITURE PVT LTD</textPath>
    </text>
    
    <text font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="17" fill="%234341b5" stroke="none" letter-spacing="6">
      <textPath href="%23stamp-bottom-arch-embed" startOffset="50%" text-anchor="middle">★ BARAMATI ★</textPath>
    </text>

    <!-- Embedded high-fidelity hand-drawn blue signature placed precisely inside center -->
    <g fill="none" stroke="%23114cd4" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" transform="translate(68, 62) scale(0.9)">
      <path d="M 25 75 Q 38 18, 48 40 T 65 80 T 80 50 T 92 70 T 100 25 T 108 100 T 125 75 T 138 88" />
      <path d="M 15 95 L 132 62" stroke-width="4.5" />
    </g>
  </g>
</svg>`;

export const DEFAULT_COMPANY_PROFILE: CompanyProfile = {
  name: 'Swaraj Furniture Pvt Ltd',
  logo: MOCK_LOGO,
  address: 'Shed No. C-12, Sector Road, Opp. MIDC Office, Baramati Industrial Area, Pune, Maharashtra - 413133',
  mobile: '+91 98810 50125',
  email: 'quotations@swarajfurniture.in',
  website: 'www.swarajfurniture.in',
  gstin: '27BARB000151Z5',
  pan: 'BARB00015M',
  stamp: MOCK_STAMP,
  signature: MOCK_SIGNATURE,
  stampAndSignature: MOCK_STAMP_SIGNATURE,
  showStampSignature: true
};

export const DEFAULT_MATERIAL_SPECS: MaterialSpecs = [
  { id: 'spec-1', text: 'Plywood Core: BWP Grade (Boiling Water Proof) 18mm & 12mm IS:710 Marine Grade', checked: true },
  { id: 'spec-2', text: 'External Laminate: 1.0mm Premium Glossy/Suede Scratch Resistance SF Laminate', checked: true },
  { id: 'spec-3', text: 'Internal Backer: 0.8mm Liner White Balance Matte Laminate', checked: true },
  { id: 'spec-4', text: 'Hardware Fitting: Hettich / Enox Soft-Close Telescopic slides & 3D Hydraulic auto-hinges', checked: true },
  { id: 'spec-5', text: 'Laminate Brands: Marino / Greenlam / Royale Touche', checked: true }
];

export const DEFAULT_BANK_DETAILS: BankDetails = {
  showInQuotation: true,
  accounts: [
    {
      id: 'bank-1',
      accountName: 'Swaraj Furniture Pvt Ltd',
      accountNo: '08810500015125',
      accountType: 'Current',
      ifsc: 'BARB0BARAMA',
      bankBranch: 'Baramati MIDC Road Branch - Bank of Baroda'
    }
  ]
};

// Normalizes any stored/legacy bank details shape into the current multi-account structure.
export function normalizeBankDetails(input: any): BankDetails {
  // Already in new shape
  if (input && Array.isArray(input.accounts)) {
    return {
      showInQuotation: input.showInQuotation !== false,
      accounts: input.accounts.map((a: any, i: number) => ({
        id: a.id || `bank-${Date.now()}-${i}`,
        accountName: a.accountName || '',
        accountNo: a.accountNo || '',
        accountType: a.accountType || 'Current',
        ifsc: a.ifsc || '',
        bankBranch: a.bankBranch || ''
      }))
    };
  }
  // Legacy single-account shape -> wrap into one account
  if (input && (input.accountName || input.accountNo || input.ifsc || input.bankBranch)) {
    return {
      showInQuotation: input.showInQuotation !== false,
      accounts: [
        {
          id: 'bank-1',
          accountName: input.accountName || '',
          accountNo: input.accountNo || '',
          accountType: input.accountType || 'Current',
          ifsc: input.ifsc || '',
          bankBranch: input.bankBranch || ''
        }
      ]
    };
  }
  // Empty / undefined -> sensible default copy
  return {
    showInQuotation: input?.showInQuotation !== false,
    accounts: DEFAULT_BANK_DETAILS.accounts.map(a => ({ ...a }))
  };
}

export const DEFAULT_TERMS: TermCondition[] = [
  { id: 't1', text: 'Delivery: Within 21 to 30 days from layout approval & advance receiving.', checked: true },
  { id: 't2', text: 'Payment: 50% Advance on order confirmation, 40% on dispatch ready, 10% after successful installation.', checked: true },
  { id: 't3', text: 'Transportation & Lifting: Transportation charges at actuals extra; manual lifting beyond 2nd floor extra if lift is unavailable.', checked: true },
  { id: 't4', text: 'Warranty: 5 Years warranty on Manufacturing structure; Manufacturer OEM warranty on third-party hardware.', checked: true },
  { id: 't5', text: 'Site Readiness: Clean and lockable raw space with continuous power supply (single phase) to be arranged by customer.', checked: true },
  { id: 't6', text: 'Government Taxes: Above listed material rates are exclusive of GST. 18% GST will be calculated dynamically.', checked: true }
];

export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'c1',
    name: 'Akash Kadam',
    companyName: 'Apex Tech Solutions',
    address: 'Flat 502, Shivalik Residency, Court Road, Baramati',
    city: 'Baramati',
    state: 'Maharashtra', // CGST, SGST will apply
    pincode: '413102',
    mobile: '+91 99754 89230',
    email: 'kadam.akash39@gmail.com',
    gstin: '27AAMCA8832K1Z0'
  },
  {
    id: 'c2',
    name: 'Rajesh Nair',
    companyName: 'Nair Interior Designs',
    address: 'Nair Villa, Behind Kalyan Jewellers, MG Road, Ernakulam',
    city: 'Kochi',
    state: 'Kerala', // IGST will apply
    pincode: '682011',
    mobile: '+91 90481 05412',
    email: 'rajesh.nair@nairinteriors.com',
    gstin: '32AADCN5692Q2Z4'
  },
  {
    id: 'c3',
    name: 'Sameer Mehra',
    companyName: 'Prime Spaces Pvt Ltd',
    address: 'Indiranagar 80 Feet Road, Beside Starbucks Coffee',
    city: 'Bengaluru',
    state: 'Karnataka', // IGST will apply
    pincode: '560038',
    mobile: '+91 80562 14321',
    email: 'sameer@primespaces.in',
    gstin: '29AAACP9921B1ZN'
  }
];

// Stylized Vector SVGs representing furniture items, to display inline nicely
export const FURNITURE_IMAGES = {
  wardrobe: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
    <rect width="60" height="60" fill="%23f1f5f9" rx="8"/>
    <rect x="15" y="10" width="30" height="40" rx="3" fill="none" stroke="%23475569" stroke-width="2"/>
    <line x1="30" y1="10" x2="30" y2="50" stroke="%23475569" stroke-width="1.5"/>
    <circle cx="26" cy="30" r="2" fill="%23b45309"/>
    <circle cx="34" cy="30" r="2" fill="%23b45309"/>
    <line x1="15" y1="42" x2="45" y2="42" stroke="%2394a3b8" stroke-dasharray="2 2"/>
  </svg>`,
  bed: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
    <rect width="60" height="60" fill="%23f1f5f9" rx="8"/>
    <rect x="10" y="25" width="40" height="25" rx="2" fill="none" stroke="%23475569" stroke-width="2"/>
    <rect x="10" y="10" width="40" height="15" fill="%23cbd5e1" rx="1"/>
    <rect x="14" y="18" width="14" height="10" rx="1" fill="%23ffffff" stroke="%23475569" stroke-width="1"/>
    <rect x="32" y="18" width="14" height="10" rx="1" fill="%23ffffff" stroke="%23475569" stroke-width="1"/>
    <path d="M10 32 L 50 32" stroke="%23e2e8f0" stroke-width="2"/>
  </svg>`,
  tv_unit: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
    <rect width="60" height="60" fill="%23f1f5f9" rx="8"/>
    <rect x="12" y="15" width="36" height="20" rx="2" fill="%23334155"/>
    <rect x="10" y="40" width="40" height="8" rx="1" fill="none" stroke="%23475569" stroke-width="1.5"/>
    <line x1="24" y1="40" x2="24" y2="48" stroke="%23475569" stroke-width="1.5"/>
    <line x1="36" y1="40" x2="36" y2="48" stroke="%23475569" stroke-width="1.5"/>
    <circle cx="28" cy="25" r="1.5" fill="%23ffffff"/>
  </svg>`,
  table: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
    <rect width="60" height="60" fill="%23f1f5f9" rx="8"/>
    <line x1="15" y1="25" x2="15" y2="50" stroke="%23475569" stroke-width="2"/>
    <line x1="45" y1="25" x2="45" y2="50" stroke="%23475569" stroke-width="2"/>
    <line x1="25" y1="25" x2="22" y2="46" stroke="%2394a3b8" stroke-width="1"/>
    <line x1="35" y1="25" x2="38" y2="46" stroke="%2394a3b8" stroke-width="1"/>
    <rect x="10" y="20" width="40" height="6" rx="1" fill="%23b45309" stroke="%23475569" stroke-width="1"/>
  </svg>`,
  sofa: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
    <rect width="60" height="60" fill="%23f1f5f9" rx="8"/>
    <path d="M12 25 L 12 45 C 12 47, 14 49, 16 49 L 44 49 C 46 49, 48 47, 48 45 L 48 25" fill="none" stroke="%23475569" stroke-width="2"/>
    <path d="M12 28 C 12 20, 48 20, 48 28" fill="none" stroke="%23475569" stroke-width="2"/>
    <rect x="15" y="32" width="14" height="12" rx="1" fill="%23cbd5e1" stroke="%23475569" stroke-width="1"/>
    <rect x="31" y="32" width="14" height="12" rx="1" fill="%23cbd5e1" stroke="%23475569" stroke-width="1"/>
  </svg>`
};

export const MOCK_QUOTATIONS: Quotation[] = [
  {
    id: 'SWRJ-2026-0001',
    refNumber: 'SE-PR-9012',
    date: '2026-06-01',
    validityDate: '2026-06-30',
    customerId: 'c1',
    clientId: 'c1',
    type: 'Standard',
    status: 'Approved',
    createdBy: 'Sales Admin',
    masterDiscountPercent: 5,
    showImages: true,
    materialSpecs: { ...DEFAULT_MATERIAL_SPECS },
    terms: [ ...DEFAULT_TERMS ],
    bankDetails: { ...DEFAULT_BANK_DETAILS },
    notes: 'Premium client. Bedroom woodwork project.',
    items: [
      {
        id: 'item-101',
        description: 'Premium Sliding Wardrobe with glass insertion, crafted in 18mm Marine Plywood with internal white laminations, fully equipped with soft-close hydraulic sliding channel, 4 drawers and hanger rod.',
        image: FURNITURE_IMAGES.wardrobe,
        uom: 'Sft',
        qty: 120,
        rate: 1650,
        discountPercent: 0
      },
      {
        id: 'item-102',
        description: 'Bedside Night Stands (Set of 2) with 2 smooth full-extension drawer channels and lock system.',
        image: FURNITURE_IMAGES.table,
        uom: 'Nos',
        qty: 2,
        rate: 8500,
        discountPercent: 10
      }
    ]
  },
  {
    id: 'SWRJ-2026-0002',
    refNumber: 'NID-MH-102',
    date: '2026-06-10',
    validityDate: '2026-07-10',
    customerId: 'c2',
    clientId: 'c2',
    type: 'Group-Wise',
    status: 'Pending',
    createdBy: 'Sales Executive',
    masterDiscountPercent: 10,
    showImages: true,
    materialSpecs: [
      { id: 'mspec-1', text: 'Plywood Core: Greenply Club 18mm BWR IS:303 Class A Plywood', checked: true },
      { id: 'mspec-2', text: 'External Laminate: 1.0mm Acrylic Charcoal Laminate with Seamless Edge-banding', checked: true },
      { id: 'mspec-3', text: 'Internal Backer: 0.8mm Liner Frosty White Laminate', checked: true },
      { id: 'mspec-4', text: 'Hardware Fitting: Blum Soft-Close Concealed Hinges and Runners', checked: true },
      { id: 'mspec-5', text: 'Laminate Brands: Royale Touche 1.2mm Acrylics', checked: true }
    ],
    terms: [ ...DEFAULT_TERMS ],
    bankDetails: { ...DEFAULT_BANK_DETAILS },
    notes: 'Interstate shipment. IGST applies at 18%. Group wise listings.',
    items: [
      // Bedroom GROUP
      {
        id: 'item-201',
        description: 'Modular King Size Bed with full pneumatic hydrolytic manual safety storage, customized headboard cushioning with velvet fabrics.',
        image: FURNITURE_IMAGES.bed,
        uom: 'Nos',
        qty: 1,
        rate: 68000,
        discountPercent: 0,
        groupName: 'Bedroom Furniture'
      },
      {
        id: 'item-202',
        description: 'Wall-mounted Compact Dressing Unit with tall copper-free silver mirror and concealed storage shelving.',
        image: FURNITURE_IMAGES.wardrobe,
        uom: 'Nos',
        qty: 1,
        rate: 18500,
        discountPercent: 5,
        groupName: 'Bedroom Furniture'
      },
      // Living Room GROUP
      {
        id: 'item-203',
        description: 'Elite Floating TV Credenza Unit with integrated wire-managers, three drawers, and top wooden display rafters.',
        image: FURNITURE_IMAGES.tv_unit,
        uom: 'Nos',
        qty: 1,
        rate: 34000,
        discountPercent: 0,
        groupName: 'Living Room Furniture'
      },
      {
        id: 'item-204',
        description: 'L-Shaped Premium Custom Tufted Fabric Sofa Set (7 Seater) with luxury supportive high-density sleepwell polyurethane foams.',
        image: FURNITURE_IMAGES.sofa,
        uom: 'Set',
        qty: 1,
        rate: 98000,
        discountPercent: 0,
        groupName: 'Living Room Furniture'
      }
    ]
  }
];

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'l-1',
    timestamp: '2026-06-12 09:30 AM',
    user: 'kadam.akash39@gmail.com (Admin)',
    action: 'CREATE_QUOTATION',
    details: 'Created quotation SWRJ-2026-0001 for Akash Kadam.'
  },
  {
    id: 'l-2',
    timestamp: '2026-06-12 10:15 AM',
    user: 'sales@swarajfurniture.in (Sales)',
    action: 'GENERATE_PDF',
    details: 'Generated and downloaded A4 PDF for SWRJ-2026-0001.'
  },
  {
    id: 'l-3',
    timestamp: '2026-06-12 11:00 AM',
    user: 'kadam.akash39@gmail.com (Admin)',
    action: 'UPDATE_COMPANY_PROFILE',
    details: 'Updated active GSTIN details and signature authorization.'
  }
];
