import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/api/',
        '/auth/',
        '/cuenta/',
        '/dashboard/',
        '/login',
        '/private-access',
        '/register',
        '/reset-password',
      ],
    },
    sitemap: 'https://www.tardea.com/sitemap.xml',
    host: 'https://www.tardea.com',
  }
}
