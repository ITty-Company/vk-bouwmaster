/**
 * Уведомления в Telegram-группу: заявки с формы, новые работы, новые отзывы.
 *
 * Переменные окружения (Render / .env.local):
 * - TELEGRAM_BOT_TOKEN — токен от @BotFather
 * - TELEGRAM_CHAT_ID — id группы (обычно отрицательный, для супергрупп вида -100…)
 *   Можно несколько id через запятую.
 */

import { existsSync, readFileSync, statSync } from 'fs'
import { basename, join } from 'path'
import { uploadStorageDir } from '@/lib/data-file-paths'

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
  photos?: string[]
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
  photos?: string[]
  videos?: string[]
  profileImage?: string
}

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

const TELEGRAM_MAX = 4096
const MAX_PHOTO_BYTES = 10 * 1024 * 1024
const MAX_ALBUM = 10

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

function joinMessage(lines: string[]): string {
  let text = lines.join('\n').trim()
  if (text.length > TELEGRAM_MAX) {
    text = `${text.slice(0, TELEGRAM_MAX - 1)}…`
  }
  return text
}

async function sendTelegramHtml(text: string, logLabel: string): Promise<boolean> {
  const cfg = telegramConfig()
  if (!cfg) return false

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
            text,
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

function uniqueUrls(urls: Array<string | undefined | null>): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of urls) {
    const u = String(raw || '').trim()
    if (!u || seen.has(u)) continue
    seen.add(u)
    out.push(u)
  }
  return out
}

function looksLikeImage(url: string): boolean {
  const p = url.split('?')[0].toLowerCase()
  if (!p) return false
  if (p.includes('vk-bouwmaster-logo')) return false
  if (/\.(mp4|mov|webm|avi|mkv|svg)$/i.test(p)) return false
  return true
}

function looksLikeVideo(url: string): boolean {
  return /\.(mp4|mov|webm|avi|mkv)$/i.test(url.split('?')[0].toLowerCase())
}

function mimeFromName(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase()
  if (ext === 'png') return 'image/png'
  if (ext === 'gif') return 'image/gif'
  if (ext === 'webp') return 'image/webp'
  return 'image/jpeg'
}

function toAbsoluteUrl(url: string, siteUrl?: string | null): string | null {
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  const site = siteUrl?.replace(/\/$/, '').trim()
  if (!site) return null
  const path = url.startsWith('/') ? url : `/${url}`
  return `${site}${path}`
}

type ResolvedPhoto =
  | { kind: 'file'; path: string; filename: string }
  | { kind: 'url'; url: string }

function resolvePhoto(src: string, siteUrl?: string | null): ResolvedPhoto | null {
  if (!looksLikeImage(src)) return null

  const name = basename(src.split('?')[0])
  if (name) {
    try {
      const full = join(uploadStorageDir(), name)
      if (existsSync(full)) {
        const size = statSync(full).size
        if (size > 0 && size <= MAX_PHOTO_BYTES) {
          return { kind: 'file', path: full, filename: name }
        }
      }
    } catch {
      // fall through to URL
    }
  }

  const abs = toAbsoluteUrl(src, siteUrl)
  if (abs) return { kind: 'url', url: abs }
  return null
}

function fileBlob(path: string, filename: string): Blob {
  const buf = readFileSync(path)
  return new Blob([new Uint8Array(buf)], { type: mimeFromName(filename) })
}

async function sendAlbumToChat(
  token: string,
  chat_id: string,
  photos: ResolvedPhoto[],
  logLabel: string
): Promise<boolean> {
  const album = photos.slice(0, MAX_ALBUM)
  const needsMultipart = album.some((p) => p.kind === 'file')

  if (album.length === 1) {
    const photo = album[0]
    const url = `https://api.telegram.org/bot${token}/sendPhoto`
    try {
      let res: Response
      if (photo.kind === 'file') {
        const form = new FormData()
        form.append('chat_id', chat_id)
        form.append('photo', fileBlob(photo.path, photo.filename), photo.filename)
        res = await fetch(url, { method: 'POST', body: form })
      } else {
        res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id, photo: photo.url }),
        })
      }
      if (!res.ok) {
        console.error(`[${logLabel}] sendPhoto failed:`, chat_id, res.status, await res.text().catch(() => ''))
        return false
      }
      return true
    } catch (e) {
      console.error(`[${logLabel}] sendPhoto error:`, chat_id, e)
      return false
    }
  }

  const media = album.map((photo, i) => {
    if (photo.kind === 'file') {
      return { type: 'photo', media: `attach://photo${i}` }
    }
    return { type: 'photo', media: photo.url }
  })

  const url = `https://api.telegram.org/bot${token}/sendMediaGroup`
  try {
    let res: Response
    if (needsMultipart) {
      const form = new FormData()
      form.append('chat_id', chat_id)
      form.append('media', JSON.stringify(media))
      album.forEach((photo, i) => {
        if (photo.kind === 'file') {
          form.append(`photo${i}`, fileBlob(photo.path, photo.filename), photo.filename)
        }
      })
      res = await fetch(url, { method: 'POST', body: form })
    } else {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id, media }),
      })
    }
    if (!res.ok) {
      console.error(`[${logLabel}] sendMediaGroup failed:`, chat_id, res.status, await res.text().catch(() => ''))
      return false
    }
    return true
  } catch (e) {
    console.error(`[${logLabel}] sendMediaGroup error:`, chat_id, e)
    return false
  }
}

