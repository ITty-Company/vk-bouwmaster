import { readFileSync, writeFileSync, existsSync } from 'fs'
import {
  commentsRuntimeFile,
  commentsSeedFile,
  ensureDirForFile,
} from '@/lib/data-file-paths'

export type StoredComment = {
  id: string
  projectId: string
  name: string
  surname?: string
  message: string
  createdAt: string
  approved: boolean
  photos?: string[]
  videos?: string[]
  rating?: number
  city?: string
  profileImage?: string
  translations?: Record<string, string>
}

export type CommentsRuntimeState = {
  version: 1
  removedSeedIds: string[]
  entries: StoredComment[]
}

function emptyRuntime(): CommentsRuntimeState {
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

function commentsEqual(seed: StoredComment, current: StoredComment): boolean {
  return stableJson(seed) === stableJson(current)
}

export function loadSeedComments(): StoredComment[] {
  const seedPath = commentsSeedFile()
  try {
    if (!existsSync(seedPath)) return []
    const data = JSON.parse(readFileSync(seedPath, 'utf-8'))
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

function parseRuntimeRaw(content: string): CommentsRuntimeState {
  try {
    const parsed: unknown = JSON.parse(content)
    if (Array.isArray(parsed)) {
      const legacy = parsed as StoredComment[]
      // Old deploys often stored a partial snapshot (e.g. only 2 rows). Those missing seed IDs were
      // NOT user deletions — inferring removedSeedIds here hid every other seeded review on the site.
      return { version: 1, removedSeedIds: [], entries: legacy }
    }
    if (
      parsed &&
      typeof parsed === 'object' &&
      (parsed as CommentsRuntimeState).version === 1
    ) {
      const p = parsed as CommentsRuntimeState
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

export function loadRuntimeState(): CommentsRuntimeState {
  const runtimePath = commentsRuntimeFile()
  try {
    if (!existsSync(runtimePath)) return emptyRuntime()
    const content = readFileSync(runtimePath, 'utf-8')
    return parseRuntimeRaw(content)
  } catch {
    return emptyRuntime()
  }
}

/** Seed from repo + overlay / tombstones on disk — new seed IDs from deploy appear automatically. */
export function mergeComments(seed: StoredComment[], state: CommentsRuntimeState): StoredComment[] {
  const removed = new Set(state.removedSeedIds)
  const map = new Map<string, StoredComment>()
  for (const s of seed) {
    if (!removed.has(s.id)) map.set(s.id, s)
  }
  for (const e of state.entries) {
    map.set(e.id, e)
  }
  return [...map.values()]
}

export function readMergedComments(): StoredComment[] {
  const seed = loadSeedComments()
  const state = loadRuntimeState()
  return mergeComments(seed, state)
}

export type PersistMergedOptions = {
  /** Seed id the user explicitly deleted in DELETE /api/comments — never infer “removed” from a partial merged list. */
  deletedSeedId?: string
  /** Replace removals entirely (e.g. recover from bad disk state). */
  removedSeedIdsOverride?: string[]
}

function persistMergedToDisk(merged: StoredComment[], options?: PersistMergedOptions): void {
  const seed = loadSeedComments()
  const seedMap = new Map(seed.map((s) => [s.id, s]))
  const prev = loadRuntimeState()

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

  const entries: StoredComment[] = []
  for (const m of merged) {
    const s = seedMap.get(m.id)
    if (!s) {
      entries.push(m)
      continue
    }
    if (!commentsEqual(s, m)) entries.push(m)
  }

  const runtimePath = commentsRuntimeFile()
  ensureDirForFile(runtimePath)
  const state: CommentsRuntimeState = {
    version: 1,
    removedSeedIds,
    entries,
  }
  writeFileSync(runtimePath, JSON.stringify(state, null, 2), 'utf-8')
}

export function persistMergedComments(merged: StoredComment[], options?: PersistMergedOptions): void {
  persistMergedToDisk(merged, options)
}

/** Clears tombstones so every id from `comments-data.json` can show again (disk state recovery). */
export function resetCommentSeedRemovals(): void {
  const seed = loadSeedComments()
  const state = loadRuntimeState()
  const merged = mergeComments(seed, { ...state, removedSeedIds: [] })
  persistMergedToDisk(merged, { removedSeedIdsOverride: [] })
}
