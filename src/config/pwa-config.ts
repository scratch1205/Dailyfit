export const pwaConfig = {
  name: 'DailyFit',
  short_name: 'DailyFit',
  description: '每日穿搭记录与规划应用',
  start_url: '/',
  display: 'standalone' as const,
  background_color: '#F9FAFB',
  theme_color: '#3B82F6',
  scope: '/',
  orientation: 'portrait' as const,
  lang: 'zh-CN',
  icons: [
    {
      src: '/icons/icon-192x192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/icons/icon-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/icons/icon-192x192-maskable.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'maskable',
    },
    {
      src: '/icons/icon-512x512-maskable.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ],
  prefer_related_applications: false,
  related_applications: [] as unknown[],
}

export default pwaConfig