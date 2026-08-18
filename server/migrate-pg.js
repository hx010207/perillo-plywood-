require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  const sql = `
    -- Add new columns to carpenters
    ALTER TABLE carpenters ADD COLUMN IF NOT EXISTS email TEXT;
    ALTER TABLE carpenters ADD COLUMN IF NOT EXISTS city TEXT;
    ALTER TABLE carpenters ADD COLUMN IF NOT EXISTS state TEXT;
    ALTER TABLE carpenters ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en';
    ALTER TABLE carpenters ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending_approval';
    
    -- Ensure existing users have approved status
    UPDATE carpenters SET status = 'approved' WHERE status IS NULL OR verified = true OR phone = '9876543210';
  `;

  console.log('Connecting to PostgreSQL database...');
  await client.connect();
  console.log('Connected! Running migrations...');
  await client.query(sql);
  console.log('✅ Migrations completed successfully.');
  await client.end();
}

run().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
