type OptimizedCoverOptions = {
  width?: number
  quality?: number
}

export function optimizedCoverUrl(
  imageUrl: string | null | undefined,
  options: OptimizedCoverOptions = {}
) {
  if (!imageUrl) return ''
  if (imageUrl.startsWith('/') || imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')) return imageUrl

  const width = options.width ?? 640
  const quality = options.quality ?? 72

  try {
    const url = new URL(imageUrl)

    if (url.hostname.includes('supabase.co') && url.pathname.includes('/storage/v1/object/public/')) {
      url.pathname = url.pathname.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/')
      url.searchParams.set('width', String(width))
      url.searchParams.set('quality', String(quality))
      url.searchParams.set('resize', 'cover')
      return url.toString()
    }

    if (url.hostname.includes('images.unsplash.com')) {
      url.searchParams.set('auto', 'format')
      url.searchParams.set('fit', 'crop')
      url.searchParams.set('w', String(width))
      url.searchParams.set('q', String(quality))
      return url.toString()
    }
  } catch {
    return imageUrl
  }

  return imageUrl
}
