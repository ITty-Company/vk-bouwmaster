import { translateText, detectSourceLanguage } from '@/lib/translate'
import type { Language } from '@/lib/translations'

/** Legacy / alternate keys merged into canonical `Language` codes for lookups + API repair. */
const COMMENT_TRANSLATION_KEY_ALIASES: Partial<Record<string, Language>> = {
  uk: 'UA',
  ua: 'UA',
  cz: 'CZ',
  gb: 'EN',
  el: 'GR',
}

/** Normalize stored translation maps (fixes uk→UA etc.). Drops empty strings. */
export function normalizeCommentTranslationKeys(
  raw?: Record<string, string>
): Record<string, string> | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v !== 'string') continue
    const trimmed = v.trim()
    if (!trimmed) continue
    const alias = COMMENT_TRANSLATION_KEY_ALIASES[k.toLowerCase()]
    const canonical = (alias ?? k.toUpperCase()) as Language
    if (COMMENT_TRANSLATION_LANGS.includes(canonical)) {
      out[canonical] = trimmed
    } else {
      out[k] = trimmed
    }
  }
  return Object.keys(out).length ? out : undefined
}

/** Languages stored with each review/comment (same as TRANSLATION_LANGUAGE_KEYS). */
export const COMMENT_TRANSLATION_LANGS: Language[] = [
  'RU',
  'EN',
  'NL',
  'DE',
  'FR',
  'ES',
  'IT',
  'PT',
  'PL',
  'CZ',
  'HU',
  'RO',
  'BG',
  'HR',
  'SK',
  'SL',
  'ET',
  'LV',
  'LT',
  'FI',
  'SV',
  'DA',
  'NO',
  'GR',
  'UA',
]

/** Map ISO codes from detectSourceLanguage → site Language keys (never default to RU). */
const ISO_TO_LANGUAGE: Record<string, Language> = {
  ru: 'RU',
  uk: 'UA',
  nl: 'NL',
  en: 'EN',
  de: 'DE',
  fr: 'FR',
  es: 'ES',
  it: 'IT',
}

export function sourceLangCodeFromMessage(message: string): Language {
  const iso = detectSourceLanguage(message)
  return ISO_TO_LANGUAGE[iso] ?? 'EN'
}

export function commentTranslationsComplete(t?: Record<string, string>): boolean {
  const n = normalizeCommentTranslationKeys(t)
  if (!n) return false
  return COMMENT_TRANSLATION_LANGS.every(
    (lang) => typeof n[lang] === 'string' && n[lang].trim().length > 0
  )
}

/** Fill only missing/empty languages — faster repair on GET and after approval. */
export async function fillMissingCommentTranslations(
  message: string,
  existing?: Record<string, string>
): Promise<Record<string, string>> {
  const normalized = normalizeCommentTranslationKeys(existing) ?? {}
  const sourceLangCode = sourceLangCodeFromMessage(message)
  const sourceLang = detectSourceLanguage(message)
  const translations: Record<string, string> = {
    ...normalized,
    [sourceLangCode]: message,
  }

  for (const lang of COMMENT_TRANSLATION_LANGS) {
    const cur = translations[lang]?.trim()
    if (cur) continue
    try {
      translations[lang] = await translateText(message, lang, sourceLang)
      await new Promise((resolve) => setTimeout(resolve, 50))
    } catch (error) {
      console.error(`Error translating comment to ${lang}:`, error)
      translations[lang] = message
    }
  }
  return translations
}

/** Full map — used after admin approval or when editing message (and optional GET repair). */
export async function buildCommentTranslationsForAllLanguages(
  message: string
): Promise<Record<string, string>> {
  const sourceLang = detectSourceLanguage(message)
  const sourceLangCode = sourceLangCodeFromMessage(message)
  const translations: Record<string, string> = { [sourceLangCode]: message }

  for (const lang of COMMENT_TRANSLATION_LANGS) {
    if (lang === sourceLangCode) continue
    try {
      translations[lang] = await translateText(message, lang, sourceLang)
      await new Promise((resolve) => setTimeout(resolve, 50))
    } catch (error) {
      console.error(`Error translating comment to ${lang}:`, error)
      translations[lang] = message
    }
  }
  return translations
}