async function sendTelegramPhotos(
  photoUrls: string[] | undefined,
  options: { siteUrl?: string | null; logLabel: string }
): Promise<void> {
  const cfg = telegramConfig()
  if (!cfg) return

  const photos = uniqueUrls(photoUrls)
    .map((src) => resolvePhoto(src, options.siteUrl))
    .filter((p): p is ResolvedPhoto => p != null)
    .slice(0, MAX_ALBUM)

  if (photos.length === 0) return

  await Promise.all(
    cfg.chatIds.map(async (chat_id) => {
      const ok = await sendAlbumToChat(cfg.token, chat_id, photos, options.logLabel)
      if (ok) {
        console.log(`[${options.logLabel}] Фото отправлены в Telegram (${photos.length}).`)
      }
    })
  )
}

function photoLinkLines(urls: string[] | undefined, siteUrl?: string | null): string[] {
  const abs = uniqueUrls(urls)
    .filter(looksLikeImage)
    .map((u) => toAbsoluteUrl(u, siteUrl))
    .filter((u): u is string => Boolean(u))
  if (abs.length === 0) return []
  return ['', `<b>Фото (${abs.length}):</b>`, ...abs.map((u) => escapeHtml(u))]
}

function videoLinkLines(urls: string[] | undefined, siteUrl?: string | null): string[] {
  const abs = uniqueUrls(urls)
    .filter(looksLikeVideo)
    .map((u) => toAbsoluteUrl(u, siteUrl))
    .filter((u): u is string => Boolean(u))
  if (abs.length === 0) return []
  return ['', `<b>Видео (${abs.length}):</b>`, ...abs.map((u) => escapeHtml(u))]
}

export async function notifyTelegramContactMessage(
  message: TelegramContactPayload,
  options?: { siteUrl?: string | null }
): Promise<boolean> {
  const lines: string[] = ['<b>Новая заявка</b>', '', escapeHtml(message.message), '', '<b>Контакты</b>']
  lines.push(`Имя: ${escapeHtml(message.name)}`)
  if (message.phone) lines.push(`Телефон: ${escapeHtml(message.phone)}`)
  lines.push(`Email: ${escapeHtml(message.email)}`)
  const address = [
    message.street,
    message.houseNumber,
    message.postalCode,
    message.city,
  ]
    .filter(Boolean)
    .join(', ')
  if (address) lines.push(`Адрес: ${escapeHtml(address)}`)
  if (message.service) lines.push(`Услуга: ${escapeHtml(message.service)}`)

  const ok = await sendTelegramHtml(joinMessage(lines), 'contact→telegram')
  return ok
}

export async function notifyTelegramNewWork(
  work: TelegramWorkPayload,
  options?: { siteUrl?: string | null }
): Promise<boolean> {
  const lines: string[] = ['<b>Добавлена новая работа на сайт</b>', '', escapeHtml(work.title)]
  if (work.description?.trim()) {
    lines.push('')
    lines.push(escapeHtml(work.description.trim()))
  }
  lines.push('')
  if (work.category) lines.push(`Категория: ${escapeHtml(work.category)}`)
  if (work.city) lines.push(`Город: ${escapeHtml(work.city)}`)
  if (work.workDate) lines.push(`Дата: ${escapeHtml(work.workDate)}`)

  const site = options?.siteUrl?.trim()
  if (site && work.projectId) {
    lines.push(`Страница: ${escapeHtml(`${site}/portfolio/${work.projectId}`)}`)
  }

  lines.push(...photoLinkLines(work.photos, options?.siteUrl))

  const ok = await sendTelegramHtml(joinMessage(lines), 'work→telegram')
  await sendTelegramPhotos(work.photos, { siteUrl: options?.siteUrl, logLabel: 'work→telegram' })
  return ok
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
  const fullName = [comment.name, comment.surname].filter(Boolean).join(' ')
  const stars = ratingStars(comment.rating)
  const photos = uniqueUrls([comment.profileImage, ...(comment.photos || [])]).filter(looksLikeImage)

  const lines: string[] = ['<b>Новый отзыв</b>', '', escapeHtml(comment.message), '']
  if (fullName) lines.push(`Имя: ${escapeHtml(fullName)}`)
  if (stars) lines.push(`Оценка: ${stars}`)
  if (comment.city) lines.push(`Город: ${escapeHtml(comment.city)}`)

  const site = options?.siteUrl?.trim()
  if (site) {
    lines.push(`Страница: ${escapeHtml(`${site}/reviews/${comment.id}`)}`)
  }

  lines.push(...photoLinkLines(photos, options?.siteUrl))
  lines.push(...videoLinkLines(comment.videos, options?.siteUrl))

  const ok = await sendTelegramHtml(joinMessage(lines), 'comment→telegram')
  await sendTelegramPhotos(photos, { siteUrl: options?.siteUrl, logLabel: 'comment→telegram' })
  return ok
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
