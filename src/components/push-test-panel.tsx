"use client"

import { useCallback, useEffect, useState } from 'react'

function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

const SW_URL = '/push-sw.js'

export function PushTestPanel() {
  const [visible, setVisible] = useState(false)
  const [status, setStatus] = useState<string>('')
  const [subscribed, setSubscribed] = useState(false)
  const [sendSecret, setSendSecret] = useState('')
  const [publicKey, setPublicKey] = useState<string | null>(null)

  useEffect(() => {
    const dev = process.env.NODE_ENV === 'development'
    const flag = process.env.NEXT_PUBLIC_ENABLE_PUSH_UI === '1'
    setVisible(dev || flag)
  }, [])

  const refreshStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/push/status')
      const data = (await res.json()) as { configured?: boolean; publicKey?: string | null }
      if (data.configured && data.publicKey) {
        setPublicKey(data.publicKey)
        setStatus('VAPID: OK')
      } else {
        setPublicKey(null)
        setStatus('Нет ключей VAPID на сервере (.env)')
      }
    } catch {
      setStatus('Не удалось загрузить /api/push/status')
    }
  }, [])

  useEffect(() => {
    if (!visible) return
    void refreshStatus()
  }, [visible, refreshStatus])

  useEffect(() => {
    if (!visible || typeof window === 'undefined' || !('serviceWorker' in navigator)) return
    navigator.serviceWorker.ready.then((reg) => {
      if (!reg.pushManager) return
      reg.pushManager.getSubscription().then((sub) => {
        setSubscribed(Boolean(sub))
      })
    })
  }, [visible, status])

  const registerSw = async (): Promise<ServiceWorkerRegistration | null> => {
    if (!('serviceWorker' in navigator)) {
      setStatus('Service Worker не поддерживается')
      return null
    }
    const reg = await navigator.serviceWorker.register(SW_URL, { scope: '/' })
    await navigator.serviceWorker.ready
    return reg
  }

  const subscribe = async () => {
    if (!publicKey) {
      setStatus('Сначала добавьте VAPID в .env и перезапустите dev')
      return
    }
    try {
      const reg = await registerSw()
      if (!reg?.pushManager) {
        setStatus('Push Manager недоступен')
        return
      }
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') {
        setStatus('Разрешение на уведомления не выдано')
        return
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })
      const json = sub.toJSON()
      if (!json.keys) {
        setStatus('Ошибка: нет ключей подписки')
        return
      }
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: {
            endpoint: json.endpoint!,
            expirationTime: json.expirationTime ?? null,
            keys: {
              p256dh: json.keys.p256dh,
              auth: json.keys.auth,
            },
          },
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setStatus(`Подписка не сохранена: ${(err as { error?: string }).error || res.status}`)
        return
      }
      setSubscribed(true)
      setStatus('Подписка сохранена на сервере')
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Ошибка подписки')
    }
  }

  const sendTest = async () => {
    if (!sendSecret.trim()) {
      setStatus('Введите PUSH_SEND_SECRET')
      return
    }
    try {
      const res = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: sendSecret.trim(),
          title: 'VK Bouwmaster',
          body: 'Test push — оки.',
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setStatus(`Send: ${(data as { error?: string }).error || res.status}`)
        return
      }
      setStatus(
        `Отправлено: ${(data as { sent?: number }).sent ?? 0}, ошибок: ${(data as { failed?: number }).failed ?? 0}`
      )
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Ошибка отправки')
    }
  }

  const unsubscribe = async () => {
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager?.getSubscription()
      if (sub) {
        await sub.unsubscribe()
      }
      setSubscribed(false)
      setStatus('Локальная подписка отключена (запись на сервере может остаться)')
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Ошибка')
    }
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-4 right-4 z-[200] max-w-sm rounded-lg border border-cyan-500/30 bg-zinc-950/95 p-3 text-xs text-zinc-200 shadow-xl backdrop-blur">
      <div className="mb-2 font-semibold text-cyan-300">Push (тест)</div>
      <p className="mb-2 text-[11px] leading-snug text-zinc-400">
        Только dev или{' '}
        <code className="rounded bg-zinc-800 px-1">NEXT_PUBLIC_ENABLE_PUSH_UI=1</code>. HTTPS или localhost.
      </p>
      <div className="mb-2 text-[11px] text-zinc-300">{status}</div>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => void subscribe()}
          disabled={!publicKey}
          className="rounded bg-cyan-600 px-2 py-1.5 text-white hover:bg-cyan-500 disabled:opacity-40"
        >
          {subscribed ? 'Обновить подписку' : 'Включить уведомления'}
        </button>
        <button
          type="button"
          onClick={() => void unsubscribe()}
          className="rounded border border-zinc-600 px-2 py-1 text-zinc-300 hover:bg-zinc-800"
        >
          Отписаться (локально)
        </button>
        <input
          type="password"
          placeholder="PUSH_SEND_SECRET"
          value={sendSecret}
          onChange={(e) => setSendSecret(e.target.value)}
          className="rounded border border-zinc-600 bg-zinc-900 px-2 py-1 text-zinc-200"
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => void sendTest()}
          className="rounded bg-zinc-700 px-2 py-1.5 text-white hover:bg-zinc-600"
        >
          Отправить тест с сервера
        </button>
      </div>
    </div>
  )
}
