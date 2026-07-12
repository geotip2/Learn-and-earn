import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const payload = req.body;
    const tx_ref = payload?.data?.tx_ref || payload?.tx_ref || payload?.txRef || (payload?.query?.tx_ref);
    if (!tx_ref) {
      console.error('tx_ref not found in webhook', payload);
      return res.status(400).send('tx_ref missing');
    }

    const verifyResp = await fetch('https://api.flutterwave.com/v3/transactions/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`
      },
      body: JSON.stringify({ tx_ref })
    });
    const verifyJson = await verifyResp.json();

    if (verifyJson?.status !== 'success' || !verifyJson?.data) {
      console.error('flutterwave verification failed', verifyJson);
      return res.status(400).send('verification failed');
    }

    const tx = verifyJson.data;
    const amount = tx.amount;
    const flw_id = tx.id;
    const status = tx.status;

    if (status !== 'successful') {
      await supabaseAdmin.from('payments').update({ status: 'failed', flutterwave_id: flw_id }).eq('tx_ref', tx_ref);
      return res.status(200).send('ok');
    }

    const { data: payment } = await supabaseAdmin.from('payments').select('*').eq('tx_ref', tx_ref).single();

    if (!payment) {
      console.error('payment record not found for', tx_ref);
      return res.status(404).send('payment not found');
    }

    if (payment.status === 'successful') {
      return res.status(200).send('already processed');
    }

    await supabaseAdmin.from('payments').update({
      status: 'successful',
      flutterwave_id: flw_id,
      updated_at: new Date().toISOString()
    }).eq('id', payment.id);

    // Credit membership to user
    if (payment.user_id) {
      // set membership expiry
      const membership = await supabaseAdmin.from('memberships').select('duration_days').eq('id', payment.membership_id).single();
      const days = membership.data?.duration_days || 30;
      const started_at = new Date().toISOString();
      const expires_at = new Date(Date.now() + days * 24 * 3600 * 1000).toISOString();
      await supabaseAdmin.from('user_memberships').insert({ user_id: payment.user_id, membership_id: payment.membership_id, started_at, expires_at });

      // check referrals
      const { data: referral } = await supabaseAdmin.from('referrals').select('referrer_id').eq('referred_id', payment.user_id).limit(1).single();
      if (referral?.referrer_id) {
        const commissionAmount = (Number(amount) * 0.2).toFixed(2);
        await supabaseAdmin.from('commissions').insert({ payment_id: payment.id, referrer_id: referral.referrer_id, amount: commissionAmount, paid: false });
      }
    } else {
      // optional: find by email in tx.customer.email in tx meta
    }

    return res.status(200).send('ok');
  } catch (err) {
    console.error(err);
    return res.status(500).send('server error');
  }
}
