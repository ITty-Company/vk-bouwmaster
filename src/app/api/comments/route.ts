import { NextRequest, NextResponse } from 'next/server'
import { ensureCommentsFileWithSeed } from '@/lib/data-file-paths'
import {
  readMergedComments,
  persistMergedComments,
  type StoredComment,
} from '@/lib/comments-storage'
import {
  buildCommentTranslationsForAllLanguages,
  commentTranslationsComplete,
  fillMissingCommentTranslations,
  normalizeCommentTranslationKeys,
  sourceLangCodeFromMessage,
} from '@/lib/comment-translations'
import { autoTranslateOnFetch } from '@/lib/translation-languages'

/** Admin approve / message edit can take a while (many translations). */
export const maxDuration = 300

type Comment = StoredComment

// NOTE: Seed in src/lib merges with runtime overlay (COMMENTS_FILE_PATH, e.g. /var/data on Render).

function readComments(): Comment[] {
  try {
    ensureCommentsFileWithSeed()
    return readMergedComments()
  } catch {
    return []
  }
}

function writeComments(list: Comment[]) {
  ensureCommentsFileWithSeed()
  persistMergedComments(list)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const includeUnapproved = searchParams.get('includeUnapproved') === '1'

    let list = readComments()

    if (autoTranslateOnFetch()) {
      const maxRepair = Math.max(
        1,
        Math.min(50, Number(process.env.COMMENTS_REPAIR_BATCH_PER_GET ?? 24))
      )
      let repaired = 0
      let dirty = false
      const next: Comment[] = []
      for (const c of list) {
        if (
          !c.approved ||
          commentTranslationsComplete(c.translations) ||
          repaired >= maxRepair
        ) {
          next.push(c)
          continue
        }
        repaired++
        try {
          const translations = await fillMissingCommentTranslations(
            c.message,
            c.translations
          )
          next.push({ ...c, translations })
          dirty = true
        } catch (e) {
          console.error('[comments GET] Failed to repair translations for', c.id, e)
          next.push(c)
        }
      }
      if (dirty) {
        writeComments(next)
        list = next
      }
    }

    if (projectId) list = list.filter(c => c.projectId === projectId)
    if (!includeUnapproved) list = list.filter(c => c.approved)

    list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    list = list.map((c) => {
      const n = normalizeCommentTranslationKeys(c.translations)
      return { ...c, translations: n ?? c.translations }
    })
    const res = NextResponse.json(list)
    res.headers.set('Cache-Control', 'no-store, must-revalidate')
    return res
  } catch (e) {
    return NextResponse.json({ error: 'Failed to read comments' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const name = String(body.name || '').trim()
    const surname = String(body.surname || '').trim()
    const message = String(body.message || '').trim()
    const projectId = String(body.projectId || 'general').trim() // Если projectId не указан, используем 'general'
    const city = String(body.city || '').trim()

    if (!name || !message) {
      return NextResponse.json({ error: 'name and message are required' }, { status: 400 })
    }

    const list = readComments()
    const rating = body.rating !== undefined ? Math.max(1, Math.min(5, Number(body.rating))) : undefined
    const profileImage = String(body.profileImage || '').trim()
    
    // Save quickly: only store original text keyed by detected language. Full translations run when an
    // admin approves (PUT) or edits the message — avoids timeouts when guests submit the form.
    const sourceLangCode = sourceLangCodeFromMessage(message)
    const translations: Record<string, string> = { [sourceLangCode]: message }
    
    const comment: Comment = {
      id: Date.now().toString(),
      projectId,
      name: name.slice(0, 60),
      surname: surname ? surname.slice(0, 80) : undefined,
      message: message.slice(0, 2000),
      createdAt: new Date().toISOString(),
      approved: false, // requires admin approval
      photos: Array.isArray(body.photos) ? body.photos : undefined,
      videos: Array.isArray(body.videos) ? body.videos : undefined,
      rating: rating,
      city: city ? city.slice(0, 100) : undefined,
      profileImage: profileImage || undefined,
      translations,
    }
    list.push(comment)
    writeComments(list)
    return NextResponse.json({ success: true, comment })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to save comment' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const body = await request.json()
    const list = readComments()
    const idx = list.findIndex((c) => c.id === id)
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const prev = list[idx]
    const messageChanged =
      body.message !== undefined && String(body.message) !== prev.message
    const nextMessage =
      body.message !== undefined ? String(body.message).slice(0, 2000) : prev.message
    const nextApproved =
      body.approved !== undefined ? Boolean(body.approved) : prev.approved
    const becameApproved = !prev.approved && nextApproved

    let translations: Record<string, string> | undefined = prev.translations

    if (messageChanged && body.message !== undefined) {
      translations = await buildCommentTranslationsForAllLanguages(String(body.message))
    } else if (
      becameApproved &&
      nextMessage.trim() &&
      !commentTranslationsComplete(prev.translations)
    ) {
      translations = await fillMissingCommentTranslations(nextMessage, prev.translations)
    } else if (body.translations !== undefined) {
      translations = body.translations
    }

    list[idx] = {
      ...prev,
      name: body.name !== undefined ? String(body.name).slice(0, 60) : prev.name,
      surname: body.surname !== undefined ? String(body.surname).slice(0, 80) : prev.surname,
      message: nextMessage,
      approved: nextApproved,
      photos:
        body.photos !== undefined
          ? Array.isArray(body.photos)
            ? body.photos.length > 0
              ? body.photos
              : undefined
            : prev.photos
          : prev.photos,
      videos:
        body.videos !== undefined
          ? Array.isArray(body.videos)
            ? body.videos.length > 0
              ? body.videos
              : undefined
            : prev.videos
          : prev.videos,
      rating:
        body.rating !== undefined ? Math.max(1, Math.min(5, Number(body.rating))) : prev.rating,
      city:
        body.city !== undefined
          ? String(body.city).trim()
            ? String(body.city).slice(0, 100)
            : undefined
          : prev.city,
      profileImage:
        body.profileImage !== undefined
          ? String(body.profileImage).trim()
            ? String(body.profileImage)
            : undefined
          : prev.profileImage,
      translations: translations || prev.translations,
    }
    writeComments(list)
    return NextResponse.json({ success: true, comment: list[idx] })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const list = readComments()
    const filtered = list.filter(c => c.id !== id)
    writeComments(filtered)
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 })
  }
}


