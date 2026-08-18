/**
 * Supabase Setup via Management API with Personal Access Token
 */
const https = require('https');

const PERSONAL_ACCESS_TOKEN = 'NQb5CIfO1lvBsZLP9sYXcxOK0QfjZD4eT10+TtmzwmD8YzX3TzvsnMon+MhJkSMigqlG79wCtLG4U1jMhKli/g==';
const PROJECT_REF = 'xrtlonbthlrbbscwyudl';

function httpsRequest(method, host, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: host,
      port: 443,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    };

    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runSQL(sql) {
  return httpsRequest(
    'POST',
    'api.supabase.com',
    `/v1/projects/${PROJECT_REF}/database/query`,
    { query: sql },
    PERSONAL_ACCESS_TOKEN
  );
}

async function setup() {
  console.log('🔌 Connecting via Supabase Management API (Personal Access Token)...\n');

  // Test connection
  const test = await runSQL('SELECT NOW() as time');
  if (test.status !== 200) {
    console.error('❌ Failed:', JSON.stringify(test.body));
    process.exit(1);
  }
  console.log('✅ Connected! Server time:', test.body?.[0]?.time || JSON.stringify(test.body), '\n');

  const NOW = new Date().toISOString();

  const steps = [
    {
      label: '🗑️  Drop old tables',
      sql: `DROP TABLE IF EXISTS payouts CASCADE; DROP TABLE IF EXISTS invoices CASCADE; DROP TABLE IF EXISTS carpenters CASCADE;`
    },
    {
      label: '📋 Create carpenters',
      sql: `CREATE TABLE carpenters (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  region TEXT,
  linked_dealer TEXT,
  upi_id TEXT,
  bank_name TEXT,
  account_number TEXT,
  ifsc_code TEXT,
  points_balance INTEGER DEFAULT 1500
);`
    },
    {
      label: '📋 Create invoices',
      sql: `CREATE TABLE invoices (
  id TEXT PRIMARY KEY,
  carpenter_id TEXT NOT NULL REFERENCES carpenters(id),
  dealer_name TEXT NOT NULL,
  dealer_city TEXT,
  product_type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  invoice_number TEXT NOT NULL,
  purchase_date TEXT NOT NULL,
  qr_code TEXT,
  image_url TEXT NOT NULL,
  image_urls TEXT,
  status TEXT DEFAULT 'Pending',
  rejection_reason TEXT,
  points_earned INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);`
    },
    {
      label: '📋 Create payouts',
      sql: `CREATE TABLE payouts (
  id TEXT PRIMARY KEY,
  carpenter_id TEXT NOT NULL REFERENCES carpenters(id),
  amount INTEGER NOT NULL,
  points_redeemed INTEGER NOT NULL,
  payout_type TEXT NOT NULL,
  status TEXT DEFAULT 'Completed',
  created_at TEXT NOT NULL
);`
    },
    {
      label: '🌱 Seed Raju Carpenter',
      sql: `INSERT INTO carpenters (id, name, phone, region, linked_dealer, upi_id, bank_name, account_number, ifsc_code, points_balance)
VALUES ('P-987654','Raju Carpenter','9876543210','Mumbai, Maharashtra','Laxmi Plywood','raju@ybl','State Bank of India','30982348572','SBIN0001234',1500);`
    },
    {
      label: '🌱 Seed invoices',
      sql: `INSERT INTO invoices (id,carpenter_id,dealer_name,dealer_city,product_type,quantity,invoice_number,purchase_date,qr_code,image_url,image_urls,status,rejection_reason,points_earned,created_at) VALUES
    ('INV-12345','P-987654','Laxmi Plywood','Mumbai','Marine Plywood',15,'LP-99238','12-06-2026','','/uploads/placeholder_invoice.jpg','["/uploads/placeholder_invoice.jpg"]','Pending',NULL,0,'${NOW}'),
    ('INV-12344','P-987654','Shree Timbers','Thane','Commercial Plywood',8,'ST-88127','10-06-2026','SEC-88127','/uploads/placeholder_invoice.jpg','["/uploads/placeholder_invoice.jpg"]','Approved',NULL,800,'${NOW}'),
    ('INV-12343','P-987654','Laxmi Plywood','Mumbai','Blockboard',3,'LP-99110','08-06-2026','','/uploads/placeholder_invoice.jpg','["/uploads/placeholder_invoice.jpg"]','Rejected','Image is blurry and invoice number is unreadable.',0,'${NOW}'),
    ('INV-12342','P-987654','Perillo Direct','Navi Mumbai','Flush Door',20,'PD-77263','01-06-2026','SEC-77263','/uploads/placeholder_invoice.jpg','["/uploads/placeholder_invoice.jpg"]','Approved',NULL,2000,'${NOW}'),
    ('INV-12341','P-987654','Sharma Plywoods','Pune','Veneer',10,'SP-66512','28-05-2026','','/uploads/placeholder_invoice.jpg','["/uploads/placeholder_invoice.jpg"]','Approved',NULL,1000,'${NOW}');`
    },
    {
      label: '🌱 Seed payouts',
      sql: `INSERT INTO payouts (id,carpenter_id,amount,points_redeemed,payout_type,status,created_at) VALUES
('PAY-001','P-987654',500,500,'UPI','Completed','2026-06-10T10:00:00.000Z'),
('PAY-002','P-987654',1000,1000,'Bank','Completed','2026-05-01T10:00:00.000Z');`
    },
    {
      label: '🔍 Verify counts',
      sql: `SELECT 'carpenters' as tbl, COUNT(*)::text as cnt FROM carpenters UNION ALL SELECT 'invoices', COUNT(*)::text FROM invoices UNION ALL SELECT 'payouts', COUNT(*)::text FROM payouts;`
    }
  ];

  for (const step of steps) {
    process.stdout.write(`${step.label}... `);
    const res = await runSQL(step.sql);
    if (res.status === 200) {
      if (step.label.includes('Verify')) {
        console.log('\n');
        (res.body || []).forEach(row => console.log(`   ${row.tbl}: ${row.cnt} row(s)`));
      } else {
        console.log('✅');
      }
    } else {
      console.log('❌ FAILED');
      console.error('   Status:', res.status);
      console.error('   Response:', JSON.stringify(res.body));
      process.exit(1);
    }
  }

  console.log('\n🎉 All done! Supabase is fully set up.');
  console.log('   Login with phone: 9876543210');
  console.log('   Balance: 1500 pts, 5 invoices, 2 payouts seeded\n');
}

setup().catch(err => { console.error('Fatal:', err); process.exit(1); });
