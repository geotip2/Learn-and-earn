# Membership app (Next.js + Supabase + Flutterwave)

Features:
- User sign-up / sign-in (Supabase Auth).
- Referral system: every user gets a referral code / link.
- Membership purchase via Flutterwave.
- 20% referral commission credited to referrer on successful payment.
- Admin area: manage users, memberships, payments, commissions, post announcements, upgrade/downgrade users.
- Host frontend on Vercel, use Supabase for DB and auth.

Quick setup:
1. Create a Supabase project.
2. Run the SQL in `supabase/schema.sql` in your Supabase SQL editor.
3. Create a Flutterwave account and get PUBLIC and SECRET keys.
4. Configure environment variables (see list below) in Vercel.
5. Deploy to Vercel (link your repo).
6. In Flutterwave dashboard, set webhook to `https://<your-vercel-app>/api/flutterwave-webhook`.

Env variables (in Vercel project settings):
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- FLUTTERWAVE_PUBLIC_KEY
- FLUTTERWAVE_SECRET_KEY
- NEXT_PUBLIC_APP_URL (e.g., https://your-app.vercel.app)

Local dev:
- npm install
- npm run dev

Security notes:
- Keep SUPABASE_SERVICE_ROLE_KEY and FLUTTERWAVE_SECRET_KEY secret.
- Admin APIs require the authenticated user's access token and the `is_admin` flag on profiles.
