#!/usr/bin/env node
/**
 * Creates an admin user in Supabase and grants the 'admin' role.
 * Usage: node scripts/create-admin-user.mjs <email>
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = join(__dir, '../apps/admin/.env.local');
  try {
    const lines = readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const [key, ...rest] = line.split('=');
      if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
    }
  } catch {
    // env may already be set
  }
}

loadEnv();

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/create-admin-user.mjs <email>');
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log(`Creating/promoting admin: ${email}`);

// Invite user — they'll get an email to set their password
const { data: invite, error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(email);
if (inviteErr && !inviteErr.message.toLowerCase().includes('already been registered')) {
  console.error('Invite error:', inviteErr.message);
  process.exit(1);
}
if (inviteErr) {
  console.log('User already registered; promoting existing account.');
}

// Get the user ID (existing or just created)
const { data: list } = await supabase.auth.admin.listUsers();
const authUser = list?.users?.find((u) => u.email === email);
if (!authUser) {
  console.error('Could not find user in auth.users after invite.');
  process.exit(1);
}

// Upsert into public.users with role = 'admin'
const { error: upsertErr } = await supabase.from('users').upsert(
  { id: authUser.id, email, role: 'admin', display_name: 'Admin' },
  { onConflict: 'id' }
);
if (upsertErr) {
  // Try plain update if insert fails (user row may already exist)
  const { error: updateErr } = await supabase
    .from('users')
    .update({ role: 'admin' })
    .eq('id', authUser.id);
  if (updateErr) {
    console.error('Could not set role:', updateErr.message);
    process.exit(1);
  }
}

console.log(`✓ ${email} is now an admin (id: ${authUser.id})`);
console.log('  They will receive an email invite to set their password.');
console.log('  After confirming, they can log in at: https://admin.reviewnatinph.com');
