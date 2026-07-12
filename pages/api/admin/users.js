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
    const userId = await requireAdmin(req);

    if (req.method === 'GET') {
      // list users, memberships, payments, commissions
      const users = await supabaseAdmin.from('profiles').select('id, username, referral_code, is_admin, created_at');
      const payments = await supabaseAdmin.from('payments').select('*').order('created_at', { ascending: false });
      const commissions = await supabaseAdmin.from('commissions').select('*').order('created_at', { ascending: false });
      return res.status(200).json({ users: users.data, payments: payments.data, commissions: commissions.data });
    }

    if (req.method === 'POST') {
      // actions: upgrade/downgrade user: expects { action: 'upgrade'|'downgrade', user_id, membership_id }
      const { action, user_id, membership_id } = req.body;
      if (!action || !user_id) return res.status(400).json({ error: 'missing params' });
      if (action === 'upgrade' || action === 'downgrade') {
        // set user's membership to membership_id (or remove)
        if (!membership_id) return res.status(400).json({ error: 'membership_id required' });
        // create or update user_memberships
        // for simplicity insert a new record starting now
        const membership = await supabaseAdmin.from('memberships').select('duration_days').eq('id', membership_id).single();
        const days = membership.data?.duration_days || 30;
        const started_at = new Date().toISOString();
        const expires_at = new Date(Date.now() + days * 24 * 3600 * 1000).toISOString();
        await supabaseAdmin.from('user_memberships').insert({ user_id, membership_id, started_at, expires_at });
        return res.status(200).json({ ok: true });
      }

      if (action === 'set_admin') {
        const { is_admin } = req.body;
        await supabaseAdmin.from('profiles').upsert({ id: user_id, is_admin });
        return res.status(200).json({ ok: true });
      }

      if (action === 'mark_commission_paid') {
        const { commission_id } = req.body;
        if (!commission_id) return res.status(400).json({ error: 'commission_id required' });
        await supabaseAdmin.from('commissions').update({ paid: true }).eq('id', commission_id);
        return res.status(200).json({ ok: true });
      }

      return res.status(400).json({ error: 'unknown action' });
    }

    return res.status(405).end();
  } catch (err) {
    console.error(err);
    if (err.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' });
    if (err.message === 'Forbidden') return res.status(403).json({ error: 'Forbidden' });
    return res.status(500).json({ error: 'server error' });
  }
}
