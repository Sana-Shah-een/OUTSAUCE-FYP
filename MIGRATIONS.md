# Migrations

Apply every SQL file in `supabase/migrations/` to a Supabase Postgres database. Idempotent — already-applied migrations are skipped, so re-running is safe.

## One-time setup against hosted Supabase

1. Get the connection string from Supabase:
   - Dashboard → Settings → Database → Connection string → URI
   - Pick **Session pooler** (port 5432) or **Direct connection**. Copy the full URL.
   - Replace `[YOUR-PASSWORD]` in the template with your actual database password.

2. Run from the repo root:

```bash
DATABASE_URL="postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres" pnpm migrate
```

Or with the `--url` flag:

```bash
pnpm migrate -- --url "postgresql://postgres.xxxxx:..."
```

## What it does

- Connects to the database with SSL (auto-enabled for `*.supabase.co` URLs).
- Creates a `_outsauce_migrations` tracking table on first run.
- Applies each `*.sql` file in `supabase/migrations/` in filename order.
- Each migration runs inside a transaction — failure rolls back, exit code non-zero.
- Successfully-applied migrations are recorded by filename + sha256 checksum.
- Re-running skips files already in the tracking table.
- Warns if a previously-applied file has been edited (checksum mismatch).

## Output

```
Found 13 migration file(s) in supabase/migrations/
Connected to database.
  → applying 20260330000001_create_enums.sql ... ok
  → applying 20260330000002_create_profiles.sql ... ok
  ...
Done. Applied 13 new migration(s), skipped 0 already-applied.
```

## Local self-hosted Supabase

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres" pnpm migrate
```

(Default password and port for `npx supabase start`.)

## CI / production

Run after a deploy if you've added new migration files:

```bash
DATABASE_URL=$PROD_DATABASE_URL pnpm migrate
```

Don't run in the API container's startup — keep it as a deliberate pre-deploy step so a bad migration doesn't kill your pods.
