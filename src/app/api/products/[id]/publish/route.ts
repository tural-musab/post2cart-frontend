import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { tenantId, price, status } = body;

        const res = await fetch(`${BACKEND_URL}/api/v1/products/${id}/publish`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ tenantId, price, status })
        });

        const text = await res.text();
        let payload: unknown = {};
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
