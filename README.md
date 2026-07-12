# Membership app (Next.js + Supabase + Flutterwave)

Features:
- User sign-up / sign-in (Supabase Auth).
- Referral system: every user gets a referral code / link.
- Membership purchase via Flutterwave.
- 20% referral commission credited to referrer on successful paid payment.
- Free-signup referral reward: referrer gets a credits reward when a referred user activates a Free plan.
- Admin area: manage users, memberships, payments, commissions, post announcements, upgrade/downgrade users.
- Host frontend on Vercel, use Supabase for DB and auth.

Membership plans (seeded):
- Free (0 NGN, unlimited)
- Basic Monthly (8,000 NGN, 30 days)
- Pro Monthly (25,000 NGN, 30 days)
- Lifetime (80,000 NGN, unlimited)

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
- REFERRAL_REWARD_FREE (optional, default: 500) — credits awarded to referrer when referred user activates Free plan

Admin creation (one-time):
- You can set an existing user as admin by running the script `scripts/create-admin-by-email.js` after the user has signed up with the given email.
  Example:
  ADMIN_EMAIL=NaijaRemotehub@gmail.com SUPABASE_URL=<your-supabase-url> SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key> node scripts/create-admin-by-email.js

Local dev:
- npm install
- npm run dev

Security notes:
- Keep SUPABASE_SERVICE_ROLE_KEY and FLUTTERWAVE_SECRET_KEY secret.
- Admin APIs require the authenticated user's access token and the `is_admin` flag on profiles.
