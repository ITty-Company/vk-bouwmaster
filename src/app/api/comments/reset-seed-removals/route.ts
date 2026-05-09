import { NextRequest, NextResponse } from 'next/server'
import { verifyCredentials } from '@/lib/auth'
import { resetCommentSeedRemovals } from '@/lib/comments-storage'

/** One-time recovery when disk had bogus removedSeedIds (hidden seeded reviews). */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const email = String(body.email || '').trim()
    const password = String(body.password || '').trim()
    if (!verifyCredentials(email, password)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    resetCommentSeedRemovals()
    return NextResponse.json({ success: true, message: 'Seed removal tombstones cleared. Reload reviews.' })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to reset' }, { status: 500 })
  }
}
