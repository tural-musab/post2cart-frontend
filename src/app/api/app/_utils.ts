import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

type ForwardOptions = {
  path: string;
  method: 'GET' | 'POST' | 'PATCH';
  request: Request;
};

export async function forwardToBackend({ path, method, request }: ForwardOptions) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
  }

  const headers: Record<string, string> = {
    Authorization: authHeader,
  };

  let body: string | undefined;
  if (method !== 'GET') {
    body = await request.text();
    headers['Content-Type'] = request.headers.get('content-type') || 'application/json';
  }

  try {
    const response = await fetch(`${BACKEND_URL}${path}`, {
      method,
      headers,
      body,
      cache: 'no-store',
    });

    const text = await response.text();
    const contentType = response.headers.get('content-type') || 'application/json';

    return new NextResponse(text, {
      status: response.status,
      headers: {
        'content-type': contentType,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected proxy error' },
      { status: 500 },
    );
  }
}
