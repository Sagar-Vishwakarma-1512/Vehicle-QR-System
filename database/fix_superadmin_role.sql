-- ============================================================
-- FIX: Set codewithpanda28@gmail.com role to 'superadmin'
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Step 1: Check current role
SELECT id, email, role, full_name 
FROM users 
WHERE email ILIKE 'codewithpanda28@gmail.com';

-- Step 2: Update the role to superadmin (exact lowercase, no spaces)
UPDATE users
SET role = 'superadmin'
WHERE email ILIKE 'codewithpanda28@gmail.com';

-- Step 3: Verify the update worked
SELECT id, email, role, full_name 
FROM users 
WHERE email ILIKE 'codewithpanda28@gmail.com';
