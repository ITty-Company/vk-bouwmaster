/**
 * Уведомления в Telegram-группу: заявки с формы, новые работы, новые отзывы.
 *
 * Переменные окружения (Render / .env.local):
 * - TELEGRAM_BOT_TOKEN — токен от @BotFather
 * - TELEGRAM_CHAT_ID — id группы (обычно отрицательный, для супергрупп вида -100…)
 *   Можно несколько id через запятую.
 *
 * Как подключить группу:
 * 1. Создайте бота через @BotFather и скопируйте token.
 * 2. Создайте группу в Telegram, добавьте туда людей и этого бота.
 * 3. Напишите в группе любое сообщение (чтобы бот увидел чат).
 * 4. Откройте https://api.telegram.org/bot<TOKEN>/getUpdates
 *    и найдите "chat":{"id": -100…, "title": "…", "type": "supergroup"}
 *    или используйте @userinfobot / @getidsbot в группе.
 * 5. Задайте TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID на сервере.
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

export type TelegramWorkPayload = {
  id: string
  title: string
  description?: string
  category: string
  city?: string
  projectId?: string
  workDate?: string
  imagesCount?: number
}

export type TelegramCommentPayload = {
  id: string
  name: string
  surname?: string
  message: string
  createdAt: string
  projectId?: string
  city?: string
  rating?: number
  photosCount?: number
}

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

const TELEGRAM_MAX = 4096

function telegramConfig(): { token: string; chatIds: string[] } | null {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim()
  const chatRaw = process.env.TELEGRAM_CHAT_ID?.trim()

  if (!token || !chatRaw) {
    console.warn(
      '[telegram] Задайте TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID — уведомление не отправлено.'
    )
    return null
  }

  const chatIds = [...new Set(chatRaw.split(',').map((s) => s.trim()).filter(Boolean))]
  if (chatIds.length === 0) return null
  return { token, chatIds }
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return `${text.slice(0, max)}…`
}

async function sendTelegramHtml(
  text: string,
  logLabel: string
): Promise<boolean> {
  const cfg = telegramConfig()
  if (!cfg) return false

  let body = text
  if (body.length > TELEGRAM_MAX) {
    body = `${body.slice(0, TELEGRAM_MAX - 1)}…`
  }

  const url = `https://api.telegram.org/bot${cfg.token}/sendMessage`
  let okAny = false

  await Promise.all(
    cfg.chatIds.map(async (chat_id) => {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id,
            text: body,
            parse_mode: 'HTML',
            disable_web_page_preview: true,
          }),
        })
        if (!res.ok) {
          const err = await res.text().catch(() => '')
          console.error(`[${logLabel}] sendMessage failed:`, chat_id, res.status, err)
          return
        }
        okAny = true
      } catch (e) {
        console.error(`[${logLabel}] sendMessage error:`, chat_id, e)
      }
    })
  )

  if (okAny) {
    console.log(`[${logLabel}] Уведомление отправлено в Telegram.`)
  }
  return okAny
}

function siteLine(siteUrl?: string | null): string | null {
  const site = siteUrl?.trim()
  return site ? `<b>Сайт:</b> ${escapeHtml(site)}` : null
}

/** Отправляет HTML-сообщение во все указанные chat_id. */
export async function notifyTelegramContactMessage(
  message: TelegramContactPayload,
  options?: { siteUrl?: string | null }
): Promise<boolean> {
  const created = new Date(message.createdAt)
  const bodyPlain = truncate(message.message, 2800)

  const lines: string[] = [
    '<b>📩 Новая заявка VK Bouwmaster</b>',
    '',
    `<b>Имя:</b> ${escapeHtml(message.name)}`,
    `<b>Email:</b> ${escapeHtml(message.email)}`,
  ]
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
  const site = siteLine(options?.siteUrl)
  if (site) lines.push(site)

  return sendTelegramHtml(lines.join('\n'), 'contact→telegram')
}

export async function notifyTelegramNewWork(
  work: TelegramWorkPayload,
  options?: { siteUrl?: string | null }
): Promise<boolean> {
  const desc = work.description?.trim()
    ? truncate(work.description.trim(), 1800)
    : ''

  const lines: string[] = [
    '<b>🛠 Новая работа на сайте VK Bouwmaster</b>',
    '',
    `<b>Название:</b> ${escapeHtml(work.title)}`,
    `<b>Категория:</b> ${escapeHtml(work.category)}`,
  ]
  if (work.city) lines.push(`<b>Город:</b> ${escapeHtml(work.city)}`)
  if (work.workDate) lines.push(`<b>Дата работы:</b> ${escapeHtml(work.workDate)}`)
  if (typeof work.imagesCount === 'number') {
    lines.push(`<b>Фото:</b> ${work.imagesCount}`)
  }
  if (desc) {
    lines.push('')
    lines.push('<b>Описание:</b>')
    lines.push(escapeHtml(desc))
  }
  lines.push('')
  lines.push(`<b>ID:</b> ${escapeHtml(work.id)}`)

  const site = options?.siteUrl?.trim()
  if (site && work.projectId) {
    lines.push(`<b>Страница:</b> ${escapeHtml(`${site}/portfolio/${work.projectId}`)}`)
  } else if (site) {
    lines.push(`<b>Сайт:</b> ${escapeHtml(site)}`)
  }

  return sendTelegramHtml(lines.join('\n'), 'work→telegram')
}

function ratingStars(rating?: number): string | null {
  if (rating == null || Number.isNaN(rating)) return null
  const n = Math.max(1, Math.min(5, Math.round(rating)))
  return `${'★'.repeat(n)}${'☆'.repeat(5 - n)} (${n}/5)`
}

export async function notifyTelegramNewComment(
  comment: TelegramCommentPayload,
  options?: { siteUrl?: string | null }
): Promise<boolean> {
  const created = new Date(comment.createdAt)
  const fullName = [comment.name, comment.surname].filter(Boolean).join(' ')
  const bodyPlain = truncate(comment.message, 2800)
  const stars = ratingStars(comment.rating)

  const lines: string[] = [
    '<b>⭐ Новый отзыв на сайте VK Bouwmaster</b>',
    '',
    `<b>Автор:</b> ${escapeHtml(fullName)}`,
  ]
  if (stars) lines.push(`<b>Оценка:</b> ${stars}`)
  if (comment.city) lines.push(`<b>Город:</b> ${escapeHtml(comment.city)}`)
  if (comment.projectId && comment.projectId !== 'general') {
    lines.push(`<b>Проект:</b> ${escapeHtml(comment.projectId)}`)
  }
  if (typeof comment.photosCount === 'number' && comment.photosCount > 0) {
    lines.push(`<b>Фото к отзыву:</b> ${comment.photosCount}`)
  }
  lines.push('')
  lines.push('<b>Текст отзыва:</b>')
  lines.push(escapeHtml(bodyPlain))
  lines.push('')
  lines.push(`<b>ID:</b> ${escapeHtml(comment.id)}`)
  lines.push(`<b>Дата:</b> ${escapeHtml(created.toLocaleString('ru-RU'))}`)

  const site = options?.siteUrl?.trim()
  if (site) {
    lines.push(`<b>Страница:</b> ${escapeHtml(`${site}/reviews/${comment.id}`)}`)
  }

  return sendTelegramHtml(lines.join('\n'), 'comment→telegram')
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
