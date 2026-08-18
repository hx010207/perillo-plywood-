/**
 * database.js - Dual Supabase REST API & SQLite Fallback Adapter
 */
require('dotenv').config();
const https = require('https');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xrtlonbthlrbbscwyudl.supabase.co';
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY;
const ANON_KEY     = process.env.SUPABASE_ANON_KEY;
const API_KEY      = SERVICE_KEY || ANON_KEY;

const dbPath = path.join(__dirname, 'perillo_loyalty.db');
const sqliteDb = new sqlite3.Database(dbPath);

let useSqlite = false;

function querySqlite(sql, params = []) {
  return new Promise((resolve, reject) => {
    let q = sql.trim();
    params.forEach((val, i) => {
      let formattedVal;
      if (val === null || val === undefined) {
        formattedVal = 'NULL';
      } else if (typeof val === 'number' || typeof val === 'boolean') {
        formattedVal = String(val);
      } else {
        const escaped = String(val).replace(/'/g, "''");
        formattedVal = `'${escaped}'`;
      }
      q = q.replace(new RegExp('\\$' + (i + 1) + '(?![0-9])', 'g'), formattedVal);
    });

    console.log('[DB-SQLite] Executing:', q);
    const upper = q.toUpperCase();

    if (upper.startsWith('SELECT')) {
      sqliteDb.all(q, [], (err, rows) => {
        if (err) {
          console.error('[DB-SQLite Error]', err);
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    } else {
      sqliteDb.run(q, [], function(err) {
        if (err) {
          console.error('[DB-SQLite Error]', err);
          reject(err);
        } else {
          resolve([{ id: this.lastID, changes: this.changes }]);
        }
      });
    }
  });
}

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(SUPABASE_URL);
    const data   = body ? JSON.stringify(body) : null;
    const opts   = {
      hostname: urlObj.hostname,
      port: 443,
      path,
      method,
      headers: {
        'apikey':        API_KEY,
        'Authorization': 'Bearer ' + API_KEY,
        'Content-Type':  'application/json',
        'Prefer':        'return=representation',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    };
    const req = https.request(opts, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(raw || '[]') }); }
        catch { resolve({ status: res.statusCode, data: raw }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function buildFilter(where) {
  if (!where) return '';
  where = where.trim();
  if (/\s+AND\s+/i.test(where)) {
    return where.split(/\s+AND\s+/i).map(p => singleFilter(p.trim())).filter(Boolean).join('&');
  }
  return singleFilter(where);
}

function singleFilter(clause) {
  if (!clause) return '';
  const m = clause.match(/(\w+)\s*=\s*'?([^']+?)'?\s*$/);
  if (m) return m[1] + '=eq.' + encodeURIComponent(m[2]);
  return '';
}

async function handleSelect(sql) {
  const upper = sql.toUpperCase();

  if (upper.includes('JOIN')) {
    const invRes  = await request('GET', '/rest/v1/invoices?select=*&order=created_at.desc');
    const invoices = Array.isArray(invRes.data) ? invRes.data : [];
    const carpRes  = await request('GET', '/rest/v1/carpenters?select=id,name,phone');
    const carps    = Array.isArray(carpRes.data) ? carpRes.data : [];
    const map = {};
    carps.forEach(c => { map[c.id] = c; });
    return invoices.map(inv => ({
      ...inv,
      carpenter_name:  map[inv.carpenter_id]?.name  || '',
      carpenter_phone: map[inv.carpenter_id]?.phone || ''
    }));
  }

  const m = sql.match(/SELECT\s+(.+?)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+?))?(?:\s+ORDER\s+BY\s+(.+?))?(?:\s+LIMIT\s+(\d+))?$/i);
  if (m) {
    const [, cols, table, where, orderBy, limit] = m;
    const isCount = cols.toUpperCase().includes('COUNT(');
    let path = '/rest/v1/' + table + '?select=' + (isCount ? 'id' : encodeURIComponent(cols.trim() === '*' ? '*' : cols.trim()));
    const f = buildFilter(where);
    if (f) path += '&' + f;
    if (orderBy && !isCount) {
      const om = orderBy.match(/(\w+)\s*(DESC|ASC)?/i);
      if (om) path += '&order=' + om[1] + '.' + (om[2] || 'asc').toLowerCase();
    }
    if (limit && !isCount) path += '&limit=' + limit;
    const res = await request('GET', path);
    if (isCount) {
      const count = Array.isArray(res.data) ? res.data.length : 0;
      return [{ count, COUNT: count }];
    }
    return Array.isArray(res.data) ? res.data : [];
  }
  return [];
}

function parseValueRows(str) {
  const rows = []; let depth = 0, cur = '', inStr = false, sc = '';
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (!inStr && (ch === "'" || ch === '"')) { inStr = true; sc = ch; cur += ch; continue; }
    if (inStr && ch === sc) { inStr = false; cur += ch; continue; }
    if (!inStr && ch === '(') { depth++; if (depth === 1) { cur = ''; continue; } }
    if (!inStr && ch === ')') { depth--; if (depth === 0) { rows.push(parseRow(cur)); cur = ''; continue; } }
    cur += ch;
  }
  return rows;
}

function parseRow(str) {
  const vals = []; let cur = '', inStr = false, sc = '';
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (!inStr && (ch === "'" || ch === '"')) { inStr = true; sc = ch; continue; }
    if (inStr && ch === sc) { inStr = false; continue; }
    if (!inStr && ch === ',') { vals.push(cur.trim()); cur = ''; continue; }
    cur += ch;
  }
  vals.push(cur.trim());
  return vals;
}

