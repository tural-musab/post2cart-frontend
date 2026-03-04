import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ slug: string }> },
) {
    try {
        const { slug } = await params;
        const res = await fetch(`${BACKEND_URL}/api/v1/products/public/${slug}`, {
            next: { revalidate: 60 } // ISR - Revalidate every 60 seconds
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
