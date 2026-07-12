import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
  const [user, setUser] = useState(null);
  const [refLink, setRefLink] = useState('');

  useEffect(() => {
    const s = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user || null);
      if (user) {
        // ensure profile exists
        const { data, error } = await supabase
          .from('profiles')
          .select('referral_code')
          .eq('id', user.id)
          .single();
        if (error || !data) {
          // create profile with referral code
          const code = `ref_${uuidv4().slice(0,8)}`;
          await supabase.from('profiles').upsert({ id: user.id, referral_code: code });
          setRefLink(`${process.env.NEXT_PUBLIC_APP_URL}/?ref=${code}`);
        } else {
          setRefLink(`${process.env.NEXT_PUBLIC_APP_URL}/?ref=${data.referral_code}`);
        }
      } else {
        // if there's a ref in URL, store it in localStorage for use after signup
        const params = new URLSearchParams(window.location.search);
        const ref = params.get('ref');
        if (ref) localStorage.setItem('referral_code', ref);
      }
    })();
    return () => s?.subscription?.unsubscribe?.();
  }, []);

  const signUp = async () => {
    const email = prompt('Enter email to sign up');
    if (!email) return;
    const { error } = await supabase.auth.signUp({ email });
    if (error) alert(error.message);
    else alert('Check your email for sign-in link.');
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Membership App</h1>
      {!user ? (
        <button onClick={signUp}>Sign up / Sign in</button>
      ) : (
        <>
          <p>Signed in as {user.email}</p>
          <Link href="/dashboard"><a>Go to dashboard</a></Link>
          <br />
          <Link href="/admin"><a>Go to admin (requires admin)</a></Link>
        </>
      )}

      <h3>Buy membership</h3>
      <Link href="/checkout"><a>Purchase membership</a></Link>

      {refLink && (
        <>
          <h4>Your referral link</h4>
          <code>{refLink}</code>
        </>
      )}
    </div>
  );
}
