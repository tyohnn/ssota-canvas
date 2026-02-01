import { ImageResponse } from 'next/og';

export const runtime = 'edge';

const ogSize = { width: 1200, height: 630 };

// Match CTASection + globals.css --primary (light) oklch(0.6368 0.2078 25.3313)
const background = '#ffffff';
const foreground = '#0a0a0a';
const primary = '#ef4444';

/** Load Geist (project default font) from Google Fonts for OG image. */
async function loadGeistFont(text: string): Promise<ArrayBuffer> {
  const url = `https://fonts.googleapis.com/css2?family=Geist:wght@400;700&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(url)).text();
  // Match first src url (Google may return woff2 or truetype)
  const match = css.match(/src:\s*url\(([^)]+)\)/);
  const urlFromCss = match?.[1];
  if (urlFromCss) {
    const fontUrl = urlFromCss.trim().replace(/^['"]|['"]$/g, '');
    const res = await fetch(fontUrl);
    if (res.ok) return res.arrayBuffer();
  }
  throw new Error('Failed to load Geist font');
}

export async function GET() {
  const ogText = 'SSOTA Structure your research. Build the next big thing.';
  const fontData = await loadGeistFont(ogText);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          fontFamily: 'Geist, system-ui, sans-serif',
        }}
      >
        {/* MagneticDotsBackground: 20px grid, 1px dots, rgba(0,0,0,0.15) */}
        <svg
          width={1200}
          height={630}
          style={{ position: 'absolute', left: 0, top: 0 }}
        >
          <defs>
            <pattern
              id="dots"
              width={20}
              height={20}
              patternUnits="userSpaceOnUse"
            >
              <circle cx={10} cy={10} r={1} fill="rgba(0, 0, 0, 0.15)" />
            </pattern>
          </defs>
          <rect width={1200} height={630} fill="url(#dots)" />
        </svg>

        {/* Content: same as CTASection */}
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            maxWidth: 896,
            gap: 32,
          }}
        >
          <h1
            style={{
              fontFamily: 'Geist, system-ui, sans-serif',
              fontSize: 86,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              margin: 0,
              color: foreground,
            }}
          >
            SSOTA Canvas
          </h1>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div
              style={{
                fontFamily: 'Geist, system-ui, sans-serif',
                fontSize: 67,
                fontWeight: 900,
                letterSpacing: '-0.025em',
                lineHeight: 1.1,
                margin: 0,
                color: foreground,
              }}
            >
              Structure your research.
            </div>
            <div
              style={{
                fontFamily: 'Geist, system-ui, sans-serif',
                fontSize: 67,
                fontWeight: 900,
                letterSpacing: '-0.025em',
                lineHeight: 1.1,
                margin: 0,
                color: primary,
              }}
            >
              Build the next big thing.
            </div>
          </div>

        </div>
      </div>
    ),
    {
      ...ogSize,
      fonts: [
        {
          name: 'Geist',
          data: fontData,
          style: 'normal',
          weight: 400,
        },
      ],
    }
  );
}
