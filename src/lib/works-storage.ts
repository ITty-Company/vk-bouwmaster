import { readFileSync, writeFileSync, existsSync } from 'fs'
import { ensureDirForFile, worksRuntimeFile, worksSeedFile } from '@/lib/data-file-paths'

export interface WorkTranslations {
  title: string
  description: string
  category: string
  city?: string
}

export interface PortfolioWork {
  id: string
  title: string
  description: string
  mainImage: string
  category: string
  projectId?: string
  images?: string[]
  videos?: string[]
  workDate?: string
  city?: string
  translations?: Record<string, WorkTranslations>
  _translationSourceFingerprint?: string
}

export type WorksRuntimeState = {
  version: 1
  removedSeedIds: string[]
  entries: PortfolioWork[]
}

function emptyRuntime(): WorksRuntimeState {
  return { version: 1, removedSeedIds: [], entries: [] }
}

function stableJson(obj: unknown): string {
  const sort = (v: unknown): unknown => {
    if (v === null || typeof v !== 'object') return v
    if (Array.isArray(v)) return v.map(sort)
    const o = v as Record<string, unknown>
    const out: Record<string, unknown> = {}
    for (const k of Object.keys(o).sort()) {
      out[k] = sort(o[k])
    }
    return out
  }
  return JSON.stringify(sort(obj))
}

function worksEqual(seed: PortfolioWork, current: PortfolioWork): boolean {
  return stableJson(seed) === stableJson(current)
}

