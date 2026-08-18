const db = require('./database');
const originalQuery = db.query;

// Patch the query method
db.query = async function (sql, params = []) {
  let q = sql.trim();
  params.forEach((val, i) => {
    let formattedVal;
    if (val === null) {
      formattedVal = 'NULL';
    } else if (typeof val === 'number' || typeof val === 'boolean') {
      formattedVal = String(val);
    } else {
      const escaped = String(val).replace(/'/g, "''");
      formattedVal = `'${escaped}'`;
    }
    q = q.replace(new RegExp('\\$' + (i + 1) + '(?![0-9])', 'g'), formattedVal);
  });
  console.log('Running query against Supabase:', q);
  
  // Call originalQuery with empty params since we already replaced them
  return originalQuery.call(this, q, []);
};

async function runTest() {
  await db.setupDb();
  console.log('Running test insert query...');
  try {
    const res = await db.query(
      `INSERT INTO invoices (id, carpenter_id, dealer_name, dealer_city, product_type, quantity, invoice_number, purchase_date, qr_code, image_url, image_urls, status, points_earned, created_at, line_items, store_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      ['INV-TEST-2', 'P-987654', 'Test Store', 'Test City', 'Commercial Plywood', 10, 'TEST-123', '2026-06-15', 'QR', '/uploads/placeholder_invoice.jpg', '[]', 'Pending', 0, '2026-06-15T09:00:00Z', '[]', 'Test Store']
    );
    console.log('Insert Success:', res);
    const selectRes = await db.query('SELECT * FROM invoices WHERE id = $1', ['INV-TEST-2']);
    console.log('Select Result:', selectRes.length, 'records found.');
    await db.query('DELETE FROM invoices WHERE id = $1', ['INV-TEST-2']);
    console.log('Cleanup complete.');
  } catch (err) {
    console.error('Test error:', err);
  }
}

runTest();
