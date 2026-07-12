-- Users are handled by Supabase Auth; this schema adds application tables.

-- Profiles with admin flag and referral code
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique,
  referral_code text unique,
  is_admin boolean default false,
  created_at timestamptz default now()
);

-- Membership plans
create table if not exists memberships (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  price numeric not null,
  duration_days int not null,
  created_at timestamptz default now()
);

-- Track which membership a user currently has (or had)
create table if not exists user_memberships (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  membership_id uuid references memberships,
  started_at timestamptz default now(),
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- Payments
create table if not exists payments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete set null,
  membership_id uuid references memberships,
  tx_ref text unique,
  flutterwave_id text,
  amount numeric,
  currency text default 'NGN',
  status text default 'pending',
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Commissions
create table if not exists commissions (
  id uuid default gen_random_uuid() primary key,
  payment_id uuid references payments on delete cascade,
  referrer_id uuid references auth.users,
  amount numeric not null,
  paid boolean default false,
  created_at timestamptz default now()
);

-- Referrals
create table if not exists referrals (
  id uuid default gen_random_uuid() primary key,
  referrer_id uuid references auth.users,
  referred_id uuid references auth.users,
  created_at timestamptz default now()
);

-- Announcements (admin can post)
create table if not exists announcements (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  author_id uuid references auth.users,
  created_at timestamptz default now()
);
