# Deploy ReviewNatin to Vercel

Two Vercel projects from one GitHub repo:

| Project | Folder | Domain |
|---------|--------|--------|
| `reviewnatin-marketing` | `apps/marketing` | `reviewnatinph.com` |
| `reviewnatin-admin` | `apps/admin` | `admin.reviewnatinph.com` |

## One-time: Vercel account

If GitHub sign-up shows **"account already associated with your GitHub email"**, log in at [vercel.com/login](https://vercel.com/login) with **email**, then link GitHub under **Account Settings → Login Connections**.

## Option A — Dashboard (easiest)

### Marketing

1. [vercel.com/new](https://vercel.com/new) → **Import** `donbermoy88/reviewnatin`
2. **Project name:** `reviewnatin-marketing`
3. **Root Directory:** `apps/marketing` (Edit → enable *Include source files outside Root Directory*)
4. **Environment variables:**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` = `https://reviewnatinph.com`
5. Deploy → **Settings → Domains** → add `reviewnatinph.com` and `www.reviewnatinph.com`

### Admin

1. Import the **same repo** again as a new project
2. **Project name:** `reviewnatin-admin`
3. **Root Directory:** `apps/admin`
4. **Environment variables:**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server only — never expose to marketing)
5. Deploy → add domain `admin.reviewnatinph.com`

## Option B — CLI (after `npx vercel login`)

```bash
cd /Users/lyndon/reviewnatin
npm run vercel:setup
```

This links both projects, sets env vars from local `.env.local` files, and deploys to production.

## GitHub Actions (auto-deploy on push)

After CLI setup, add these **GitHub repo secrets** (`Settings → Secrets → Actions`):

| Secret | Where to find |
|--------|----------------|
| `VERCEL_TOKEN` | [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | `apps/marketing/.vercel/project.json` → `orgId` |
| `VERCEL_PROJECT_ID_MARKETING` | same file → `projectId` |
| `VERCEL_PROJECT_ID_ADMIN` | `apps/admin/.vercel/project.json` → `projectId` |

Workflow: `.github/workflows/vercel-deploy.yml` — runs on every push to `master`.

## DNS (Cloudflare or registrar)

Point domains to Vercel (exact records shown in Vercel → Domains):

| Type | Name | Value |
|------|------|--------|
| A | `@` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |
| CNAME | `admin` | `cname.vercel-dns.com` |
