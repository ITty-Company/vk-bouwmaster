import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import {
  upsertPushSubscription,
  type StoredPushSubscription,
} from '@/lib/push-subscriptions-storage'

export async function POST(request: NextRequest) {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim()
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim()
  if (!publicKey || !privateKey) {
    return NextResponse.json(
      { error: 'VAPID keys not configured on server' },
      { status: 503 }
    )
  }

  try {
    const body = (await request.json()) as {
      subscription?: StoredPushSubscription['subscription']
    }
    const sub = body.subscription
    if (
      !sub?.endpoint ||
      !sub.keys?.p256dh ||
      !sub.keys?.auth
    ) {
      return NextResponse.json({ error: 'Invalid subscription payload' }, { status: 400 })
    }

    const id = randomUUID()

    const entry: StoredPushSubscription = {
      id,
      subscription: {
        endpoint: sub.endpoint,
        expirationTime: sub.expirationTime ?? null,
        keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
      },
      createdAt: new Date().toISOString(),
      userAgent: request.headers.get('user-agent') ?? undefined,
    }
    upsertPushSubscription(entry)
    return NextResponse.json({ ok: true, id })
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}
