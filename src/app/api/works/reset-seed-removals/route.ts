import { NextRequest, NextResponse } from 'next/server'
import { verifyCredentials } from '@/lib/auth'
import { resetWorkSeedRemovals } from '@/lib/works-storage'

/** Clears bogus removedSeedIds so all works from Git seed appear again on disk overlay. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const email = String(body.email || '').trim()
    const password = String(body.password || '').trim()
    if (!verifyCredentials(email, password)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    resetWorkSeedRemovals()
    return NextResponse.json({ success: true, message: 'Пометки удалённых работ из репозитория сброшены.' })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to reset' }, { status: 500 })
  }
}
