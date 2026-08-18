# Perillo Plywood — Loyalty Rewards Platform

A full-stack, multi-platform loyalty rewards and invoice verification platform built for **Perillo Plywood**. The platform empowers carpenters and contractors to earn loyalty points on every purchased plywood sheet, request instant cashbacks via UPI and Bank Transfer, track loyalty tiers (*Member*, *Bronze*, *Silver*, *Gold*, *Platinum*), and enables administrators to verify claims and disburse payouts in real-time.

---

## 🌟 Platform Components

- **`webapp/`**: Responsive React 18 + Vite + TailwindCSS application for carpenters and administrators with 4-language i18n support (*English, Hindi, Kannada, Marathi*).
- **`mobile/`**: Cross-platform React Native + Expo mobile application with camera receipt scanning, biometric-ready interface, and native splash screens.
- **`server/`**: Express.js REST API with dual database adapter (**Supabase PostgreSQL** cloud + **SQLite** local auto-migration fallback).

---

## 🚀 Key Features

### 🔨 Carpenter Experience
- **Multi-Language Support**: Live language switcher across English, Hindi, Kannada (ಕನ್ನಡ), and Marathi (मराठी).
- **VIP Smart Loyalty Pass**: Digital membership card featuring gold EMV chip, metallic tier ribbons, points balance, and ₹ cash value calculator.
- **Invoice & Claim Submission**: Multi-image receipt capture, dynamic line-items builder (Plywood product type + sheet quantities), dealer and store tags.
- **Claims Ledger & Audit Trail**: Real-time claim status tracking (*Pending*, *Approved*, *Rejected* with admin feedback), image zoom viewer, and points credited.
- **Wallet & Instant Payouts**: 1 Pt = ₹1 redemption via direct UPI (PhonePe, GPay, Paytm) or IMPS Bank Transfer with instant point reservation.
- **Tier Progression Roadmap**: Progressive cashback slabs (0.8% up to 2.5%) and physical milestone gift unlocks (Utility Kit, Tool Pack, Power Tools, VIP Tier perks).
- **Profile & KYC Management**: Aadhaar, PAN, Bank/IFSC, linked dealer store, and verification status badges.

### 🛡️ Admin Command Center
- **Claims Verification**: Review full-resolution invoice receipts side-by-side with itemized sheet quantities; 1-click Approve with automatic point credit or Reject with custom reason.
- **Carpenter Approvals & KYC**: Review pending account registrations, verify Aadhaar & PAN details, request additional information, or suspend/reactivate accounts.
- **Payout Approvals**: Approve or reject payout redemptions with automatic point refunds.
- **Loyalty Tier Rules Matrix**: Public tier rules and milestone gifts reference table.

---

## 🛠️ Tech Stack

- **Frontend (Web)**: React 18, TypeScript, Vite, TailwindCSS, Framer Motion, Lucide Icons, Axios.
- **Mobile (App)**: React Native, Expo, React Native Safe Area Context.
- **Backend (API)**: Node.js, Express, Multer, SQLite3, Supabase REST API, PostgREST.
- **Database**: Supabase PostgreSQL (Cloud) / SQLite (`perillo_loyalty.db` fallback).

---

## 🏁 Getting Started

### 1. Backend Server
```bash
cd server
npm install
npm start
```

### 2. Web Application
```bash
cd webapp
npm install
npm run dev
```

### 3. Mobile Application
```bash
cd mobile
npm install
npx expo start
```

---

## 🔒 Environment Variables (`server/.env`)

```env
PORT=5000
ADMIN_PASSWORD=YourSecureAdminPassword
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_key
SUPABASE_ANON_KEY=your_anon_key
```

---

## 📄 License
Proprietary — Perillo Plywood. All rights reserved.
