import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

// iOS home-screen icon (apple-touch-icon must be a raster image — generated here).
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#b0475f',
        }}
      >
        <svg
          width="112"
          height="112"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ffffff"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="7.5" r="2.5" />
          <path d="M12 5V3M14.5 8.8l1.7-1M9.5 8.8l-1.7-1M12 10v3.5" />
          <path d="M12 13.5c-2.4 0-4 1.4-4 3.5v.5h8V17c0-2.1-1.6-3.5-4-3.5Z" />
          <path d="M8.2 17.5 7 21m9-3.5L17 21" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
