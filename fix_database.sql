-- Run this explicitly to Ensure the due_amount column exists
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS due_amount numeric default 0;

-- Just in case, grant permissions (if you have strict RLS, usually not needed if using anon key without RLS)
-- GRANT UPDATE (due_amount) ON public.members TO anon;
-- GRANT UPDATE (due_amount) ON public.members TO service_role;
