# Roua Clinic

Express + MongoDB backend with a vanilla HTML/CSS/JS front end.

## Setup
1. Install Node 18+ and MongoDB (local or Atlas).
2. `npm install`
3. `cp .env.example .env`, then set `MONGODB_URI` and a long random `JWT_SECRET`.
4. `npm run create-admin -- you@example.com "a-long-passphrase"` (12+ characters).
5. `npm start`, then open `http://localhost:3000` and `http://localhost:3000/admin`.

## Notes
- Appointments are created as `pending`; the clinic confirms them in /admin. A unique `slotKey` index prevents double booking and is released on cancel/complete.
- Working hours, closed days, services and contact details are edited in /admin. Dates and times use the server's timezone: set `TZ` on the host.
- Add real photography to `public/assets/images` and replace the placeholder panels. Add testimonials and before/after photos only with written consent.

## Deployment
Run behind HTTPS (Render, Railway, Fly.io or a VPS with nginx/Caddy). Set `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET` and `TZ` as environment variables. Secure cookies need HTTPS; `trust proxy` is already enabled.
