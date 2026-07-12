#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

// Usage:
// ADMIN_EMAIL=NaijaRemotehub@gmail.com SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/create-admin-by-email.js

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.ADMIN_EMAIL;

if (!supabaseUrl || !supabaseKey || !adminEmail) {
  console.error('Please set ADMIN_EMAIL, SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Looking up user by email:', adminEmail);
  // Use admin endpoint to find user by email
  // Note: this uses the Supabase Admin auth API which is available with service_role key
  const resp = await supabase.auth.admin.getUserByEmail(adminEmail);
  const user = resp?.data?.user;
  if (!user) {
    console.error('User not found. Make sure the user has signed up with that email first.');
    process.exit(1);
  }

  const userId = user.id;
  console.log('Found user id:', userId);

  // upsert profile with is_admin = true
  const { error } = await supabase.from('profiles').upsert({ id: userId, is_admin: true }).select();
  if (error) {
    console.error('Failed to upsert profile:', error.message);
    process.exit(1);
  }

  console.log('User set as admin successfully.');
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
