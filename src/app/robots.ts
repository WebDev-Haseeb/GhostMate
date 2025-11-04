import { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/sw.js', '/workbox-*.js', '/worker-*.js'],
    },
    sitemap: 'https://ghostmate.online/sitemap.xml',
  }
}

