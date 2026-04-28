# Deploy

Outsauce (web + api) deployed via Docker Compose, behind your existing host-level Caddy. Hosted Supabase handles auth/db.

## Prerequisites

- A Linux server with a public IPv4
- A domain pointed at that IP (A record)
- Caddy already running on the host (manages ports 80/443)
- Docker + Docker Compose plugin installed (`docker --version`, `docker compose version`)
- A Supabase project with all migrations from `supabase/migrations` applied (`supabase db push` from your laptop)

## One-time setup

```bash
git clone https://github.com/<your-org>/outsauce.git
cd outsauce
cp .env.production.example .env
nano .env   # confirm DEPLOY_DOMAIN, Supabase, Anthropic, Stripe values
```

## Configure host Caddy

Append the contents of `Caddyfile` (in this repo) to your host Caddy config — typically `/etc/caddy/Caddyfile`. Adjust the domain at the top to match your `DEPLOY_DOMAIN` if it isn't already `outsauce.elixxir.tech`.

```bash
sudo nano /etc/caddy/Caddyfile
# paste the block, save
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Caddy will fetch a Let's Encrypt cert for the domain on first request.

## Deploy

```bash
docker compose up -d --build
```

Containers bind to `127.0.0.1:3000` (web) and `127.0.0.1:3001` (api) — only reachable from the host, where Caddy proxies them. App is live at `https://${DEPLOY_DOMAIN}`.

## Updates

```bash
git pull
docker compose up -d --build
```

## Logs

```bash
docker compose logs -f web
docker compose logs -f api
sudo journalctl -fu caddy
```

## Health checks

- API: `curl https://${DEPLOY_DOMAIN}/api/health` → `{"status":"ok",...}`
- Web: `curl -I https://${DEPLOY_DOMAIN}/` → `HTTP/2 200`

Direct container checks (from the server):

```bash
curl http://127.0.0.1:3001/api/health
curl -I http://127.0.0.1:3000/
```

## Stopping / restarting

```bash
docker compose down       # stop + remove containers
docker compose restart    # restart in place
```

## DNS / TLS gotchas

- DNS A record must resolve before first request hits Caddy
- Ports 80 and 443 must be open on the server's firewall
- If behind Cloudflare, set proxy mode to "DNS only" (gray cloud) for the first request so Caddy can complete the ACME HTTP challenge. Re-enable orange cloud after.

## Architecture

```
Internet :443 ──► Host Caddy ──┬─► /api/* → 127.0.0.1:3001  (api container, NestJS)
                               └─► /*     → 127.0.0.1:3000  (web container, Next.js)

Both containers talk to hosted Supabase over HTTPS.
```

## Build args (NEXT_PUBLIC_*)

`NEXT_PUBLIC_*` variables are baked into the web bundle at build time. Changing them requires a rebuild:

```bash
docker compose up -d --build web
```

API env is read at runtime — no rebuild needed:

```bash
docker compose up -d api
```
