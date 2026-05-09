/**
 * Уведомления о новых заявках с формы контактов в Telegram.
 *
 * Переменные окружения (Render / .env.local):
 * - TELEGRAM_BOT_TOKEN — токен от @BotFather
 * - TELEGRAM_CHAT_ID — ваш chat id (число), можно несколько через запятую
 *
 * Как узнать chat_id: напишите боту любое сообщение, затем откройте в браузере
 * https://api.telegram.org/bot<TOKEN>/getUpdates и найдите "chat":{"id": ...}
 * или используйте @userinfobot / @getidsbot.
 */

export type TelegramContactPayload = {
  id: string
  name: string
  email: string
  phone?: string
  street: string
  houseNumber: string
  postalCode: string
  city?: string
  service?: string
  message: string
  createdAt: string
}

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

const TELEGRAM_MAX = 4096

/** Отправляет HTML-сообщение во все указанные chat_id. */
export async function notifyTelegramContactMessage(
  message: TelegramContactPayload,
  options?: { siteUrl?: string | null }
): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim()
  const chatRaw = process.env.TELEGRAM_CHAT_ID?.trim()

  if (!token || !chatRaw) {
    console.warn(
      '[contact→telegram] Задайте TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID — уведомление не отправлено.'
    )
    return false
  }

  const chatIds = [...new Set(chatRaw.split(',').map((s) => s.trim()).filter(Boolean))]
  if (chatIds.length === 0) return false

  const created = new Date(message.createdAt)
  let bodyPlain = message.message
  if (bodyPlain.length > 2800) {
    bodyPlain = `${bodyPlain.slice(0, 2800)}…`
  }

  const lines: string[] = []
  lines.push('<b>📩 Новая заявка VK Bouwmaster</b>')
  lines.push('')
  lines.push(`<b>Имя:</b> ${escapeHtml(message.name)}`)
  lines.push(`<b>Email:</b> ${escapeHtml(message.email)}`)
  if (message.phone) lines.push(`<b>Телефон:</b> ${escapeHtml(message.phone)}`)
  lines.push('')
  lines.push('<b>Адрес:</b>')
  lines.push(`${escapeHtml(message.street)} ${escapeHtml(message.houseNumber)}`)
  lines.push(
    `${escapeHtml(message.postalCode)}${message.city ? `, ${escapeHtml(message.city)}` : ''}`
  )
  if (message.service) {
    lines.push('')
    lines.push(`<b>Услуга:</b> ${escapeHtml(message.service)}`)
  }
  lines.push('')
  lines.push('<b>Сообщение:</b>')
  lines.push(escapeHtml(bodyPlain))
  lines.push('')
  lines.push(`<b>ID:</b> ${escapeHtml(message.id)}`)
  lines.push(`<b>Дата:</b> ${escapeHtml(created.toLocaleString('ru-RU'))}`)
  const site = options?.siteUrl?.trim()
  if (site) lines.push(`<b>Сайт:</b> ${escapeHtml(site)}`)

  let text = lines.join('\n')
  if (text.length > TELEGRAM_MAX) {
    text = `${text.slice(0, TELEGRAM_MAX - 1)}…`
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`
  let okAny = false

  await Promise.all(
    chatIds.map(async (chat_id) => {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id,
            text,
            parse_mode: 'HTML',
            disable_web_page_preview: true,
          }),
        })
        if (!res.ok) {
          const err = await res.text().catch(() => '')
          console.error('[contact→telegram] sendMessage failed:', chat_id, res.status, err)
          return
        }
        okAny = true
      } catch (e) {
        console.error('[contact→telegram] sendMessage error:', chat_id, e)
      }
    })
  )

  if (okAny) {
    console.log('[contact→telegram] Уведомление отправлено в Telegram.')
  }
  return okAny
}

/** Публичный URL сайта для подписи в Telegram (без /api/...). */
export function publicSiteUrlFromRequest(request: Request): string | undefined {
  const h = request.headers
  const host = h.get('x-forwarded-host') || h.get('host')
  if (!host) return undefined
  let proto = h.get('x-forwarded-proto') || ''
  if (!proto) {
    proto = host.includes('localhost') ? 'http' : 'https'
  }
  return `${proto}://${host}`
}
