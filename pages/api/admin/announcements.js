import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function requireAdmin(req) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.split('Bearer ')[1] || null;
  if (!token) throw new Error('Unauthorized');
  const { data } = await supabaseAdmin.auth.getUser(token);
  const userId = data?.user?.id;
  if (!userId) throw new Error('Unauthorized');
  const { data: profile } = await supabaseAdmin.from('profiles').select('is_admin').eq('id', userId).single();
  if (!profile?.is_admin) throw new Error('Forbidden');
  return userId;
}

export default async function handler(req, res) {
  try {
    // Only allow POST to create announcement, GET to list
    if (req.method === 'GET') {
      const { data } = await supabaseAdmin.from('announcements').select('*').order('created_at', { ascending: false });
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      // require admin
      const userId = await requireAdmin(req);
      const { title, content } = req.body;
      if (!title || !content) return res.status(400).json({ error: 'title and content required' });
      const { data } = await supabaseAdmin.from('announcements').insert({ title, content, author_id: userId }).select().single();
      return res.status(201).json(data);
    }

    return res.status(405).end();
  } catch (err) {
    console.error(err);
    if (err.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' });
    if (err.message === 'Forbidden') return res.status(403).json({ error: 'Forbidden' });
    return res.status(500).json({ error: 'server error' });
  }
}
