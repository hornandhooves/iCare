# iCare

Multi-tenant practice-management app for small health, wellness and beauty
businesses in Mexico — clinics, barbershops, nail studios, spas, nutritionists.
It manages the day (agenda, till, invoicing), the client record
(cross-vertical, patient-controlled), and WhatsApp as a first-class channel.

Web-only, responsive Next.js app (App Router) + Supabase (Postgres + Auth).

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project's URL + keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database

Schema lives in `supabase/migrations/`, demo/seed data in `supabase/seed.sql`.
Apply them against your Supabase project with the
[Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase link --project-ref <your-project-ref>
supabase db push
psql "$(supabase db show-connection-string)" -f supabase/seed.sql   # or run seed.sql via the SQL editor
```

## Design reference

The product spec and clickable prototype this build implements live under
`UI mockups for project/design_handoff_icare/` (not shipped code — reference
only). See `.claude/plans/` history or ask for the current build plan for
what's implemented vs. deferred.
