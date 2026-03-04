import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
        return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 });
    }

    try {
        const res = await fetch(`${BACKEND_URL}/api/v1/products?tenantId=${tenantId}`, {
            cache: 'no-store'
        });

        const text = await res.text();
        let payload: unknown = [];
        if (text) {
            try {
                payload = JSON.parse(text);
            } catch {
                payload = { error: text };
            }
        }

        if (!res.ok) {
            return NextResponse.json(payload, { status: res.status });
        }

        return NextResponse.json(payload);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
