import type { Language } from '@/lib/translations'
import { normalizeCommentTranslationKeys } from '@/lib/comment-translations'

/** If target language not ready yet, prefer another translated locale over raw source text. */
const DISPLAY_FALLBACK_CHAIN: Language[] = ['EN', 'NL', 'RU', 'UA', 'DE', 'FR']

export function getCommentDisplayMessage(
  comment: { message: string; translations?: Record<string, string> },
  lang: Language
): string {
  const t = normalizeCommentTranslationKeys(comment.translations)
  const direct = t?.[lang]?.trim()
  if (direct) return direct
  for (const fb of DISPLAY_FALLBACK_CHAIN) {
    if (fb === lang) continue
    const alt = t?.[fb]?.trim()
    if (alt) return alt
  }
  return comment.message
}
