#!/usr/bin/env node
/**
 * Repairs local/admin Supabase access for an existing user.
 * Usage: npm run admin:repair-access -- <email>
 *
 * Requires apps/admin/.env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = join(__dir, '../apps/admin/.env.local');
  try {
    for (const line of readFileSync(envPath, 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [key, ...rest] = trimmed.split('=');
      if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
    }
  } catch {
    // Env may already be set.
  }
}

loadEnv();

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error('Usage: npm run admin:repair-access -- <email>');
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: list, error: listErr } = await supabase.auth.admin.listUsers();
if (listErr) {
  console.error('Could not list auth users:', listErr.message);
  process.exit(1);
}

const authUser = list?.users?.find((user) => user.email?.toLowerCase() === email);
if (!authUser) {
  console.error(`No Supabase Auth user found for ${email}. Create/register the account first.`);
  process.exit(1);
}

console.log(`Auth user: ${authUser.id} (${authUser.email})`);

const { data: existingRows, error: existingErr } = await supabase
  .from('users')
  .select('id,email,role,display_name')
  .or(`id.eq.${authUser.id},email.eq.${email}`);

if (existingErr) {
  console.error('Could not inspect public.users:', existingErr.message);
  process.exit(1);
}

if (existingRows?.length) {
  console.log('Existing profile rows:');
  for (const row of existingRows) {
    console.log(`- id=${row.id} email=${row.email} role=${row.role}`);
  }
}

const conflictingRows = (existingRows ?? []).filter((row) => row.email === email && row.id !== authUser.id);
if (conflictingRows.length) {
  console.error('Found public.users rows with this email but a different auth id. Fix manually before login:');
  for (const row of conflictingRows) console.error(`- ${row.id}`);
  process.exit(1);
}

const { error: upsertErr } = await supabase.from('users').upsert(
  {
    id: authUser.id,
    email,
    role: 'admin',
    display_name: existingRows?.find((row) => row.id === authUser.id)?.display_name || 'Admin',
  },
  { onConflict: 'id' }
);

if (upsertErr) {
  console.error('Could not upsert admin profile:', upsertErr.message);
  process.exit(1);
}

const { error: updateErr } = await supabase
  .from('users')
  .update({ role: 'admin', email })
  .eq('id', authUser.id);

if (updateErr) {
  console.error('Could not update admin role:', updateErr.message);
  process.exit(1);
}

const { data: profile, error: profileErr } = await supabase
  .from('users')
  .select('id,email,role,display_name')
  .eq('id', authUser.id)
  .single();

if (profileErr) {
  console.error('Could not verify repaired profile:', profileErr.message);
  process.exit(1);
}

console.log(`Repaired profile: id=${profile.id} email=${profile.email} role=${profile.role}`);

if (!['admin', 'content_reviewer', 'content_author'].includes(profile.role)) {
  console.error(`Profile role is still not staff: ${profile.role}`);
  process.exit(1);
}

if (!anonKey) {
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing; skipping anon policy smoke check.');
  process.exit(0);
}

console.log('Admin access repair complete. If the browser still shows error=staff, sign out/clear cookies and sign in again.');
