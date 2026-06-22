const API = 'https://api.supabase.com/v1';

export async function supabaseManagementApi(ref, token, path, options = {}) {
  const res = await fetch(`${API}/projects/${ref}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    throw new Error(`Supabase API ${path} (${res.status}): ${JSON.stringify(data)}`);
  }
  return data;
}

export async function getAuthConfig(ref, token) {
  return supabaseManagementApi(ref, token, '/config/auth');
}

export async function patchAuthConfig(ref, token, patch) {
  return supabaseManagementApi(ref, token, '/config/auth', {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}
