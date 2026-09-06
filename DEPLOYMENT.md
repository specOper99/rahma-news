# Deployment guide

Deploy Herald to a Linux server that already runs PostgreSQL. You do **not** need Docker on the server for the database — point the app at your existing Postgres instance and run migrations there.

Local development still uses `docker compose` for Postgres; production uses whatever Postgres you already have.

## Requirements

| Component | Version |
|-----------|---------|
| Node.js | 20+ |
| pnpm | 9+ (matches `packageManager` in `package.json`) |
| PostgreSQL | 14+ (16 recommended) |

The app needs:

- Outbound HTTPS (for package install during build, optional cron)
- A persistent directory for uploaded media (`storage/uploads/`)
- TCP access from the app host to Postgres (localhost or private network)

## PostgreSQL on your server

### Use a dedicated database

Even if Postgres already holds other databases, create one for Herald so migrations and backups stay isolated:

```sql
CREATE USER herald WITH PASSWORD 'strong-password-here';
CREATE DATABASE herald OWNER herald;
GRANT ALL PRIVILEGES ON DATABASE herald TO herald;
```

If you prefer to reuse an **existing empty database**, that works too — set `DATABASE_URL` to it and run migrations below. Do not point Herald at a database owned by another application unless you are sure table names will not collide (Herald creates its own tables in the `public` schema).

### Connection string

Build `DATABASE_URL` in standard Postgres URI form:

```
postgres://USER:PASSWORD@HOST:PORT/DATABASE
```

Examples:

```bash
# App and Postgres on same machine
DATABASE_URL=postgres://herald:secret@127.0.0.1:5432/herald

# Remote Postgres
DATABASE_URL=postgres://herald:secret@db.internal:5432/herald
```

Special characters in the password must be URL-encoded.

### Verify connectivity

From the app server:

```bash
psql "$DATABASE_URL" -c 'SELECT version();'
```

## Environment variables

Copy the template and fill in production values:

```bash
cp .env.example .env
```

| Variable | Production value |
|----------|------------------|
| `DATABASE_URL` | Your existing Postgres connection string |
| `BETTER_AUTH_SECRET` | Random string, at least 32 bytes — e.g. `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Public site URL with scheme, no trailing slash — e.g. `https://news.example.com` |
| `NEXT_PUBLIC_SITE_URL` | Same as `BETTER_AUTH_URL` |
| `REVALIDATE_SECRET` | Random string for the cache revalidation endpoint |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | First owner account (used only when seeding) |
| `EDITOR_EMAIL` / `EDITOR_PASSWORD` | Optional demo editor (seed only) |
| `AUTHOR_EMAIL` / `AUTHOR_PASSWORD` | Optional demo author (seed only) |
| `ALLOW_SEED` | **Omit in production** unless you intentionally run the seed script once |

`BETTER_AUTH_URL` and `NEXT_PUBLIC_SITE_URL` must match the URL users type in the browser (including `https://`). A mismatch breaks admin login cookies.

Do not commit `.env`. Restrict permissions:

```bash
chmod 600 .env
```

## First deploy

### 1. Install the app

```bash
git clone <your-repo-url> /var/www/herald
cd /var/www/herald
pnpm install --frozen-lockfile
```

### 2. Configure environment

Edit `.env` as described above.

### 3. Run migrations

Applies all SQL files in `drizzle/` to the database named in `DATABASE_URL`:

```bash
pnpm db:migrate
```

This is safe on an empty database. If you previously ran migrations on the same database, Drizzle skips work already recorded in its migration journal.

### 4. Create staff users

The seed script creates demo articles **and** three staff accounts. Use it only on first install:

```bash
ALLOW_SEED=1 pnpm seed
```

Then remove `ALLOW_SEED` from `.env`. Change passwords in `/admin` or rotate credentials immediately.

To start with an empty newsroom but still get accounts, run seed once and delete demo articles from `/admin`, or truncate editorial tables while keeping `user`, `account`, and `staff_profiles`.

