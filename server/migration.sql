-- Perillo Loyalty App — Database Migration
-- Run this in Supabase SQL Editor (with RLS disabled or as service role)

-- Add new columns to carpenters table
ALTER TABLE carpenters ADD COLUMN IF NOT EXISTS aadhaar_number TEXT;
ALTER TABLE carpenters ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;
ALTER TABLE carpenters ADD COLUMN IF NOT EXISTS total_sheets INTEGER DEFAULT 0;
ALTER TABLE carpenters ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'Member';
ALTER TABLE carpenters ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending_approval';
ALTER TABLE carpenters ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE carpenters ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE carpenters ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE carpenters ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en';

-- Add multi-item support columns to invoices table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS line_items TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS store_name TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS dealer_city TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS image_urls TEXT;

-- Update existing carpenters to have default values if NULL
UPDATE carpenters SET verified = false WHERE verified IS NULL;
UPDATE carpenters SET total_sheets = 0 WHERE total_sheets IS NULL;
UPDATE carpenters SET tier = 'Member' WHERE tier IS NULL;
UPDATE carpenters SET status = 'approved' WHERE status IS NULL OR verified = true;
UPDATE carpenters SET preferred_language = 'en' WHERE preferred_language IS NULL;
