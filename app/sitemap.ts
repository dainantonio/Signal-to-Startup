import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://signal-to-startup.vercel.app',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://signal-to-startup.vercel.app/demo',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: 'https://signal-to-startup.vercel.app/dashboard',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
  ]
}
