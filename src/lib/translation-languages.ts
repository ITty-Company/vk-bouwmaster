/**
 * Target languages stored next to source JSON (Russian canonical fields in seed files).
 * Must stay in sync with `Language` in translations.ts (excluding keys only used for UI if any).
 */
export const TRANSLATION_LANGUAGE_KEYS = [
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
] as const

export type TranslationLangKey = (typeof TRANSLATION_LANGUAGE_KEYS)[number]

export const TRANSLATION_LANGUAGE_COUNT = TRANSLATION_LANGUAGE_KEYS.length

/** GET handlers translate missing/stale content unless this is exactly `'false'`. */
export function autoTranslateOnFetch(): boolean {
  return process.env.AUTO_TRANSLATE_ON_FETCH !== 'false'
}
