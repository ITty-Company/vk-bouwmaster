/**
 * После действий в админке открытые страницы подтягивают данные без долгого ожидания.
 * Один канал для отзывов и работ (портфолио подписано на тот же refresh).
 */

const CHANNEL = 'vk-bouwmaster-sync-v1'
const LS_BUMP_KEY = 'vk-site-data-bump'

/** Уведомить все подписанные вкладки (отзывы + работы). */
export function notifySiteDataChanged(): void {
  if (typeof window === 'undefined') return
  try {
    const bc = new BroadcastChannel(CHANNEL)
    bc.postMessage({ type: 'site-data-changed', at: Date.now() })
    bc.close()
  } catch {
    /* ignore */
  }
  try {
    localStorage.setItem(LS_BUMP_KEY, String(Date.now()))
  } catch {
    /* ignore */
  }
}

export const notifyCommentsChanged = notifySiteDataChanged
export const notifyWorksChanged = notifySiteDataChanged

/** Подписка на обновления (верни unsubscribe). Безопасно на SSR — вернёт no-op. */
export function subscribeCommentsRefresh(onRefresh: () => void): () => void {
  if (typeof window === 'undefined') return () => {}

  let bc: BroadcastChannel | null = null
  try {
    bc = new BroadcastChannel(CHANNEL)
    bc.onmessage = () => onRefresh()
  } catch {
    /* ignore */
  }

  const onStorage = (e: StorageEvent) => {
    if (e.key === LS_BUMP_KEY) onRefresh()
  }
  window.addEventListener('storage', onStorage)

  return () => {
    try {
      bc?.close()
    } catch {
      /* ignore */
    }
    window.removeEventListener('storage', onStorage)
  }
}
