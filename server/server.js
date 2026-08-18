require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Perillo@2026';

// Enable CORS
app.use(cors());

// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure upload directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create a simple placeholder image for seeded data if not exists
const placeholderPath = path.join(uploadsDir, 'placeholder_invoice.jpg');
if (!fs.existsSync(placeholderPath)) {
  const base64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88f7TfwAJhQOD2l8sLgAAAABJRU5ErkJggg==';
  fs.writeFileSync(placeholderPath, Buffer.from(base64Data, 'base64'));
}

// Serve static uploaded files
app.use('/uploads', express.static(uploadsDir));

app.get('/', (req, res) => {
  res.json({
    success: true,
    service: 'Perillo Loyalty Backend',
    message: 'Backend is running',
    health: '/health'
  });
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Serve Admin Dashboard
app.get('/admin', (req, res) => {
      res.status(410).send('Admin dashboard is now inside the mobile app. Use the Expo client to sign in as admin.');
});

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname || '.jpg'));
  }
});
const upload = multer({ storage: storage });

// ─── Tier Calculation Helper ───────────────────────────────────────────────
const TIERS = [
  { name: 'Member',   minSheets: 0,    rewardPct: 0.8,  color: '#94A3B8' },
  { name: 'Bronze',   minSheets: 100,  rewardPct: 1.0,  color: '#CD7F32' },
  { name: 'Silver',   minSheets: 400,  rewardPct: 1.5,  color: '#9CA3AF' },
  { name: 'Gold',     minSheets: 700,  rewardPct: 2.0,  color: '#F59E0B' },
  { name: 'Platinum', minSheets: 1000, rewardPct: 2.5,  color: '#8B5CF6' }
];

function calculateTier(totalSheets) {
  let tier = TIERS[0];
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (totalSheets >= TIERS[i].minSheets) {
      tier = TIERS[i];
      break;
    }
  }
  return tier;
}

function getNextTier(currentTierName) {
  const idx = TIERS.findIndex(t => t.name === currentTierName);
  if (idx < TIERS.length - 1) return TIERS[idx + 1];
  return null;
}

function normalizeInvoiceRecord(invoice) {
  if (!invoice) return invoice;

  let imageUrls = [];
  if (Array.isArray(invoice.image_urls)) {
    imageUrls = invoice.image_urls;
  } else if (typeof invoice.image_urls === 'string' && invoice.image_urls.trim()) {
    try {
      const parsed = JSON.parse(invoice.image_urls);
      if (Array.isArray(parsed)) imageUrls = parsed;
    } catch (error) {
      imageUrls = [invoice.image_urls];
    }
  }

  if (!imageUrls.length && invoice.image_url) {
    imageUrls = [invoice.image_url];
  }

  return {
    ...invoice,
    image_urls: imageUrls,
    image_url: imageUrls[0] || invoice.image_url || ''
  };
}

// ─── API Routes ────────────────────────────────────────────────────────────

