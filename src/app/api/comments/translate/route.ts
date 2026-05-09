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
} from '@/lib/comment-translations'

type Comment = StoredComment

/** Batch translation can take a long time with many reviews × many languages. */
export const maxDuration = 300

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

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const commentId = searchParams.get('commentId')
    const force = searchParams.get('force') === 'true'

    const comments = readComments()

    if (commentId) {
      const index = comments.findIndex((c) => c.id === commentId)
      if (index === -1) {
        return NextResponse.json({ error: 'Комментарий не найден' }, { status: 404 })
      }

      const comment = comments[index]
      console.log(
        `[Translate Comments API] 🔄 Translating comment ${commentId}: "${comment.message.substring(0, 30)}..."`
      )

      try {
        const translations = force
          ? await buildCommentTranslationsForAllLanguages(comment.message)
          : await fillMissingCommentTranslations(comment.message, comment.translations)

        comments[index] = { ...comment, translations }
        writeComments(comments)

        console.log(`[Translate Comments API] ✅ Successfully translated comment ${commentId}`)
        return NextResponse.json({
          success: true,
          message: `Переводы для комментария ${commentId} обновлены`,
          comment: comments[index],
        })
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Неизвестная ошибка'
        console.error(`[Translate Comments API] ❌ Error translating comment ${commentId}:`, error)
        return NextResponse.json({ error: `Ошибка перевода: ${msg}` }, { status: 500 })
      }
    }

    let translatedCount = 0
    let errorCount = 0

    console.log(
      `[Translate Comments API] 🔄 Starting translation of ${comments.length} comments (force=${force})...`
    )

    for (let i = 0; i < comments.length; i++) {
      const comment = comments[i]

      if (!force && commentTranslationsComplete(comment.translations)) {
        console.log(`[Translate Comments API] ⏭️ Skipping comment ${comment.id} (all languages present)`)
        continue
      }

      try {
        console.log(
          `[Translate Comments API] 🔄 Translating comment ${i + 1}/${comments.length}: "${comment.message.substring(0, 30)}..."`
        )

        const translations = force
          ? await buildCommentTranslationsForAllLanguages(comment.message)
          : await fillMissingCommentTranslations(comment.message, comment.translations)

        comments[i] = { ...comment, translations }
        translatedCount++

        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (error: unknown) {
        console.error(
          `[Translate Comments API] ❌ Error translating comment ${comment.id}:`,
          error instanceof Error ? error.message : error
        )
        errorCount++
      }
    }

    if (translatedCount > 0) {
      writeComments(comments)
      console.log(`[Translate Comments API] ✅ Saved ${translatedCount} translated comments`)
    }

    return NextResponse.json({
      success: true,
      message: `Переведено комментариев: ${translatedCount}, ошибок: ${errorCount}`,
      translated: translatedCount,
      errors: errorCount,
      total: comments.length,
    })
  } catch (error: unknown) {
    console.error('[Translate Comments API] ❌ Fatal error:', error)
    return NextResponse.json(
      { error: `Критическая ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}` },
      { status: 500 }
    )
  }
}
