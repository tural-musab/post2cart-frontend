import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

export async function GET(request: Request, { params }: { params: { slug: string } }) {
    try {
        const res = await fetch(`${BACKEND_URL}/api/v1/products/public/${params.slug}`, {
            next: { revalidate: 60 } // ISR - Revalidate every 60 seconds
        });

        if (!res.ok) {
            if (res.status === 404) return NextResponse.json({ error: 'Not found' }, { status: 404 });
            throw new Error('Backend failed to return product');
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