// 1. Mobile Login (Carpenter — phone based)
app.post('/api/login', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    let carpenters = await db.query('SELECT * FROM carpenters WHERE phone = $1', [phone]);
    if (carpenters.length === 0) {
      return res.status(404).json({ error: 'This phone number is not registered. Please sign up first.' });
    }

    const carpenter = carpenters[0];
    res.json({ success: true, user: { ...carpenter, role: 'carpenter' } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// 1.5 Carpenter Signup (with pending_approval state)
app.post('/api/signup', async (req, res) => {
  try {
    const { name, phone, email, city, state, aadhaarNumber, panCard, preferredLanguage, bankName, accountNumber, ifscCode, upiId } = req.body;
    
    if (!name || !phone || !city || !state || !aadhaarNumber) {
      return res.status(400).json({ error: 'Name, Phone, City, State and Aadhaar Number are required.' });
    }

    // Check if phone number is already registered
    let existing = await db.query('SELECT * FROM carpenters WHERE phone = $1', [phone]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'This phone number is already registered. Please log in.' });
    }

    const newId = 'P-' + Math.floor(100000 + Math.random() * 900000);
    
    await db.query(
      `INSERT INTO carpenters (id, name, phone, region, points_balance, verified, total_sheets, tier, status, email, city, state, preferred_language, bank_name, account_number, ifsc_code, aadhaar_number, pan_card, upi_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
      [
        newId,
        name,
        phone,
        `${city}, ${state}`,
        0, // points_balance
        'false', // verified
        0, // total_sheets
        'Member', // tier
        'pending_approval',
        email || null,
        city,
        state,
        preferredLanguage || 'en',
        bankName || null,
        accountNumber || null,
        ifscCode || null,
        aadhaarNumber,
        panCard || null,
        upiId || null
      ]
    );

    const newCarpenters = await db.query('SELECT * FROM carpenters WHERE id = $1', [newId]);
    console.log(`New carpenter registration submitted: ${newId} (pending_approval)`);

    res.json({
      success: true,
      message: 'Signup successful! Awaiting administrator approval.',
      user: { ...newCarpenters[0], role: 'carpenter' }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

// 2. Admin Login (Password based)
app.post('/api/admin/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Admin identifier and password are required' });
    }
    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Invalid admin password' });
    }
    res.json({
      success: true,
      user: {
        id: 'admin',
        name: 'Admin',
        email: identifier,
        role: 'admin'
      },
      message: 'Admin authenticated'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during admin login' });
  }
});

// 2.5 Admin Approval endpoints
app.get('/api/admin/pending-approvals', async (req, res) => {
  try {
    const pending = await db.query("SELECT * FROM carpenters WHERE status = 'pending_approval' ORDER BY name ASC");
    res.json(pending);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error listing pending approvals' });
  }
});

app.post('/api/admin/carpenters/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const carpenters = await db.query('SELECT * FROM carpenters WHERE id = $1', [id]);
    if (carpenters.length === 0) {
      return res.status(404).json({ error: 'Carpenter not found' });
    }
    await db.query("UPDATE carpenters SET status = 'approved', verified = 'true' WHERE id = $1", [id]);
    console.log(`Approved carpenter account: ${id}`);
    res.json({ success: true, message: 'Carpenter approved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error approving carpenter' });
  }
});

app.post('/api/admin/carpenters/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const carpenters = await db.query('SELECT * FROM carpenters WHERE id = $1', [id]);
    if (carpenters.length === 0) {
      return res.status(404).json({ error: 'Carpenter not found' });
    }
    await db.query("UPDATE carpenters SET status = 'rejected', verified = 'false' WHERE id = $1", [id]);
    console.log(`Rejected carpenter account: ${id}`);
    res.json({ success: true, message: 'Carpenter account rejected' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error rejecting carpenter' });
  }
});

app.post('/api/admin/carpenters/:id/request-info', async (req, res) => {
  try {
    const { id } = req.params;
    const carpenters = await db.query('SELECT * FROM carpenters WHERE id = $1', [id]);
    if (carpenters.length === 0) {
      return res.status(404).json({ error: 'Carpenter not found' });
    }
    await db.query("UPDATE carpenters SET status = 'more_info_requested' WHERE id = $1", [id]);
    console.log(`Requested more info for carpenter: ${id}`);
    res.json({ success: true, message: 'More info requested from carpenter' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error requesting info' });
  }
});

app.post('/api/admin/carpenters/:id/suspend', async (req, res) => {
  try {
    const { id } = req.params;
    const carpenters = await db.query('SELECT * FROM carpenters WHERE id = $1', [id]);
    if (carpenters.length === 0) {
      return res.status(404).json({ error: 'Carpenter not found' });
    }
    await db.query("UPDATE carpenters SET status = 'suspended' WHERE id = $1", [id]);
    console.log(`Suspended carpenter: ${id}`);
    res.json({ success: true, message: 'Carpenter suspended successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error suspending carpenter' });
  }
});

app.post('/api/admin/carpenters/:id/reactivate', async (req, res) => {
  try {
    const { id } = req.params;
    const carpenters = await db.query('SELECT * FROM carpenters WHERE id = $1', [id]);
    if (carpenters.length === 0) {
      return res.status(404).json({ error: 'Carpenter not found' });
    }
    await db.query("UPDATE carpenters SET status = 'approved' WHERE id = $1", [id]);
    console.log(`Reactivated carpenter: ${id}`);
    res.json({ success: true, message: 'Carpenter reactivated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error reactivating carpenter' });
  }
});

// 3. Get Carpenter Profile
app.get('/api/profile/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const carpenters = await db.query('SELECT * FROM carpenters WHERE id = $1', [id]);
    if (carpenters.length === 0) {
      return res.status(404).json({ error: 'Carpenter not found' });
    }
    res.json(carpenters[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching profile' });
  }
});

// 4. Update Carpenter Profile (including Bank + Aadhaar)
app.post('/api/profile/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, region, upi_id, bank_name, account_number, ifsc_code, aadhaar_number, pan_card } = req.body;

    const carpenters = await db.query('SELECT * FROM carpenters WHERE id = $1', [id]);
    if (carpenters.length === 0) {
      return res.status(404).json({ error: 'Carpenter not found' });
    }

    const carpenter = carpenters[0];
    const currentStatus = carpenter.status;
    let nextStatus = currentStatus;
    if (currentStatus === 'more_info_requested') {
      nextStatus = 'pending_approval';
    }

    await db.query(
      `UPDATE carpenters 
       SET name = $1, region = $2, upi_id = $3, bank_name = $4, account_number = $5, ifsc_code = $6, aadhaar_number = $7, pan_card = $8, status = $9
       WHERE id = $10`,
      [name, region, upi_id, bank_name, account_number, ifsc_code, aadhaar_number || '', pan_card || '', nextStatus, id]
    );

    const updated = await db.query('SELECT * FROM carpenters WHERE id = $1', [id]);
    res.json({ success: true, message: 'Profile updated successfully', user: updated[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating profile' });
  }
});

// 5. Submit Invoice (Multi-item support)
app.post('/api/invoices', upload.array('images', 10), async (req, res) => {
  try {
    const { carpenterId, storeName, dealerCity, lineItems, invoiceNumber, purchaseDate, qrCode } = req.body;

    const files = Array.isArray(req.files) ? req.files : [];
    if (files.length === 0) {
      return res.status(400).json({ error: 'At least one invoice image file is required' });
    }
    if (!carpenterId || !storeName || !dealerCity || !lineItems || !invoiceNumber || !purchaseDate) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Parse line items
    let items;
    try {
      items = JSON.parse(lineItems);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid line items format' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one line item is required' });
    }

    // Calculate total quantity
    const totalQuantity = items.reduce((sum, item) => sum + (parseInt(item.quantity, 10) || 0), 0);
    if (totalQuantity <= 0) {
      return res.status(400).json({ error: 'Total quantity must be greater than zero' });
    }

    // Build summary for backward-compat columns
    const productSummary = items.map(it => `${it.product} ×${it.quantity}`).join(', ');

    const imageUrls = files.map(file => `/uploads/${file.filename}`);
    const imagePath = imageUrls[0];
    const invId = 'INV-' + Math.floor(100000 + Math.random() * 900000);
    const nowStr = new Date().toISOString();

    await db.query(
      `INSERT INTO invoices (id, carpenter_id, dealer_name, dealer_city, product_type, quantity, invoice_number, purchase_date, qr_code, image_url, image_urls, status, points_earned, created_at, line_items, store_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        invId,
        carpenterId,
        storeName,
        dealerCity,
        productSummary,
        totalQuantity,
        invoiceNumber,
        purchaseDate,
        qrCode || '',
        imagePath,
        JSON.stringify(imageUrls),
        'Pending',
        0,
        nowStr,
        JSON.stringify(items),
        storeName
      ]
    );

    res.json({
      success: true,
      message: 'Invoice submitted successfully!',
      trackingId: invId
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error submitting invoice' });
  }
});

// 6. Get Carpenter Invoices
app.get('/api/invoices/:carpenterId', async (req, res) => {
  try {
    const { carpenterId } = req.params;
    const invoices = await db.query(
      'SELECT * FROM invoices WHERE carpenter_id = $1 ORDER BY created_at DESC',
      [carpenterId]
    );
    res.json(invoices.map(normalizeInvoiceRecord));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching invoices' });
  }
});

// 7. Get Carpenter Payouts
app.get('/api/payouts/:carpenterId', async (req, res) => {
  try {
    const { carpenterId } = req.params;
    const payouts = await db.query(
      'SELECT * FROM payouts WHERE carpenter_id = $1 ORDER BY created_at DESC',
      [carpenterId]
    );
    res.json(payouts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching payouts' });
  }
});

// 8. Request Payout (Carpenter side — status = Requested, admin approves later)
app.post('/api/payouts', async (req, res) => {
  try {
    const { carpenterId, points, payoutType } = req.body;
    if (!carpenterId || !points || !payoutType) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const pointsNum = parseInt(points, 10);
    const carpenters = await db.query('SELECT * FROM carpenters WHERE id = $1', [carpenterId]);
    if (carpenters.length === 0) {
      return res.status(404).json({ error: 'Carpenter not found' });
    }

    const carpenter = carpenters[0];
    if (carpenter.points_balance < pointsNum) {
      return res.status(400).json({ error: 'Insufficient points balance' });
    }

    const redeemAmount = pointsNum; // 1 Point = ₹1
    const newBalance = carpenter.points_balance - pointsNum;
    const payId = 'PAY-' + Math.floor(100000 + Math.random() * 900000);
    const nowStr = new Date().toISOString();

    // Deduct points immediately
    await db.query('UPDATE carpenters SET points_balance = $1 WHERE id = $2', [newBalance, carpenterId]);

    // Create payout record with Requested status
    await db.query(
      `INSERT INTO payouts (id, carpenter_id, amount, points_redeemed, payout_type, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [payId, carpenterId, redeemAmount, pointsNum, payoutType, 'Requested', nowStr]
    );

    res.json({
      success: true,
      message: `Payout request of ₹${redeemAmount} submitted. Admin will process it shortly.`,
      newBalance
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error processing payout request' });
  }
});

// 9. Get Stats (with tier info)
app.get('/api/stats/:carpenterId', async (req, res) => {
  try {
    const { carpenterId } = req.params;

    const carpenters = await db.query('SELECT * FROM carpenters WHERE id = $1', [carpenterId]);
    if (carpenters.length === 0) {
      return res.status(404).json({ error: 'Carpenter not found' });
    }

    const carpenter = carpenters[0];
    const totalSheets = parseInt(carpenter.total_sheets || 0, 10);
    const tier = calculateTier(totalSheets);
    const nextTier = getNextTier(tier.name);

    const pendingCount = await db.query(
      "SELECT COUNT(*) as count FROM invoices WHERE carpenter_id = $1 AND status = 'Pending'",
      [carpenterId]
    );

    const approvedCount = await db.query(
      "SELECT COUNT(*) as count FROM invoices WHERE carpenter_id = $1 AND status = 'Approved'",
      [carpenterId]
    );

    res.json({
      pointsBalance: carpenter.points_balance || 0,
      pendingClaims: parseInt(pendingCount[0].count || pendingCount[0].COUNT || 0, 10),
      approvedClaims: parseInt(approvedCount[0].count || approvedCount[0].COUNT || 0, 10),
      totalSheets,
      tier: tier.name,
      tierColor: tier.color,
      tierRewardPct: tier.rewardPct,
      nextTier: nextTier ? nextTier.name : null,
      nextTierSheets: nextTier ? nextTier.minSheets : null,
      verified: carpenter.verified === true || carpenter.verified === 'true'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching stats' });
  }
});

// 10. Get tier info (public)
app.get('/api/tiers', (req, res) => {
  const milestones = [
    { sheets: 100, gift: 'Branded utility item' },
    { sheets: 400, gift: 'Carpenter tool support gift' },
    { sheets: 700, gift: 'Premium tool kit or bonus reward' },
    { sheets: 1000, gift: 'Highest cashback slab / premium loyalty benefit' }
  ];
  res.json({ tiers: TIERS, milestones });
});

// ─── ADMIN ENDPOINTS ───────────────────────────────────────────────────────

// 11. Admin: List all claims
app.get('/api/admin/claims', async (req, res) => {
  try {
    const claims = await db.query(
      `SELECT invoices.*, carpenters.name as carpenter_name, carpenters.phone as carpenter_phone 
       FROM invoices 
       JOIN carpenters ON invoices.carpenter_id = carpenters.id 
       ORDER BY invoices.created_at DESC`
    );
    res.json(claims.map(normalizeInvoiceRecord));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error listing claims' });
  }
});

// 12. Admin: Action on claim (Approve/Reject)
app.post('/api/admin/claims/:id/action', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, rejectionReason } = req.body;

    if (!action || !['Approved', 'Rejected'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Must be Approved or Rejected' });
    }

    const invoices = await db.query('SELECT * FROM invoices WHERE id = $1', [id]);
    if (invoices.length === 0) {
      return res.status(404).json({ error: 'Invoice claim not found' });
    }

    const invoice = invoices[0];
    if (invoice.status !== 'Pending') {
      return res.status(400).json({ error: 'Claim has already been processed' });
    }

    if (action === 'Approved') {
      const qty = parseInt(invoice.quantity, 10);
      
      // Get carpenter's current tier for reward calculation
      const carpenters = await db.query('SELECT * FROM carpenters WHERE id = $1', [invoice.carpenter_id]);
      const carpenter = carpenters[0];
      const currentSheets = parseInt(carpenter.total_sheets || 0, 10);
      const newTotalSheets = currentSheets + qty;
      const tier = calculateTier(newTotalSheets);
      
      // Points = quantity × 100 (base points per sheet)
      const points = qty * 100;

      // Update invoice status & points
      await db.query(
        "UPDATE invoices SET status = 'Approved', points_earned = $1 WHERE id = $2",
        [points, id]
      );

      // Add points to carpenter balance + update total_sheets + recalculate tier
      await db.query(
        "UPDATE carpenters SET points_balance = points_balance + $1, total_sheets = $2, tier = $3 WHERE id = $4",
        [points, newTotalSheets, tier.name, invoice.carpenter_id]
      );

      console.log(`Approved claim ${id}: ${qty} sheets, +${points} pts, tier=${tier.name} for ${invoice.carpenter_id}`);
      res.json({ success: true, message: `Claim approved. ${points} points awarded. Tier: ${tier.name}` });
    } else {
      await db.query(
        "UPDATE invoices SET status = 'Rejected', rejection_reason = $1 WHERE id = $2",
        [rejectionReason || 'Documents verification failed', id]
      );

      console.log(`Rejected claim ${id}: ${rejectionReason}`);
      res.json({ success: true, message: `Claim rejected. Reason: ${rejectionReason}` });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error processing claim' });
  }
});

// 13. Admin: List all carpenters
app.get('/api/admin/carpenters', async (req, res) => {
  try {
    const carpenters = await db.query('SELECT * FROM carpenters ORDER BY name');
    res.json(carpenters);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error listing carpenters' });
  }
});

// 14. Admin: Verify/Unverify carpenter
app.post('/api/admin/carpenters/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    const { verified } = req.body;

    const carpenters = await db.query('SELECT * FROM carpenters WHERE id = $1', [id]);
    if (carpenters.length === 0) {
      return res.status(404).json({ error: 'Carpenter not found' });
    }

    const verifiedVal = verified ? 'true' : 'false';
    await db.query('UPDATE carpenters SET verified = $1 WHERE id = $2', [verifiedVal, id]);

    console.log(`Carpenter ${id} verification set to ${verifiedVal}`);
    res.json({ success: true, message: `Carpenter ${verified ? 'verified' : 'unverified'} successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating verification' });
  }
});

// 15. Admin: List all payouts
app.get('/api/admin/payouts', async (req, res) => {
  try {
    const payouts = await db.query(
      `SELECT payouts.*, carpenters.name as carpenter_name, carpenters.phone as carpenter_phone 
       FROM payouts 
       JOIN carpenters ON payouts.carpenter_id = carpenters.id 
       ORDER BY payouts.created_at DESC`
    );
    res.json(payouts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error listing payouts' });
  }
});

// 16. Admin: Approve/Reject payout
app.post('/api/admin/payouts/:id/action', async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    if (!action || !['Approved', 'Rejected'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const payouts = await db.query('SELECT * FROM payouts WHERE id = $1', [id]);
    if (payouts.length === 0) {
      return res.status(404).json({ error: 'Payout not found' });
    }

    const payout = payouts[0];
    if (payout.status !== 'Requested') {
      return res.status(400).json({ error: 'Payout has already been processed' });
    }

    if (action === 'Rejected') {
      // Refund points back to carpenter
      await db.query(
        'UPDATE carpenters SET points_balance = points_balance + $1 WHERE id = $2',
        [payout.points_redeemed, payout.carpenter_id]
      );
    }

    await db.query("UPDATE payouts SET status = $1 WHERE id = $2", [action, id]);
    console.log(`Payout ${id} ${action}`);
    res.json({ success: true, message: `Payout ${action.toLowerCase()} successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error processing payout' });
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'An unexpected server error occurred' });
});

// Detect LAN IP for hotspot/network display
function getLanIp() {
  try {
    const os = require('os');
    const nets = os.networkInterfaces();
    let fallback = null;
    for (const name of Object.keys(nets)) {
      const lowerName = name.toLowerCase();
      if (
        lowerName.includes('vmware') ||
        lowerName.includes('virtual') ||
        lowerName.includes('vbox') ||
        lowerName.includes('wsl') ||
        lowerName.includes('vethernet') ||
        lowerName.includes('mcafee') ||
        lowerName.includes('vpn')
      ) {
        continue;
      }
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          if (lowerName.includes('wi-fi') || lowerName.includes('wireless') || lowerName.includes('wlan')) {
            return net.address;
          }
          if (!fallback) fallback = net.address;
        }
      }
    }
    if (fallback) return fallback;
  } catch (e) {}
  return 'localhost';
}

// Start DB then server
db.setupDb().then(() => {
  const server = app.listen(PORT, '0.0.0.0', () => {
    const lanIp = getLanIp();
    console.log(`\n========================================================`);
    console.log(`  Perillo Loyalty Backend is RUNNING`);
    console.log(`========================================================`);
    console.log(`  Local:   http://localhost:${PORT}`);
    console.log(`  Network: http://${lanIp}:${PORT}`);
    console.log(`  Health:  http://${lanIp}:${PORT}/health`);
    console.log(`  API:     http://${lanIp}:${PORT}/api`);
    console.log(`--------------------------------------------------------`);
    console.log(`  Admin Password: ${ADMIN_PASSWORD}`);
    console.log(`========================================================`);
    console.log(`\n  [!] For Expo mobile app, set your backend IP to:`);
    console.log(`      EXPO_PUBLIC_API_HOST=${lanIp}\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n========================================================`);
      console.error(`  ERROR: Port ${PORT} is already in use!`);
      console.error(`========================================================`);
      console.error(`  Another instance of the server is already running.`);
      console.error(`  Either stop the other instance first, or change the`);
      console.error(`  PORT in your .env file to a different number.`);
      console.error(`\n  To find and kill the process using port ${PORT}:`);
      console.error(`    netstat -aon | findstr :${PORT}`);
      console.error(`    taskkill /PID <PID_NUMBER> /F`);
      console.error(`========================================================\n`);
      process.exit(1);
    } else {
      console.error('Server startup error:', err);
      process.exit(1);
    }
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
});
