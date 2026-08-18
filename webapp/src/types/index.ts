export type Role = 'carpenter' | 'admin';

export type UserStatus = 
  | 'pending_approval' 
  | 'approved' 
  | 'rejected' 
  | 'more_info_requested' 
  | 'suspended';

export interface User {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  role: Role;
  status?: UserStatus;
  region?: string;
  city?: string;
  state?: string;
  aadhaar_number?: string;
  pan_card?: string;
  preferred_language?: string;
  upi_id?: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  tier?: string;
  total_sheets?: number;
  points_balance?: number;
  verified?: boolean | string;
  linked_dealer?: string;
  raw?: any;
}

export interface Stats {
  pointsBalance: number;
  pendingClaims: number;
  approvedClaims: number;
  totalSheets: number;
  tier: string;
  tierColor: string;
  tierRewardPct: number;
  nextTier: string | null;
  nextTierSheets: number | null;
  verified: boolean;
}

export interface LineItem {
  product: string;
  quantity: number | string;
}

export interface Invoice {
  id: string;
  carpenter_id: string;
  dealer_name?: string;
  dealer_city?: string;
  store_name?: string;
  product_type: string;
  quantity: number;
  invoice_number: string;
  purchase_date: string;
  qr_code?: string;
  image_url?: string;
  image_urls: string[] | string;
  status: 'Pending' | 'Approved' | 'Rejected';
  points_earned: number;
  rejection_reason?: string;
  created_at: string;
  line_items?: string | LineItem[];
  carpenter_name?: string;
  carpenter_phone?: string;
}

export interface Payout {
  id: string;
  carpenter_id: string;
  amount: number;
  points_redeemed: number;
  payout_type: 'UPI' | 'Bank';
  status: 'Requested' | 'Approved' | 'Rejected';
  created_at: string;
  carpenter_name?: string;
  carpenter_phone?: string;
  upi_id?: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
}

export interface TierInfo {
  name: string;
  minSheets: number;
  rewardPct: number;
  color: string;
}

export interface Milestone {
  sheets: number;
  gift: string;
}

export interface LanguageOption {
  code: 'en' | 'hi' | 'kn' | 'mr';
  label: string;
}
