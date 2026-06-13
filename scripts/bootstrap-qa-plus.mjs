#!/usr/bin/env node
/**
 * Create/sign in a QA account and grant a dev/demo ReviewNatin Plus entitlement.
 *
 * Required:
 *   QA_PLUS_PASSWORD=...
 *
 * Optional:
 *   QA_PLUS_EMAIL=qa.plus@reviewnatin.test
 *
 * The grant uses the public authenticated RPC, so it only works when the target
 * database has app.demo_entitlements_enabled=true. Enable that for local/dev QA
 * with:
 *   npm run db:enable-demo-iap
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import { createClient } from '@supabase/supabase-js';

const ROOT = process.cwd();
const DEFAULT_EMAIL = 'qa.plus@reviewnatin.test';

function loadEnvFile(path) {
  if (!existsSync(path)) return {};
  return Object.fromEntries(
    readFileSync(path, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const i = line.indexOf('=');
        return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
      })
  );
}

function fail(message) {
  console.error(`\n${message}\n`);
  process.exit(1);
}

const rootEnv = loadEnvFile(join(ROOT, '.env'));
const mobileEnv = loadEnvFile(join(ROOT, 'apps/mobile/.env'));
const env = { ...rootEnv, ...mobileEnv, ...process.env };

const url = env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const email = env.QA_PLUS_EMAIL || DEFAULT_EMAIL;
const password = env.QA_PLUS_PASSWORD;

if (!url || !anonKey) {
  fail('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in .env / apps/mobile/.env.');
}

if (!password) {
  fail('Set QA_PLUS_PASSWORD before running this script. Do not commit the password.');
}

const supabase = createClient(url, anonKey, { auth: { persistSession: false } });

async function signInOrCreate() {
  const signIn = await supabase.auth.signInWithPassword({ email, password });
  if (signIn.data.session) return signIn.data;

  const signUp = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: 'QA Plus', full_name: 'QA Plus' } },
  });

  if (signUp.error) throw signUp.error;
  if (signUp.data.session) return signUp.data;

  fail(`QA account ${email} was created but needs email confirmation before Plus can be granted.`);
}

async function main() {
  const auth = await signInOrCreate();
  const userId = auth.user?.id;
  if (!userId) fail('Signed in but Supabase did not return a user id.');

  const { data: products, error: productsError } = await supabase
    .from('subscription_products')
    .select('id, sku, tier')
    .eq('tier', 'plus')
    .order('price_php');

  if (productsError) throw productsError;
  const product = products?.find((p) => p.sku === 'com.reviewnatin.plus.six_months') ?? products?.[0];
  if (!product) fail('No Plus subscription product exists in subscription_products.');

  const grant = await supabase.rpc('grant_demo_entitlement', {
    p_product_id: product.id,
    p_exam_type_id: null,
  });

  if (grant.error) {
    if (grant.error.message?.includes('Demo entitlements are disabled')) {
      fail(
        `QA account ${email} exists, but demo entitlements are disabled on this database.\n` +
          'Enable local/dev demo grants with: npm run db:enable-demo-iap'
      );
    }
    throw grant.error;
  }

  const { data: entitlements, error: entitlementsError } = await supabase
    .from('user_entitlements')
    .select('source, status, expires_at, current_period_end, subscription_products(sku,tier)')
    .eq('user_id', userId);

  if (entitlementsError) throw entitlementsError;
  const hasDemoPlus = entitlements?.some((e) => e.source === 'demo' && e.subscription_products?.tier === 'plus');

  console.log(
    JSON.stringify(
      {
        ok: true,
        email,
        plusSku: product.sku,
        demoPlusActive: Boolean(hasDemoPlus),
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        message: error instanceof Error ? error.message : String(error),
        code: error?.code,
        hint: error?.hint,
      },
      null,
      2
    )
  );
  process.exit(1);
});