There is no public signup. Every staff member must be created by an owner in `/admin/users` or via the seed script.

### 5. Prepare upload storage

Media uploads are written to disk, not Postgres:

```bash
mkdir -p storage/uploads
chown -R <app-user>:<app-group> storage/uploads
chmod 750 storage/uploads
```

Back up this directory with your normal file backup strategy. Rebuilds and redeploys must not delete it.

### 6. Build and start

```bash
pnpm build
pnpm start
```

Default port is **3000**. Set `PORT` if needed:

```bash
PORT=3000 pnpm start
```

For production, run the process under a process manager (systemd example below) and put a reverse proxy in front for TLS.

## Reverse proxy (nginx)

Terminate TLS at nginx and forward to Node:

```nginx
server {
    listen 443 ssl http2;
    server_name news.example.com;

    ssl_certificate     /etc/letsencrypt/live/news.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/news.example.com/privkey.pem;

    client_max_body_size 13m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

After enabling HTTPS, set both `BETTER_AUTH_URL` and `NEXT_PUBLIC_SITE_URL` to `https://news.example.com` and restart the app.

## systemd service

`/etc/systemd/system/herald.service`:

```ini
[Unit]
Description=Herald news site
After=network.target postgresql.service

[Service]
Type=simple
User=herald
Group=herald
WorkingDirectory=/var/www/herald
Environment=NODE_ENV=production
EnvironmentFile=/var/www/herald/.env
ExecStart=/usr/bin/pnpm start
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now herald
sudo systemctl status herald
```

Install pnpm globally for the `herald` user, or set `ExecStart` to the absolute path of `node node_modules/next/dist/bin/next start`.

## Scheduled publishing (cron)

Scheduled articles are promoted when `/api/revalidate` is called. Add a cron job on the server:

```cron
* * * * * curl -fsS -X POST -H "Authorization: Bearer YOUR_REVALIDATE_SECRET" https://news.example.com/api/revalidate >/dev/null
```

Replace `YOUR_REVALIDATE_SECRET` with the value of `REVALIDATE_SECRET` in `.env`.

## Redeploying

```bash
cd /var/www/herald
git pull
pnpm install --frozen-lockfile
pnpm db:migrate          # apply new migrations only
pnpm build
sudo systemctl restart herald
```

Do not run `pnpm seed` on production unless you intend to refresh demo data.

## Post-deploy checks

1. Home page loads at `/` and redirects to a locale (`/en`, `/ar`, or `/ckb`).
2. Admin login at `/admin/login` accepts your owner credentials.
3. Upload an image in `/admin/media` and confirm it serves at `/uploads/...`.
4. RSS at `/en/rss.xml` returns XML.
5. `curl -I https://news.example.com/en` shows security headers from `next.config.ts`.

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| Admin login succeeds then immediately logs out | `BETTER_AUTH_URL` / `NEXT_PUBLIC_SITE_URL` do not match the browser URL or scheme |
| `DATABASE_URL is required` on start | `.env` missing or not loaded by systemd (`EnvironmentFile=`) |
| Migration fails on enum/table already exists | Database was partially migrated or shared with another Herald install — use a fresh database or inspect `drizzle.__drizzle_migrations` |
| Uploaded images 404 after redeploy | `storage/uploads/` not persisted or wrong ownership |
| Search returns nothing | Migration `0001_search_vector.sql` did not run — re-run `pnpm db:migrate` |
| Seed refused | Production blocks seed unless `ALLOW_SEED=1` is set in the environment for that command |

## Local vs production

| | Local dev | Production server |
|--|-----------|-------------------|
| Postgres | `docker compose up -d` | Existing server Postgres |
| App | `pnpm dev` | `pnpm build && pnpm start` (behind nginx) |
| Seed | `pnpm seed` (ALLOW_SEED=1 in `.env.example`) | Only once, intentionally, with `ALLOW_SEED=1` |

See [README.md](README.md) for architecture and [DESIGN.md](DESIGN.md) for UI tokens.
