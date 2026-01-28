-- PUBLIC ACCESS TABLES
-- 1. Members Table
create table if not exists public.members (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  full_name text,
  email text unique,
  password text, -- Note: In a real app, use Supabase Auth instead of storing passwords here
  phone text,
  plan text default 'Monthly Plan',
  status text default 'Pending',
  due_amount numeric default 0
);

-- 2. Activity Logs Table
create table if not exists public.activity_logs (
  id uuid default gen_random_uuid() primary key,
  member_id uuid references public.members(id) on delete cascade,
  check_in_time timestamptz default now(),
  check_out_time timestamptz,
  duration_minutes integer,
  created_at timestamptz default now()
);

-- 3. Payments Table
create table if not exists public.payments (
  id uuid default gen_random_uuid() primary key,
  member_id uuid references public.members(id) on delete cascade,
  amount numeric not null,
  payment_date timestamptz default now(),
  payment_method text default 'Cash', -- Cash, Card, UPI, etc.
  created_at timestamptz default now()
);

-- ENABLE REALTIME
alter publication supabase_realtime add table public.members;
alter publication supabase_realtime add table public.activity_logs;
alter publication supabase_realtime add table public.payments;

-- FIXES & MIGRATIONS
-- Add due_amount column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'due_amount') THEN 
        ALTER TABLE public.members ADD COLUMN due_amount numeric default 0; 
    END IF; 
END $$;

-- Allow any text for plan (removes old constraints if any)
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'members_plan_check') THEN 
        ALTER TABLE public.members DROP CONSTRAINT members_plan_check; 
    END IF; 
END $$;

ALTER TABLE public.members ALTER COLUMN plan TYPE text;