export function loadSeedWorks(): PortfolioWork[] {
  const seedPath = worksSeedFile()
  try {
    if (!existsSync(seedPath)) return []
    const data = JSON.parse(readFileSync(seedPath, 'utf-8'))
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

/** Legacy disk file was a plain array (full or partial snapshot). Convert to overlay + removals. */
function migrateLegacyWorksArray(legacy: PortfolioWork[]): WorksRuntimeState {
  const seed = loadSeedWorks()
  const seedMap = new Map(seed.map((s) => [s.id, s]))
  const mergedIds = new Set(legacy.map((w) => w.id))
  const removedSeedIds = seed.filter((s) => !mergedIds.has(s.id)).map((s) => s.id)

  const entries: PortfolioWork[] = []
  for (const row of legacy) {
    const s = seedMap.get(row.id)
    if (!s) {
      entries.push(row)
      continue
    }
    if (!worksEqual(s, row)) entries.push(row)
  }

  return { version: 1, removedSeedIds, entries }
}

function persistStateOnly(state: WorksRuntimeState): void {
  const runtimePath = worksRuntimeFile()
  ensureDirForFile(runtimePath)
  writeFileSync(runtimePath, JSON.stringify(state, null, 2), 'utf-8')
}

export function loadRuntimeWorksState(): WorksRuntimeState {
  const runtimePath = worksRuntimeFile()
  try {
    if (!existsSync(runtimePath)) return emptyRuntime()
    const content = readFileSync(runtimePath, 'utf-8')
    const parsed: unknown = JSON.parse(content)
    if (Array.isArray(parsed)) {
      const legacy = parsed as PortfolioWork[]
      // Пустой массив на диске не означает «удалить все сиды» — трактуем как отсутствие overlay.
      if (legacy.length === 0) {
        const state = emptyRuntime()
        try {
          persistStateOnly(state)
        } catch {
          /* ignore */
        }
        return state
      }
      const state = migrateLegacyWorksArray(legacy)
      try {
        persistStateOnly(state)
      } catch {
        /* ignore */
      }
      return state
    }
    if (
      parsed &&
      typeof parsed === 'object' &&
      (parsed as WorksRuntimeState).version === 1
    ) {
      const p = parsed as WorksRuntimeState
      return {
        version: 1,
        removedSeedIds: Array.isArray(p.removedSeedIds) ? p.removedSeedIds : [],
        entries: Array.isArray(p.entries) ? p.entries : [],
      }
    }
  } catch {
    /* ignore */
  }
  return emptyRuntime()
}

/** Repo seed + disk overlay — новые работы из Git появляются после деплоя даже если на диске старый snapshot. */
export function mergeWorks(seed: PortfolioWork[], state: WorksRuntimeState): PortfolioWork[] {
  const removed = new Set(state.removedSeedIds)
  const map = new Map<string, PortfolioWork>()
  for (const s of seed) {
    if (!removed.has(s.id)) map.set(s.id, s)
  }
  for (const e of state.entries) {
    map.set(e.id, e)
  }
  return [...map.values()]
}

/** Раскодирует случайно записанный URL-encoding в строках (ошибка копирования / двойное кодирование). */
const PCT_SEQ = /%[0-9A-Fa-f]{2}/g

function tryDecodeAccidentalPercentEncoding(s: string): string {
  if (!s || typeof s !== 'string') return s
  const hits = s.match(PCT_SEQ)
  if (!hits || hits.length < 3) return s
  let out = s
  for (let pass = 0; pass < 2; pass++) {
    if (!/%[0-9A-Fa-f]{2}/.test(out)) break
    try {
      const next = decodeURIComponent(out.replace(/\+/g, ' '))
      if (next === out) break
      out = next
    } catch {
      break
    }
  }
  return out
}

function sanitizeTranslationBlock(t: WorkTranslations): WorkTranslations {
  return {
    title: tryDecodeAccidentalPercentEncoding(t.title),
    description: tryDecodeAccidentalPercentEncoding(t.description),
    category: tryDecodeAccidentalPercentEncoding(t.category),
    city: t.city !== undefined ? tryDecodeAccidentalPercentEncoding(t.city) : undefined,
  }
}

function sanitizePortfolioWork(work: PortfolioWork): PortfolioWork {
  const translations = work.translations
    ? Object.fromEntries(
        Object.entries(work.translations).map(([lang, block]) => [lang, sanitizeTranslationBlock(block)])
      )
    : undefined
  return {
    ...work,
    title: tryDecodeAccidentalPercentEncoding(work.title),
    description: tryDecodeAccidentalPercentEncoding(work.description),
    category: tryDecodeAccidentalPercentEncoding(work.category),
    city: work.city !== undefined ? tryDecodeAccidentalPercentEncoding(work.city) : undefined,
    translations,
  }
}

export function readMergedWorks(): PortfolioWork[] {
  const seed = loadSeedWorks()
  const state = loadRuntimeWorksState()
  const merged = mergeWorks(seed, state)
  return merged.map(sanitizePortfolioWork)
}

export type PersistWorksMergedOptions = {
  deletedSeedId?: string
  removedSeedIdsOverride?: string[]
}

function persistMergedToDisk(merged: PortfolioWork[], options?: PersistWorksMergedOptions): void {
  const seed = loadSeedWorks()
  const seedMap = new Map(seed.map((s) => [s.id, s]))
  const prev = loadRuntimeWorksState()

  let removedSeedIds: string[]
  if (options?.removedSeedIdsOverride) {
    removedSeedIds = options.removedSeedIdsOverride.filter((id) => seedMap.has(id))
  } else {
    removedSeedIds = (prev.removedSeedIds || []).filter((id) => seedMap.has(id))
    const del = options?.deletedSeedId?.trim()
    if (del && seedMap.has(del)) {
      removedSeedIds = [...new Set([...removedSeedIds, del])]
    }
  }

  const entries: PortfolioWork[] = []
  for (const m of merged) {
    const s = seedMap.get(m.id)
    if (!s) {
      entries.push(m)
      continue
    }
    if (!worksEqual(s, m)) entries.push(m)
  }

  const state: WorksRuntimeState = {
    version: 1,
    removedSeedIds,
    entries,
  }
  persistStateOnly(state)
}

export function persistMergedWorks(merged: PortfolioWork[], options?: PersistWorksMergedOptions): void {
  persistMergedToDisk(merged, options)
}

export function resetWorkSeedRemovals(): void {
  const seed = loadSeedWorks()
  const state = loadRuntimeWorksState()
  const merged = mergeWorks(seed, { ...state, removedSeedIds: [] })
  persistMergedToDisk(merged, { removedSeedIdsOverride: [] })
}
