const API_BASE = import.meta.env.VITE_API_URL || '';

let csrfToken = '';

export async function fetchCsrfToken(): Promise<void> {
  const res = await fetch(`${API_BASE}/api/auth/csrf-token`, {
    credentials: 'include',
  });
  const json = await res.json();
  csrfToken = json.data.csrfToken;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
  });

  const json = await res.json();

  if (!res.ok) {
    throw json.error;
  }

  return json;
}

async function mutatingFetch<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  if (!csrfToken) {
    await fetchCsrfToken();
  }

  const headers: Record<string, string> = {
    'X-CSRF-Token': csrfToken,
  };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  let res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Retry once with a fresh CSRF token on 403
  if (res.status === 403) {
    await fetchCsrfToken();
    headers['X-CSRF-Token'] = csrfToken;
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  const json = await res.json();

  if (!res.ok) {
    throw json.error;
  }

  return json;
}

export async function apiDelete<T>(path: string): Promise<T> {
  return mutatingFetch<T>('DELETE', path);
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return mutatingFetch<T>('POST', path, body);
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  return mutatingFetch<T>('PUT', path, body);
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return mutatingFetch<T>('PATCH', path, body);
}