async function handleInsert(sql) {
  const tbl  = sql.match(/INSERT\s+INTO\s+(\w+)\s*\(/i);
  const colsM = sql.match(/\(([^)]+)\)\s+VALUES/i);
  if (!tbl || !colsM) return [];
  const table = tbl[1];
  const cols  = colsM[1].split(',').map(c => c.trim());
  const valSec = sql.replace(/^.*VALUES\s*/is, '').trim();
  const rows   = parseValueRows(valSec);
  const results = [];
  for (const row of rows) {
    const obj = {};
    cols.forEach((col, i) => {
      let val = row[i];
      if (val === undefined || val === 'NULL' || val === null || val === '') obj[col] = null;
      else if (!isNaN(val) && typeof val === 'number') obj[col] = Number(val);
      else obj[col] = val;
    });
    const res = await request('POST', '/rest/v1/' + table, obj);
    results.push(res.data);
  }
  return results;
}

async function handleUpdate(sql) {
  const tblM   = sql.match(/UPDATE\s+(\w+)\s+SET\s+/i);
  const setM   = sql.match(/SET\s+(.+?)\s+WHERE\s+/i);
  const whereM = sql.match(/WHERE\s+(.+)$/i);
  if (!tblM || !setM || !whereM) return [];
  const table  = tblM[1];
  const filter = buildFilter(whereM[1].trim());
  const body   = {};
  let increment = null;
  for (const pair of setM[1].split(',').map(p => p.trim())) {
    const pm = pair.match(/(\w+)\s*=\s*(.+)/);
    if (!pm) continue;
    let [, col, val] = pm;
    val = val.trim();
    const incM = val.match(/(\w+)\s*\+\s*(\d+)/);
    if (incM) { increment = { col, addVal: Number(incM[2]) }; continue; }
    val = val.replace(/^'|'$/g, '');
    if (val === 'NULL' || val === 'null') body[col] = null;
    else if (!isNaN(val) && val !== '') body[col] = Number(val);
    else body[col] = val;
  }
  if (increment) {
    const cur = await request('GET', '/rest/v1/' + table + '?' + filter + '&select=' + increment.col + '&limit=1');
    const curVal = Array.isArray(cur.data) && cur.data[0] ? (cur.data[0][increment.col] || 0) : 0;
    body[increment.col] = curVal + increment.addVal;
  }
  const res = await request('PATCH', '/rest/v1/' + table + '?' + filter, body);
  return Array.isArray(res.data) ? res.data : [res.data];
}

