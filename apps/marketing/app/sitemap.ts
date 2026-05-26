import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://reviewnatinph.com', lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: 'https://reviewnatinph.com/subscribe', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: 'https://reviewnatinph.com/checkout', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: 'https://reviewnatinph.com/privacy', lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: 'https://reviewnatinph.com/terms', lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];
}
