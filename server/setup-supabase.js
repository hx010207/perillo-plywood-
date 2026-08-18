/**
 * Supabase Setup Script
 * Creates all tables and seeds demo data for Perillo Loyalty App
 * Run once: node setup-supabase.js
 */
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run(sql, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result;
  } finally {
    client.release();
  }
}

async function setup() {
  console.log('🔌 Connecting to Supabase...');

  try {
    await run('SELECT NOW()');
    console.log('✅ Connected to Supabase successfully!\n');
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  }

  // ── DROP existing tables (clean slate) ──────────────────────────────────
  console.log('🗑️  Dropping existing tables (if any)...');
  await run('DROP TABLE IF EXISTS payouts CASCADE');
  await run('DROP TABLE IF EXISTS invoices CASCADE');
  await run('DROP TABLE IF EXISTS carpenters CASCADE');
  console.log('   Done.\n');

  // ── CREATE carpenters table ──────────────────────────────────────────────
  console.log('📋 Creating table: carpenters...');
  await run(`
    CREATE TABLE carpenters (
      id             TEXT PRIMARY KEY,
      name           TEXT NOT NULL,
      phone          TEXT UNIQUE NOT NULL,
      region         TEXT,
      linked_dealer  TEXT,
      upi_id         TEXT,
      bank_name      TEXT,
      account_number TEXT,
      ifsc_code      TEXT,
      points_balance INTEGER DEFAULT 1500
    )
  `);
  console.log('   ✅ carpenters table created.\n');

  // ── CREATE invoices table ────────────────────────────────────────────────
  console.log('📋 Creating table: invoices...');
  await run(`
    CREATE TABLE invoices (
      id               TEXT PRIMARY KEY,
      carpenter_id     TEXT NOT NULL REFERENCES carpenters(id),
      dealer_name      TEXT NOT NULL,
      dealer_city      TEXT,
      product_type     TEXT NOT NULL,
      quantity         INTEGER NOT NULL,
      invoice_number   TEXT NOT NULL,
      purchase_date    TEXT NOT NULL,
      qr_code          TEXT,
      image_url        TEXT NOT NULL,
      image_urls       TEXT,
      status           TEXT DEFAULT 'Pending',
      rejection_reason TEXT,
      points_earned    INTEGER DEFAULT 0,
      created_at       TEXT NOT NULL
    )
  `);
  console.log('   ✅ invoices table created.\n');

  // ── CREATE payouts table ─────────────────────────────────────────────────
  console.log('📋 Creating table: payouts...');
  await run(`
    CREATE TABLE payouts (
      id               TEXT PRIMARY KEY,
      carpenter_id     TEXT NOT NULL REFERENCES carpenters(id),
      amount           INTEGER NOT NULL,
      points_redeemed  INTEGER NOT NULL,
      payout_type      TEXT NOT NULL,
      status           TEXT DEFAULT 'Completed',
      created_at       TEXT NOT NULL
    )
  `);
  console.log('   ✅ payouts table created.\n');

  // ── SEED demo carpenter: Raju ────────────────────────────────────────────
  console.log('🌱 Seeding demo carpenter: Raju Carpenter...');
  await run(`
    INSERT INTO carpenters (id, name, phone, region, linked_dealer, upi_id, bank_name, account_number, ifsc_code, points_balance)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
  `, [
    'P-987654',
    'Raju Carpenter',
    '9876543210',
    'Mumbai, Maharashtra',
    'Laxmi Plywood',
    'raju@ybl',
    'State Bank of India',
    '30982348572',
    'SBIN0001234',
    1500
  ]);
  console.log('   ✅ Raju Carpenter seeded.\n');

  // ── SEED demo invoices ───────────────────────────────────────────────────
  console.log('🌱 Seeding demo invoices...');
  const nowStr = new Date().toISOString();

  const invoices = [
    ['INV-12345', 'P-987654', 'Laxmi Plywood',   'Mumbai',      'Marine Plywood',      15, 'LP-99238', '12-06-2026', '',           '/uploads/placeholder_invoice.jpg', '["/uploads/placeholder_invoice.jpg"]', 'Pending',  null,                                              0,    nowStr],
    ['INV-12344', 'P-987654', 'Shree Timbers',   'Thane',       'Commercial Plywood',   8, 'ST-88127', '10-06-2026', 'SEC-88127',  '/uploads/placeholder_invoice.jpg', '["/uploads/placeholder_invoice.jpg"]', 'Approved', null,                                              800,  nowStr],
    ['INV-12343', 'P-987654', 'Laxmi Plywood',   'Mumbai',      'Blockboard',           3, 'LP-99110', '08-06-2026', '',           '/uploads/placeholder_invoice.jpg', '["/uploads/placeholder_invoice.jpg"]', 'Rejected', 'Image is blurry and invoice number is unreadable.', 0,    nowStr],
    ['INV-12342', 'P-987654', 'Perillo Direct',  'Navi Mumbai', 'Flush Door',          20, 'PD-77263', '01-06-2026', 'SEC-77263',  '/uploads/placeholder_invoice.jpg', '["/uploads/placeholder_invoice.jpg"]', 'Approved', null,                                              2000, nowStr],
    ['INV-12341', 'P-987654', 'Sharma Plywoods', 'Pune',        'Veneer',              10, 'SP-66512', '28-05-2026', '',           '/uploads/placeholder_invoice.jpg', '["/uploads/placeholder_invoice.jpg"]', 'Approved', null,                                              1000, nowStr],
  ];

  for (const inv of invoices) {
    await run(`
      INSERT INTO invoices (id, carpenter_id, dealer_name, dealer_city, product_type, quantity, invoice_number, purchase_date, qr_code, image_url, image_urls, status, rejection_reason, points_earned, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
    `, inv);
  }
  console.log(`   ✅ ${invoices.length} invoices seeded.\n`);

  // ── SEED demo payouts ────────────────────────────────────────────────────
  console.log('🌱 Seeding demo payouts...');
  const payouts = [
    ['PAY-001', 'P-987654', 500,  500,  'UPI',  'Completed', '2026-06-10T10:00:00.000Z'],
    ['PAY-002', 'P-987654', 1000, 1000, 'Bank', 'Completed', '2026-05-01T10:00:00.000Z'],
  ];

  for (const pay of payouts) {
    await run(`
      INSERT INTO payouts (id, carpenter_id, amount, points_redeemed, payout_type, status, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
    `, pay);
  }
  console.log(`   ✅ ${payouts.length} payouts seeded.\n`);

  // ── VERIFY ───────────────────────────────────────────────────────────────
  console.log('🔍 Verifying data...');
  const cResult = await run('SELECT COUNT(*) as count FROM carpenters');
  const iResult = await run('SELECT COUNT(*) as count FROM invoices');
  const pResult = await run('SELECT COUNT(*) as count FROM payouts');
  console.log(`   carpenters : ${cResult.rows[0].count} row(s)`);
  console.log(`   invoices   : ${iResult.rows[0].count} row(s)`);
  console.log(`   payouts    : ${pResult.rows[0].count} row(s)`);

  console.log('\n🎉 Supabase setup complete! All tables created and seeded.');
  console.log('   Test login: phone = 9876543210');
  console.log('   Points balance: 1500 pts\n');

  await pool.end();
}

setup().catch(err => {
  console.error('❌ Setup failed:', err);
  pool.end();
  process.exit(1);
});
