import axios from 'axios';
import { API_URL } from '../config/backend';
import { Invoice, Payout, Stats, User } from '../types';

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function loginCarpenter(phone: string) {
  const response = await client.post('/login', { phone });
  return response.data;
}

export async function loginAdmin(identifier: string, password: string) {
  const response = await client.post('/admin/login', { identifier, password });
  return response.data;
}

export async function signupCarpenter(signupData: Record<string, any>) {
  const response = await client.post('/signup', signupData);
  return response.data;
}

export async function fetchProfile(id: string): Promise<User> {
  const response = await client.get(`/profile/${id}`);
  return response.data;
}

export async function updateProfile(id: string, profileData: Record<string, any>) {
  const response = await client.post(`/profile/${id}`, profileData);
  return response.data;
}

export async function fetchStats(carpenterId: string): Promise<Stats> {
  const response = await client.get(`/stats/${carpenterId}`);
  return response.data;
}

export async function fetchInvoices(carpenterId: string): Promise<Invoice[]> {
  const response = await client.get(`/invoices/${carpenterId}`);
  return response.data;
}

export async function submitInvoice(formData: FormData) {
  const response = await axios.post(`${API_URL}/invoices`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

export async function fetchPayouts(carpenterId: string): Promise<Payout[]> {
  const response = await client.get(`/payouts/${carpenterId}`);
  return response.data;
}

export async function requestPayout(carpenterId: string, points: number, payoutType: 'UPI' | 'Bank') {
  const response = await client.post('/payouts', { carpenterId, points, payoutType });
  return response.data;
}

// ─── ADMIN API CALLS ─────────────────────────────────────────────────────────

export async function fetchAdminClaims(): Promise<Invoice[]> {
  const response = await client.get('/admin/claims');
  return response.data;
}

export async function processAdminClaim(id: string, action: 'Approved' | 'Rejected', rejectionReason?: string) {
  const response = await client.post(`/admin/claims/${id}/action`, { action, rejectionReason });
  return response.data;
}

export async function fetchAdminCarpenters(): Promise<User[]> {
  const response = await client.get('/admin/carpenters');
  return response.data;
}

export async function fetchPendingApprovals(): Promise<User[]> {
  const response = await client.get('/admin/pending-approvals');
  return response.data;
}

export async function approveCarpenter(id: string) {
  const response = await client.post(`/admin/carpenters/${id}/approve`);
  return response.data;
}

export async function rejectCarpenter(id: string) {
  const response = await client.post(`/admin/carpenters/${id}/reject`);
  return response.data;
}

export async function requestMoreInfo(id: string) {
  const response = await client.post(`/admin/carpenters/${id}/request-info`);
  return response.data;
}

export async function suspendCarpenter(id: string) {
  const response = await client.post(`/admin/carpenters/${id}/suspend`);
  return response.data;
}

export async function reactivateCarpenter(id: string) {
  const response = await client.post(`/admin/carpenters/${id}/reactivate`);
  return response.data;
}

export async function verifyCarpenter(id: string, verified: boolean) {
  const response = await client.post(`/admin/carpenters/${id}/verify`, { verified });
  return response.data;
}

export async function fetchAdminPayouts(): Promise<Payout[]> {
  const response = await client.get('/admin/payouts');
  return response.data;
}

export async function processAdminPayout(id: string, action: 'Approved' | 'Rejected') {
  const response = await client.post(`/admin/payouts/${id}/action`, { action });
  return response.data;
}
