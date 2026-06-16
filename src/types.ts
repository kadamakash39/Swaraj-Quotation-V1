export type UserRole = 'Admin' | 'Accountant' | 'Designer' | 'Sales' | 'Viewer' | 'General Manager' | 'Sales Executive';

export interface ERPUser {
  id: string;
  username: string;
  passwordHash: string; // Plaintext representation for this robust CRM design
  role: UserRole;
}

export interface CompanyProfile {
  name: string;
  logo: string; // Base64 or placeholder URL
  address: string;
  mobile: string;
  email: string;
  website: string;
  gstin: string;
  pan: string;
  stamp: string; // Base64
  signature: string; // Base64
  showStampSignature: boolean;
  stampAndSignature?: string; // Combined company stamp & signature base64
}

export interface Customer {
  id: string;
  name: string;
  companyName: string;
  address: string;
  city: string;
  state: string; // Used for GST checks (MH vs non-MH)
  pincode: string;
  mobile: string;
  email: string;
  gstin: string;
}

export interface QuotationItem {
  id: string;
  description: string;
  image?: string; // base64 or camera photo
  uom: string; // No, Sft, Rft, Set, etc.
  qty: number;
  rate: number;
  discountPercent: number; // Item-level discount override
  groupName?: string; // For Group-Wise Quotation type
}

export interface TermCondition {
  id: string;
  text: string;
  checked: boolean;
}

export interface MaterialSpecItem {
  id: string;
  text: string;
  checked: boolean;
}

export type MaterialSpecs = MaterialSpecItem[];

export interface BankDetails {
  id?: string;
  accountName: string;
  accountNo: string;
  ifsc: string;
  bankBranch: string;
  showInQuotation: boolean;
  accountType?: string; // e.g. 'Current', 'Savings' etc.
}

export interface Quotation {
  id: string; // Format: SWRJ-2026-0001
  refNumber?: string;
  date: string;
  validityDate: string;
  customerId: string;
  type: 'Standard' | 'Group-Wise';
  items: QuotationItem[];
  masterDiscountPercent: number; // Master discount %
  showImages: boolean; // Yes/No
  clientId: string; // Linked customer ID
  status: 'Pending' | 'Approved' | 'Rejected';
  createdBy: string; // User email / role
  materialSpecs: MaterialSpecs;
  terms: TermCondition[];
  bankDetails: BankDetails;
  notes?: string;
  
  // Custom snapshots to freeze state for older quotations
  companySnapshot?: CompanyProfile;
  banksSnapshot?: BankDetails[];
  includeGst?: boolean; // Option to select quotation with No GST
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}
