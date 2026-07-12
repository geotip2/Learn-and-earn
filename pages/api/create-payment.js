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
    // choose a default membership if none passed
    let membershipId = membership_id;
    if (!membershipId) {
      const { data } = await supabaseAdmin.from('memberships').select('id, price').limit(1).single();
      membershipId = data?.id;
    }
    const membership = await supabaseAdmin.from('memberships').select('price').eq('id', membershipId).single();
    const amount = membership.data?.price ?? 1000;

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
      membership_id: membershipId,
      amount,
      status: 'pending',
      user_id
    }).select().single();

    if (insert.error) {
      console.error(insert.error);
      return res.status(500).json({ error: 'failed to create payment' });
    }

    return res.status(200).json({
      tx_ref,
      amount,
      currency: 'NGN',
      flutterwavePublicKey: process.env.FLUTTERWAVE_PUBLIC_KEY
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server error' });
  }
}
