import { NextResponse } from 'next/server';

/** Lightweight response for platform health checks (Render, etc.). */
export function GET() {
  return NextResponse.json({ ok: true }, { status: 200 });
}
