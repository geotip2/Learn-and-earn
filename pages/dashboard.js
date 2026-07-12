import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [commissions, setCommissions] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('username, referral_code')
        .eq('id', user.id)
        .single();
      setProfile(data);

      const { data: coms } = await supabase
        .from('commissions')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });
      setCommissions(coms || []);

      const { data: anns } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
      setAnnouncements(anns || []);
    })();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h2>Dashboard</h2>
      {profile ? (
        <>
          <p>Username: {profile.username}</p>
          <p>Your referral code: {profile.referral_code}</p>
        </>
      ) : (
        <p>Loading profile...</p>
      )}

      <h3>Your commissions</h3>
      <ul>
        {commissions.map(c => (
          <li key={c.id}>
            {c.amount} — {c.paid ? 'Paid' : 'Unpaid'} — {new Date(c.created_at).toLocaleString()}
          </li>
        ))}
      </ul>

      <h3>Announcements</h3>
      <ul>
        {announcements.map(a => (
          <li key={a.id}><strong>{a.title}</strong> — {a.content}</li>
        ))}
      </ul>
    </div>
  );
}
