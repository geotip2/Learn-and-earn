import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Checkout() {
  const [loading, setLoading] = useState(false);
  const [memberships, setMemberships] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('memberships').select('*').order('price', { ascending: true });
      setMemberships(data || []);
      if (data && data.length) setSelected(data[0].id);
    })();
  }, []);

  const startPayment = async () => {
    if (!selected) return alert('Select a membership');
    setLoading(true);

    const membership = memberships.find(m => m.id === selected);
    if (!membership) return alert('Membership not found');

    // pass auth token if available
    const session = await supabase.auth.getSession();
    const accessToken = session.data.session?.access_token;

    const resp = await fetch('/api/create-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
      body: JSON.stringify({ membership_id: selected })
    });
    const data = await resp.json();
    setLoading(false);
    if (!resp.ok) {
      alert(data?.error || 'Failed to create payment');
      return;
    }

    // If amount is 0, server handles immediate activation; we're done.
    if (data.amount === 0) {
      alert('Free membership activated');
      window.location.href = '/dashboard';
      return;
    }

    const { tx_ref, amount, currency, flutterwavePublicKey } = data;

    if (!window.FlutterwaveCheckout) {
      const s = document.createElement('script');
      s.src = 'https://checkout.flutterwave.com/v3.js';
      s.onload = () => openCheckout();
      document.body.appendChild(s);
    } else openCheckout();

    function openCheckout() {
      window.FlutterwaveCheckout({
        public_key: flutterwavePublicKey,
        tx_ref,
        amount,
        currency,
        payment_options: 'card,banktransfer',
        customer: {
          email: session.data.session?.user?.email || 'guest@example.com',
        },
        callback: function (payment) {
          alert('Payment processed at provider. Server will verify and update your account shortly.');
          window.location.href = '/dashboard';
        },
        onclose: function () {
          console.log('closed');
        },
      });
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Checkout</h2>
      <div>
        {memberships.map(m => (
          <div key={m.id} style={{ marginBottom: 8 }}>
            <label>
              <input type="radio" name="membership" checked={selected === m.id} onChange={() => setSelected(m.id)} />
              {' '}
              <strong>{m.name}</strong> — {m.price} NGN {m.duration_days === 0 ? '(Unlimited / Lifetime)' : `for ${m.duration_days} days`}
            </label>
          </div>
        ))}
      </div>

      <button onClick={startPayment} disabled={loading}>
        {loading ? 'Processing...' : 'Proceed'}
      </button>
    </div>
  );
}
