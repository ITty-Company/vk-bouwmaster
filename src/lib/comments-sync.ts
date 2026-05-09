/**
 * Синхронизация списка отзывов: после действий в админке публичные страницы подтягивают API без долгого ожидания.
 * — BroadcastChannel: сразу между вкладками одного браузера
 * — localStorage + storage: запасной канал для тех же вкладок в некоторых сценариях
 */

const CHANNEL = 'vk-bouwmaster-comments-v1'
const LS_BUMP_KEY = 'vk-comments-bump'

export function notifyCommentsChanged(): void {
  if (typeof window === 'undefined') return
  try {
    const bc = new BroadcastChannel(CHANNEL)
    bc.postMessage({ type: 'comments-changed', at: Date.now() })
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