async function query(sql, params = []) {
  if (useSqlite) {
    return querySqlite(sql, params);
  }
  try {
    let q = sql.trim();
    params.forEach((val, i) => {
      let formattedVal;
      if (val === null || val === undefined) {
        formattedVal = 'NULL';
      } else if (typeof val === 'number' || typeof val === 'boolean') {
        formattedVal = String(val);
      } else {
        const escaped = String(val).replace(/'/g, "''");
        formattedVal = `'${escaped}'`;
      }
      q = q.replace(new RegExp('\\$' + (i + 1) + '(?![0-9])', 'g'), formattedVal);
    });
    const upper = q.toUpperCase();
    if (upper.startsWith('SELECT')) return await handleSelect(q);
    if (upper.startsWith('INSERT')) return await handleInsert(q);
    if (upper.startsWith('UPDATE')) return await handleUpdate(q);
    return [];
  } catch (err) {
    console.warn('[DB] Supabase query failed, falling back to SQLite:', err.message || err);
    useSqlite = true;
    return querySqlite(sql, params);
  }
}

const safeAddColumn = (table, colDef) => {
  return new Promise((resolve) => {
    sqliteDb.run(`ALTER TABLE ${table} ADD COLUMN ${colDef}`, (err) => {
      resolve();
    });
  });
};

async function setupDb() {
  try {
    console.log('Verifying Supabase connection...');
    const res = await request('GET', '/rest/v1/carpenters?select=id&limit=1');
    if (res.status === 200) {
      console.log('Connected to Supabase successfully.');
      return;
    }
    throw new Error('Supabase returned status ' + res.status);
  } catch (err) {
    console.warn('⚠️ Supabase unavailable. Falling back to local SQLite database (perillo_loyalty.db).');
    useSqlite = true;
    await new Promise((resolve) => {
      sqliteDb.serialize(() => {
        sqliteDb.run(`CREATE TABLE IF NOT EXISTS carpenters (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          phone TEXT UNIQUE NOT NULL,
          region TEXT,
          linked_dealer TEXT,
          upi_id TEXT,
          bank_name TEXT,
          account_number TEXT,
          ifsc_code TEXT,
          points_balance INTEGER DEFAULT 1500,
          status TEXT DEFAULT 'approved',
          email TEXT,
          city TEXT,
          state TEXT,
          aadhaar_number TEXT,
          pan_card TEXT,
          preferred_language TEXT,
          verified TEXT DEFAULT 'false',
          total_sheets INTEGER DEFAULT 0,
          tier TEXT DEFAULT 'Member'
        )`);
        sqliteDb.run(`CREATE TABLE IF NOT EXISTS invoices (
          id TEXT PRIMARY KEY,
          carpenter_id TEXT,
          dealer_name TEXT,
          dealer_city TEXT,
          product_type TEXT,
          quantity INTEGER,
          invoice_number TEXT,
          purchase_date TEXT,
          qr_code TEXT,
          image_url TEXT,
          image_urls TEXT,
          status TEXT DEFAULT 'Pending',
          points_earned INTEGER DEFAULT 0,
          created_at TEXT,
          rejection_reason TEXT,
          line_items TEXT,
          store_name TEXT
        )`);
        sqliteDb.run(`CREATE TABLE IF NOT EXISTS payouts (
          id TEXT PRIMARY KEY,
          carpenter_id TEXT,
          amount INTEGER,
          points_redeemed INTEGER,
          payout_type TEXT,
          status TEXT DEFAULT 'Requested',
          created_at TEXT
        )`, () => resolve(true));
      });
    });

    // Ensure all missing columns exist on carpenters table
    await safeAddColumn('carpenters', 'status TEXT DEFAULT \'approved\'');
    await safeAddColumn('carpenters', 'verified TEXT DEFAULT \'false\'');
    await safeAddColumn('carpenters', 'email TEXT');
    await safeAddColumn('carpenters', 'city TEXT');
    await safeAddColumn('carpenters', 'state TEXT');
    await safeAddColumn('carpenters', 'aadhaar_number TEXT');
    await safeAddColumn('carpenters', 'pan_card TEXT');
    await safeAddColumn('carpenters', 'preferred_language TEXT');
    await safeAddColumn('carpenters', 'total_sheets INTEGER DEFAULT 0');
    await safeAddColumn('carpenters', 'tier TEXT DEFAULT \'Member\'');

    // Ensure all missing columns exist on invoices table
    await safeAddColumn('invoices', 'dealer_city TEXT');
    await safeAddColumn('invoices', 'image_urls TEXT');
    await safeAddColumn('invoices', 'line_items TEXT');
    await safeAddColumn('invoices', 'store_name TEXT');
    await safeAddColumn('invoices', 'rejection_reason TEXT');

    // Ensure all missing columns exist on payouts table
    await safeAddColumn('payouts', 'points_redeemed INTEGER');
    await safeAddColumn('payouts', 'payout_type TEXT');

    console.log('✅ SQLite database schema fully verified.');
  }
}

module.exports = { query, setupDb };
