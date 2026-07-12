import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { membership_id } = req.body;
    if (!membership_id) return res.status(400).json({ error: 'membership_id is required' });

    const membershipQ = await supabaseAdmin.from('memberships').select('id, price, duration_days').eq('id', membership_id).single();
    if (membershipQ.error || !membershipQ.data) return res.status(404).json({ error: 'membership not found' });
    const membership = membershipQ.data;
    const amount = Number(membership.price ?? 0);

    // generate tx_ref
    const tx_ref = `tx_${uuidv4()}`;

    // attach user if auth provided
    let user_id = null;
    const authHeader = req.headers.authorization || '';
    const token = authHeader.split('Bearer ')[1] || null;
    if (token) {
      const { data } = await supabaseAdmin.auth.getUser(token);
      user_id = data?.user?.id || null;
    }

    const insert = await supabaseAdmin.from('payments').insert({
      tx_ref,
      membership_id,
      amount,
      status: amount === 0 ? 'successful' : 'pending',
      user_id
    }).select().single();

    if (insert.error) {
      console.error(insert.error);
      return res.status(500).json({ error: 'failed to create payment' });
    }

    // If free (amount = 0) immediately activate membership and handle referrals
    if (amount === 0) {
      const payment = insert.data;
      if (user_id) {
        // assign membership
        const days = membership.duration_days || 0;
        const started_at = new Date().toISOString();
        const expires_at = days > 0 ? new Date(Date.now() + days * 24 * 3600 * 1000).toISOString() : null;
        await supabaseAdmin.from('user_memberships').insert({ user_id, membership_id, started_at, expires_at });

        // record referral commission if applicable
        const { data: referral } = await supabaseAdmin.from('referrals').select('referrer_id').eq('referred_id', user_id).limit(1).single();
        if (referral?.referrer_id) {
          const commissionAmount = (Number(amount) * 0.2).toFixed(2);
          await supabaseAdmin.from('commissions').insert({ payment_id: payment.id, referrer_id: referral.referrer_id, amount: commissionAmount, paid: false });
        }
      }

      return res.status(200).json({ tx_ref, amount, currency: 'NGN' });
    }

    return res.status(200).json({ tx_ref, amount, currency: 'NGN', flutterwavePublicKey: process.env.FLUTTERWAVE_PUBLIC_KEY });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server error' });
  }
}
