import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import {
  loadPushSubscriptions,
  removePushSubscriptionByEndpoint,
} from '@/lib/push-subscriptions-storage'

function configureVapid(): boolean {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim()
  const priv = process.env.VAPID_PRIVATE_KEY?.trim()
  const subject = process.env.VAPID_SUBJECT?.trim() || 'mailto:info@vkbouwmaster.com'
  if (!pub || !priv) return false
  webpush.setVapidDetails(subject, pub, priv)
  return true
}

export async function POST(request: NextRequest) {
  const secretEnv = process.env.PUSH_SEND_SECRET?.trim()
  if (!secretEnv) {
    return NextResponse.json(
      { error: 'PUSH_SEND_SECRET not set on server' },
      { status: 503 }
    )
  }

  let parsed: { secret?: string; title?: string; body?: string }
  try {
    parsed = (await request.json()) as { secret?: string; title?: string; body?: string }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const bodySecret = String(parsed.secret || '').trim()
  if (bodySecret !== secretEnv) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!configureVapid()) {
    return NextResponse.json({ error: 'VAPID not configured' }, { status: 503 })
  }

  let title = 'VK Bouwmaster'
  let text = 'Test push — alles werkt.'
  if (typeof parsed.title === 'string' && parsed.title.trim()) {
    title = parsed.title.trim().slice(0, 120)
  }
  if (typeof parsed.body === 'string' && parsed.body.trim()) {
    text = parsed.body.trim().slice(0, 500)
  }

  const payload = JSON.stringify({ title, body: text })
  const subs = loadPushSubscriptions()
  const results: { endpoint: string; ok: boolean; statusCode?: number }[] = []

  for (const row of subs) {
    try {
      await webpush.sendNotification(row.subscription, payload, {
        TTL: 60,
        urgency: 'high',
      })
      results.push({ endpoint: row.subscription.endpoint, ok: true })
    } catch (err: unknown) {
      const statusCode =
        err && typeof err === 'object' && 'statusCode' in err
          ? Number((err as { statusCode?: number }).statusCode)
          : undefined
      if (statusCode === 404 || statusCode === 410) {
        removePushSubscriptionByEndpoint(row.subscription.endpoint)
      }
      results.push({ endpoint: row.subscription.endpoint, ok: false, statusCode })
    }
  }

  return NextResponse.json({
    sent: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  })
}
