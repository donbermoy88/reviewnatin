#!/usr/bin/env node
/**
 * Resets a Supabase Auth user's password locally using the service-role key.
 * Usage: npm run admin:reset-password -- <email>
 *
 * Requires apps/admin/.env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = join(__dir, '../apps/admin/.env.local');
  try {
    const lines = readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [key, ...rest] = trimmed.split('=');
      if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
    }
  } catch {
    // Env may already be set by the shell or CI.
  }
}

async function promptHidden(question) {
  const rl = createInterface({ input, output });
  const mutableOutput = output;
  const originalWrite = mutableOutput.write.bind(mutableOutput);

  mutableOutput.write = (chunk, encoding, callback) => {
    const text = String(chunk);
    if (text.includes(question)) {
      return originalWrite(chunk, encoding, callback);
    }
    if (text.includes('\n')) {
      return originalWrite('\n', encoding, callback);
    }
    return true;
  };

  try {
    return await rl.question(question);
  } finally {
    mutableOutput.write = originalWrite;
    rl.close();
  }
}

loadEnv();

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error('Usage: npm run admin:reset-password -- <email>');
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const password = await promptHidden(`New password for ${email}: `);
const confirm = await promptHidden('Confirm new password: ');

if (password !== confirm) {
  console.error('Passwords do not match.');
  process.exit(1);
}

if (password.length < 8) {
  console.error('Password must be at least 8 characters.');
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: list, error: listErr } = await supabase.auth.admin.listUsers();
if (listErr) {
  console.error('Could not list users:', listErr.message);
  process.exit(1);
}

const authUser = list?.users?.find((user) => user.email?.toLowerCase() === email);
if (!authUser) {
  console.error(`No Supabase Auth user found for ${email}.`);
  process.exit(1);
}

const { error: updateErr } = await supabase.auth.admin.updateUserById(authUser.id, {
  password,
  email_confirm: true,
});

if (updateErr) {
  console.error('Could not reset password:', updateErr.message);
  process.exit(1);
}

console.log(`Password reset for ${email}.`);
console.log('You can now log in to the admin app with the new password.');
