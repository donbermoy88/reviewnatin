import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const PROXY_PATH = new URL('../../apps/admin/proxy.ts', import.meta.url);
const MIDDLEWARE_PATH = new URL('../../apps/admin/middleware.ts', import.meta.url);
const ROLES_PATH = new URL('../../apps/admin/lib/auth/roles.ts', import.meta.url);

describe('admin proxy regression guard', () => {
  it('uses the Next 16 proxy convention instead of deprecated middleware', () => {
    const source = readFileSync(PROXY_PATH, 'utf8');

    assert.equal(existsSync(MIDDLEWARE_PATH), false);
    assert.match(source, /export async function proxy\(request: NextRequest\)/);
    assert.doesNotMatch(source, /export async function middleware/);
    assert.match(source, /export const config = \{/);
    assert.match(source, /matcher: \['\/\(\(\?!_next\/static\|_next\/image\|favicon\.ico\)\.\*\)'\]/);
  });

  it('keeps admin content routes protected while leaving login public', () => {
    const source = readFileSync(PROXY_PATH, 'utf8');

    assert.match(source, /pathname\.startsWith\('\/login'\)/);
    assert.match(source, /pathname\.startsWith\('\/content'\)/);
    assert.match(source, /pathname\.startsWith\('\/api\/content'\)/);
    assert.match(source, /pathname === '\/'/);
  });

  it('keeps unauthenticated and non-staff responses distinct', () => {
    const source = readFileSync(PROXY_PATH, 'utf8');

    assert.match(source, /NextResponse\.json\(\{ error: 'Unauthorized' \}, \{ status: 401 \}\)/);
    assert.match(source, /login\.searchParams\.set\('next', pathname\)/);
    assert.match(source, /NextResponse\.json\(\{ error: 'Staff access required' \}, \{ status: 403 \}\)/);
    assert.match(source, /login\.searchParams\.set\('error', 'staff'\)/);
  });

  it('uses the canonical staff role helper', () => {
    const proxySource = readFileSync(PROXY_PATH, 'utf8');
    const rolesSource = readFileSync(ROLES_PATH, 'utf8');

    assert.match(proxySource, /import \{ isStaffRole \} from '\.\/lib\/auth\/staff'/);
    assert.match(proxySource, /!isStaffRole\(profile\?\.role\)/);
    assert.match(rolesSource, /'admin'/);
    assert.match(rolesSource, /'content_reviewer'/);
    assert.match(rolesSource, /'content_author'/);
  });

  it('uses server-side service role for profile lookup when configured', () => {
    const source = readFileSync(PROXY_PATH, 'utf8');

    assert.match(source, /import \{ createClient \} from '@supabase\/supabase-js'/);
    assert.match(source, /process\.env\.SUPABASE_SERVICE_ROLE_KEY/);
    assert.match(source, /const profileClient = serviceRoleKey/);
    assert.match(source, /profileClient\.from\('users'\)\.select\('role'\)/);
  });
});
