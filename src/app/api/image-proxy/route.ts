import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  if (!url) return new NextResponse('Missing url', { status: 400 })

  // Only allow TMDB image URLs
  if (!url.startsWith('https://image.tmdb.org/')) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const response = await fetch(url)
  if (!response.ok) return new NextResponse('Failed to fetch image', { status: response.status })

  const buffer = await response.arrayBuffer()
  const contentType = response.headers.get('content-type') ?? 'image/jpeg'

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
