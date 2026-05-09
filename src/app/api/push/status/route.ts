import { NextResponse } from 'next/server'

export async function GET() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim()
  const configured = Boolean(
    publicKey && process.env.VAPID_PRIVATE_KEY?.trim()
  )
  return NextResponse.json({
    configured,
    publicKey: configured ? publicKey : null,
  })
}
