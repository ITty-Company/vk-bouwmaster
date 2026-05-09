/* eslint-disable no-restricted-globals */
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  let payload = { title: 'VK Bouwmaster', body: 'Bericht' }
  try {
    if (event.data) {
      const parsed = event.data.json()
      if (parsed && typeof parsed === 'object') {
        payload = {
          title: typeof parsed.title === 'string' ? parsed.title : payload.title,
          body: typeof parsed.body === 'string' ? parsed.body : payload.body,
        }
      }
    }
  } catch {
    try {
      const t = event.data && event.data.text()
      if (t) payload.body = t
    } catch {
      /* ignore */
    }
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icon-3.png',
      badge: '/icon-3.png',
      vibrate: [120, 80, 120],
      tag: 'vk-bouwmaster-push',
      renotify: true,
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        const c = clientList[0]
        if ('focus' in c) return c.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow('/')
    })
  )
})
