# Supabase Free-Plan Keepalive

ReviewNatin PH is currently on Supabase Free. Free projects can be paused after inactivity, so the repo includes an external GitHub Actions keepalive workflow:

`.github/workflows/keep-supabase-alive.yml`

This is the best no-cost workaround until the organization can upgrade to Pro. It is not the same as Supabase's plan-level no-pause guarantee, but it creates real database activity several times per day.

## Target projects

Primary project from Supabase pause email:

- Project name: `ReviewNatin PH`
- Project ref: `tirxigmycjuhaecmbygs`
- Keepalive URL: `https://tirxigmycjuhaecmbygs.supabase.co/rest/v1/subscription_products?select=id,sku&limit=1`

Optional project currently linked by local mobile env:

- Project ref: `yohewfdafdmwntsbzgxx`
- Keepalive URL: `https://yohewfdafdmwntsbzgxx.supabase.co/rest/v1/subscription_products?select=id,sku&limit=1`

## Required GitHub secret

Add this in GitHub:

`Settings -> Secrets and variables -> Actions -> New repository secret`

- Name: `REVIEWNATIN_PH_SUPABASE_ANON_KEY`
- Value: Supabase Dashboard -> project `tirxigmycjuhaecmbygs` -> Project Settings -> API -> Project API keys -> `anon public`

## Optional GitHub secret

Only add this if the mobile app remains pointed at `yohewfdafdmwntsbzgxx`:

- Name: `APP_LINKED_SUPABASE_ANON_KEY`
- Value: Supabase Dashboard -> project `yohewfdafdmwntsbzgxx` -> Project Settings -> API -> Project API keys -> `anon public`

## Verification

1. Push the workflow to the default GitHub branch.
2. Add `REVIEWNATIN_PH_SUPABASE_ANON_KEY`.
3. Open GitHub -> Actions -> Keep Supabase Alive.
4. Click `Run workflow`.
5. Confirm the `Keep ReviewNatin PH Supabase project active` job succeeds with HTTP `2xx`.

If the workflow fails, fix it immediately. A failing keepalive means Supabase may still pause the Free project.

## Why not Supabase Cron only?

Supabase Cron runs inside the Supabase project. External GitHub Actions activity is safer for inactivity prevention because it reaches Supabase from outside the project and exercises the public API/database path that the mobile app also uses.

## Permanent paid fix

When budget allows, upgrade the Supabase organization to Pro. Pro is the only plan-level no-pause guarantee.
