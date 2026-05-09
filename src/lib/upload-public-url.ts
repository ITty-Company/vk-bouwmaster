/**
 * На Render загрузки отдаются через `/api/uploads/...`, а не как статика `public/uploads`.
 * В JSON часто остаётся префикс `/uploads/` — подстраховка на клиенте + для SSR.
 * Выставьте NEXT_PUBLIC_UPLOADS_VIA_API=true на проде (см. render.yaml).
 */
export function resolveUploadUrlForClient(url: string | undefined | null): string {
  if (!url || typeof url !== 'string') return ''
  const u = url.trim()
  if (
    typeof process !== 'undefined' &&
    process.env.NEXT_PUBLIC_UPLOADS_VIA_API === 'true' &&
    u.startsWith('/uploads/')
  ) {
    return `/api/uploads/${u.slice('/uploads/'.length)}`
  }
  return u
}

/** Next/Image: оптимизатор иногда конфликтует с динамической выдачей файлов с API. */
export function shouldUnoptimizeUploadImage(src: string): boolean {
  return src.startsWith('/api/uploads/') || src.startsWith('/uploads/')
}
