-- ============================================================
-- BARKAT Smart Restaurant — users table migration
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Add phone_number column (optional contact number for staff/customer)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS phone_number VARCHAR;

-- 2. Add password_hash column (used only in local dev mode, NULL in production)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_hash VARCHAR;

COMMENT ON COLUMN users.password_hash IS
  'Used in local dev mode only when Supabase Auth is not configured. NULL in production.';

-- 3. Add updated_at timestamp (auto-updated on row change via trigger)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- 4. Add last_login_at timestamp (set by backend on each successful login)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- 5. Add created_at if it doesn't exist (should already exist but just in case)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 6. Create a trigger to auto-update updated_at on every UPDATE
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- 7. Verify the final schema
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
