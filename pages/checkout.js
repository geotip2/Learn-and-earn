import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Checkout() {
  const [loading, setLoading] = useState(false);

  const startPayment = async () => {
    setLoading(true);
    // Create payment server-side (returns tx_ref & public key)
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    const accessToken = session?.access_token;

    const resp = await fetch('/api/create-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
      body: JSON.stringify({ membership_id: null })
    });
    const data = await resp.json();
    setLoading(false);
    if (!resp.ok) {
      alert(data?.error || 'Failed to create payment');
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
          email: session?.user?.email || 'guest@example.com',
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
      <p>Membership price: 1000 (example)</p>
      <button onClick={startPayment} disabled={loading}>
        {loading ? 'Starting...' : 'Pay with Flutterwave'}
      </button>
    </div>
  );
}
