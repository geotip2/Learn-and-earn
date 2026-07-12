import { createClient } from '@supabase/supabase-js';

// This script inserts default memberships into Supabase. Run once with:
// SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-memberships.js

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  const plans = [
    { name: 'Free', price: 0, duration_days: 0 }, // duration_days = 0 means unlimited
    { name: 'Basic Monthly', price: 8000, duration_days: 30 },
    { name: 'Pro Monthly', price: 25000, duration_days: 30 },
    { name: 'Lifetime', price: 80000, duration_days: 0 } // 0 -> unlimited
  ];

  for (const p of plans) {
    // upsert by name
    const { data, error } = await supabase
      .from('memberships')
      .upsert(p, { onConflict: ['name'] })
      .select();
    if (error) console.error('Failed to insert', p.name, error.message);
    else console.log('Upserted', p.name);
  }

  console.log('Done seeding memberships');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
