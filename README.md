# PULSEGRID

PULSEGRID is a simulation-only emergency dispatch decision-support prototype.
It demonstrates capability-first hospital matching, a fictional ambulance route,
role-based hospital controls, and an optional Supabase persistence layer.

## Features

- Emergency User and Hospital Coordinator demo roles
- Twelve simulated emergency conditions with capability-first eligibility checks
- Browser-session location permission, Leaflet route visualization, and ETA timer
- SOS simulation with two fictional support helpers
- Hospital capacity updates, accept/reject confirmation, rerouting, and audit history
- Hindi/English controls, command search, loader, offline notice, and 404 page
- Optional Supabase Auth, fictional data persistence, RLS, and Realtime subscriptions

## Demo flow

1. Choose **Emergency User** and select a simulated condition.
2. Request simulated assistance to see capability-first hospital matching.
3. Switch to **Hospital Coordinator**.
4. Set Metro Care Centre ICU beds to `0` and save the status.
5. Return to Emergency User and confirm the proposed reroute.

PULSEGRID uses fictional hospital data and simulated ambulance movement. It does not place emergency calls or use real patient, ambulance, or hospital-availability data.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Optional Supabase backend

The app works in local demo mode without a backend. To enable sign-up, sign-in,
persisted fictional audit events, and real-time fictional hospital-status updates:

1. Create a Supabase project.
2. In the Supabase SQL Editor, run [`supabase/schema.sql`](./supabase/schema.sql).
3. Copy `.env.example` to `.env.local` and add the project URL and anon key:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

4. Create a user account in the app. To allow a Hospital Coordinator to update
   Metro Care Centre, add their authenticated user id to `hospital_members` in
   the Supabase Table Editor.

The Supabase schema intentionally stores only fictional demo information. Do
not store patient information, real locations, actual hospital availability, or
real blood/plasma inventory in this hackathon prototype.

## Deploy on Vercel

1. Import the GitHub repository in Vercel.
2. Vercel detects Vite automatically. Use build command `npm run build` and
   output directory `dist`.
3. If using Supabase, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to
   Vercel Project Settings → Environment Variables, then redeploy.

`vercel.json` includes the Vite build settings and SPA rewrite needed for the
custom 404 experience.
