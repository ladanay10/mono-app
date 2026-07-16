import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MONO — облік студії',
    short_name: 'MONO',
    description: 'Облік доходів і прибутку квіткової студії MONO',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#0c0d11',
    theme_color: '#0c0d11',
    orientation: 'portrait',
    lang: 'uk',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
    ],
  };
}
