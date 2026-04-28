# Deploy

Single-command deploy of Outsauce (web + api + Caddy with auto-HTTPS) on any Linux server with Docker installed. Supabase runs hosted (supabase.com), not in this stack.

## Prerequisites

- A Linux server with a public IPv4
- A domain pointed at that IP (A record)
- Docker + Docker Compose plugin installed (`docker --version`, `docker compose version`)
- A Supabase project (free tier is fine), with all migrations from `supabase/migrations` applied — easiest with `supabase db push` from your laptop

## One-time setup on the server

```bash
git clone https://github.com/<your-org>/outsauce.git
cd outsauce
cp .env.production.example .env
nano .env   # fill in DEPLOY_DOMAIN + Supabase + Anthropic + Stripe
```

Required env vars:

| Var | Where to find |
|-----|---------------|
| `DEPLOY_DOMAIN` | Your domain, e.g. `app.outsauce.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project → Settings → API → anon key |
| `SUPABASE_URL` | Same as `NEXT_PUBLIC_SUPABASE_URL` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project → Settings → API → service_role key |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API keys |

Stripe vars are optional — leave blank to disable billing.

## Deploy

```bash
docker compose up -d --build
```

That's it. Caddy fetches a Let's Encrypt cert for `DEPLOY_DOMAIN` on first request. App is live at `https://${DEPLOY_DOMAIN}` within 1–2 minutes.

## Updates

```bash
git pull
docker compose up -d --build
```

Old containers stop, new ones come up, no downtime on the Caddy port (containers are recreated one at a time by compose).

## Logs

```bash
docker compose logs -f web
docker compose logs -f api
docker compose logs -f caddy
```

## Health checks

- API: `curl https://${DEPLOY_DOMAIN}/api/health` → `{"status":"ok",...}`
- Web: `curl -I https://${DEPLOY_DOMAIN}/` → `HTTP/2 200`

## Stopping / restarting

```bash
docker compose down       # stop + remove containers (data volumes survive)
docker compose restart    # restart in place
docker compose down -v    # nuke including caddy cert volume — only if you want to start over
```

## DNS / TLS gotchas

- DNS A record must resolve before first deploy or Caddy can't get a cert
- Ports 80 and 443 must be open on the server's firewall
- If you're behind Cloudflare, set the proxy mode to "DNS only" (gray cloud) for the first deploy so Caddy can complete the ACME HTTP challenge. Re-enable orange cloud after.

## Architecture

```
Internet :443 ──► Caddy ──┬─► /api/* → api:3001  (NestJS)
                          └─► /*     → web:3000  (Next.js standalone)

Both containers talk to hosted Supabase over HTTPS.
```

## Build args (NEXT_PUBLIC_*)

`NEXT_PUBLIC_*` variables are baked into the web bundle at build time. Changing them requires a rebuild:

```bash
docker compose up -d --build web
```

Server-side env on the api container is read at runtime — no rebuild needed for changes there:

```bash
docker compose up -d api
```
