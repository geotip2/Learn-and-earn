import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function AdminPage() {
  const [data, setData] = useState({ users: [], payments: [], commissions: [] });
  const [isAdmin, setIsAdmin] = useState(false);
  const [token, setToken] = useState(null);
  const [announcement, setAnnouncement] = useState({ title: '', content: '' });

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      setToken(token);
      // quick check if admin
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
      setIsAdmin(profile?.is_admin);
      if (profile?.is_admin) await loadData(token);
    })();
  }, []);

  async function loadData(token) {
    const res = await fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const json = await res.json();
      setData(json);
    }
  }

  async function doAction(action, payload) {
    const res = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ action, ...payload }) });
    if (res.ok) loadData(token);
  }

  async function postAnnouncement() {
    const res = await fetch('/api/admin/announcements', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(announcement) });
    if (res.ok) {
      alert('Posted');
      setAnnouncement({ title: '', content: '' });
    }
  }

  if (!isAdmin) return <div style={{ padding: 24 }}>Access denied or not admin</div>;

  return (
    <div style={{ padding: 24 }}>
      <h2>Admin dashboard</h2>

      <section>
        <h3>Users</h3>
        <table>
          <thead>
            <tr><th>id</th><th>username</th><th>is_admin</th><th>actions</th></tr>
          </thead>
          <tbody>
            {data.users.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.username}</td>
                <td>{String(u.is_admin)}</td>
                <td>
                  <button onClick={() => doAction('set_admin', { user_id: u.id, is_admin: !u.is_admin })}>{u.is_admin ? 'Revoke admin' : 'Make admin'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h3>Payments</h3>
        <ul>
          {data.payments.map(p => <li key={p.id}>{p.tx_ref} — {p.amount} — {p.status}</li>)}
        </ul>
      </section>

      <section>
        <h3>Commissions</h3>
        <ul>
          {data.commissions.map(c => (
            <li key={c.id}>{c.id} — {c.amount} — {c.paid ? 'Paid' : 'Unpaid'} <button onClick={() => doAction('mark_commission_paid', { commission_id: c.id })}>Mark Paid</button></li>
          ))}
        </ul>
      </section>

      <section>
        <h3>Post announcement</h3>
        <input placeholder="title" value={announcement.title} onChange={e => setAnnouncement({ ...announcement, title: e.target.value })} />
        <br />
        <textarea placeholder="content" value={announcement.content} onChange={e => setAnnouncement({ ...announcement, content: e.target.value })} />
        <br />
        <button onClick={postAnnouncement}>Post</button>
      </section>
    </div>
  );
}
