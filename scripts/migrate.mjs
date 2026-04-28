#!/usr/bin/env node
import { readdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO_ROOT = path.resolve(__dirname, '..');
const MIGRATIONS_DIR = path.join(REPO_ROOT, 'supabase', 'migrations');

const args = process.argv.slice(2);
const urlIdx = args.indexOf('--url');
const urlFromFlag = urlIdx >= 0 ? args[urlIdx + 1] : null;
const databaseUrl = urlFromFlag || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error(
    'Missing DATABASE_URL. Pass via env (DATABASE_URL=... pnpm migrate) or --url "postgresql://..."',
  );
  console.error('');
  console.error(
    'Find it in: Supabase dashboard → Settings → Database → Connection string → URI',
  );
  console.error('Use the "Session pooler" or "Direct connection" option.');
  process.exit(1);
}

let pg;
try {
  pg = await import('pg');
} catch {
  console.error(
    'The "pg" package is not installed. Run: pnpm add -D -w pg',
  );
  process.exit(1);
}

const { Client } = pg.default;

async function main() {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('No migration files found in supabase/migrations/.');
    return;
  }

  console.log(`Found ${files.length} migration file(s) in supabase/migrations/`);

  const client = new Client({
    connectionString: databaseUrl,
    ssl: needsSsl(databaseUrl) ? { rejectUnauthorized: false } : undefined,
  });

  await client.connect();
  console.log('Connected to database.');

  try {
    await ensureTrackingTable(client);

    const applied = await fetchApplied(client);
    let appliedCount = 0;
    let skippedCount = 0;

    for (const file of files) {
      const filePath = path.join(MIGRATIONS_DIR, file);
      const sql = readFileSync(filePath, 'utf8');
      const checksum = sha256(sql);

      const existing = applied.get(file);
      if (existing) {
        if (existing.checksum !== checksum) {
          console.warn(
            `  ⚠  ${file} already applied but checksum differs (file edited after apply). Skipping.`,
          );
        } else {
          skippedCount++;
        }
        continue;
      }

      process.stdout.write(`  → applying ${file} ... `);
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query(
          'INSERT INTO _outsauce_migrations (filename, checksum) VALUES ($1, $2)',
          [file, checksum],
        );
        await client.query('COMMIT');
        appliedCount++;
        console.log('ok');
      } catch (err) {
        await client.query('ROLLBACK');
        console.log('FAILED');
        console.error(`\nMigration ${file} failed:`);
        console.error(err instanceof Error ? err.message : err);
        process.exit(1);
      }
    }

    console.log('');
    console.log(
      `Done. Applied ${appliedCount} new migration(s), skipped ${skippedCount} already-applied.`,
    );
  } finally {
    await client.end();
  }
}

async function ensureTrackingTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS _outsauce_migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      checksum TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

async function fetchApplied(client) {
  const res = await client.query(
    'SELECT filename, checksum FROM _outsauce_migrations ORDER BY id ASC',
  );
  const map = new Map();
  for (const row of res.rows) {
    map.set(row.filename, { checksum: row.checksum });
  }
  return map;
}

function sha256(s) {
  return createHash('sha256').update(s).digest('hex');
}

function needsSsl(url) {
  return /supabase\.co|supabase\.com|sslmode=require/.test(url);
}

main().catch((err) => {
  console.error('Migration runner crashed:');
  console.error(err);
  process.exit(1);
});
