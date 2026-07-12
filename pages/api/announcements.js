import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // public announcements listing
  if (req.method !== 'GET') return res.status(405).end();
  const { data } = await supabaseAdmin.from('announcements').select('*').order('created_at', { ascending: false });
  res.status(200).json(data);
}
