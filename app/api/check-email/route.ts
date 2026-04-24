import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ exists: false })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    const res = await fetch(
      `${url}/auth/v1/admin/users?filter=${encodeURIComponent(email.toLowerCase())}`,
      {
        headers: {
          apikey: serviceKey!,
          Authorization: `Bearer ${serviceKey}`,
        },
      }
    )

    if (!res.ok) return NextResponse.json({ exists: false })

    const data = await res.json()
    const exists =
      Array.isArray(data.users) &&
      data.users.some(
        (u: { email: string }) => u.email?.toLowerCase() === email.toLowerCase()
      )

    return NextResponse.json({ exists })
  } catch {
    return NextResponse.json({ exists: false })
  }
}
