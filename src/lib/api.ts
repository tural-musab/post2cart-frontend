import { getSupabaseBrowserClient } from './supabase-browser';

async function getAccessToken() {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.access_token) {
    throw new Error('No active auth session');
  }

  return session.access_token;
}

export async function appApiFetch<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token = await getAccessToken();

  const headers = new Headers(init?.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(path, {
    ...init,
    headers,
  });

  const text = await response.text();
  let payload: any = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { message: text };
    }
  }

  if (!response.ok) {
    const message = payload?.error || payload?.message || 'API request failed';
    throw new Error(message);
  }

  return payload as T;
}
