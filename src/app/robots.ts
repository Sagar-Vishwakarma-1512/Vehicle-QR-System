import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/login', '/register'],
        disallow: ['/admin/', '/super-admin/', '/api/'],
      },
    ],
    sitemap: 'https://qrsaathi.com/sitemap.xml',
  };
}

