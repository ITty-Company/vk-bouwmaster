import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'

export type StoredPushSubscription = {
  id: string
  subscription: {
    endpoint: string
    expirationTime: number | null
    keys: { p256dh: string; auth: string }
  }
  createdAt: string
  userAgent?: string
}

const filePath = () =>
  process.env.PUSH_SUBSCRIPTIONS_PATH?.trim() ||
  join(process.cwd(), 'data', 'push-subscriptions.json')

function ensureDir(): void {
  const p = filePath()
  mkdirSync(dirname(p), { recursive: true })
}

export function loadPushSubscriptions(): StoredPushSubscription[] {
  try {
    const raw = readFileSync(filePath(), 'utf-8')
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as StoredPushSubscription[]) : []
  } catch {
    return []
  }
}

export function savePushSubscriptions(list: StoredPushSubscription[]): void {
  ensureDir()
  writeFileSync(filePath(), JSON.stringify(list, null, 2), 'utf-8')
}

export function upsertPushSubscription(entry: StoredPushSubscription): void {
  const list = loadPushSubscriptions()
  const idx = list.findIndex((s) => s.subscription.endpoint === entry.subscription.endpoint)
  if (idx >= 0) list[idx] = entry
  else list.push(entry)
  savePushSubscriptions(list)
}

export function removePushSubscriptionByEndpoint(endpoint: string): void {
  const list = loadPushSubscriptions().filter((s) => s.subscription.endpoint !== endpoint)
  savePushSubscriptions(list)
}
