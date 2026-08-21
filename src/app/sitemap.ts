import type { MetadataRoute } from 'next'
import { CHECKLIST_ITEMS } from '@/data/checklist'
import { SITE_URL } from '@/data/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(
    CHECKLIST_ITEMS.reduce((max, i) => (i.lastVerified > max ? i.lastVerified : max), '2026-01-01'),
  )

  return [
    { url: SITE_URL, lastModified, changeFrequency: 'weekly', priority: 1 },
    ...['/guide/birth-report', '/guide/subsidy', '/guide/postpartum-care', '/about'].map((p) => ({
      url: `${SITE_URL}${p}`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...CHECKLIST_ITEMS.map((item) => ({
      url: `${SITE_URL}/checklist/${item.slug}`,
      lastModified: new Date(item.lastVerified),
      changeFrequency: 'monthly' as const,
      priority: item.critical ? 0.9 : 0.7,
    })),
  ]
}
