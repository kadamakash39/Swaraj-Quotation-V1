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

export interface BankAccount {
  id: string;
  accountName: string;
  accountNo: string;
  accountType: string; // Savings / Current / Cash Credit etc.
  ifsc: string;
  bankBranch: string;
}

export interface BankDetails {
  accounts: BankAccount[];
  showInQuotation: boolean;
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
  gstEnabled?: boolean; // When false, no GST is calculated or shown (defaults to true)
  groups?: string[]; // Persisted custom group order/names for Group-Wise quotations
  clientId: string; // Linked customer ID
  status: 'Pending' | 'Approved' | 'Rejected';
  createdBy: string; // User email / role
  materialSpecs: MaterialSpecs;
  terms: TermCondition[];
  bankDetails: BankDetails;
  companySnapshot?: CompanyProfile; // Frozen company profile captured at save time
  notes?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}
