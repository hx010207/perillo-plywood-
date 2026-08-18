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

  console.log('Running SQL migrations in Supabase...');
  const res = await runSQL(sql);
  if (res.status === 200) {
    console.log('✅ Migration succeeded:', JSON.stringify(res.body));
  } else {
    console.error('❌ Migration failed:', res.status, JSON.stringify(res.body));
    process.exit(1);
  }
}

run().catch(console.error);
