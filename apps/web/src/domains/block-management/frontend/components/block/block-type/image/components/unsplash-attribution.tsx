/**
 * UnsplashAttribution Component
 *
 * Unsplash 저작권 정보 오버레이
 */

export interface UnsplashAttributionProps {
  visible: boolean;
  authorName: string;
  authorLink: string;
}

export function UnsplashAttribution({
  visible,
  authorName,
  authorLink,
}: UnsplashAttributionProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/70 to-transparent px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
      <p className="text-xs text-white pointer-events-auto">
        Photo by{' '}
        <a
          href={authorLink}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-blue-300 transition-colors"
          onClick={e => e.stopPropagation()}
        >
          {authorName}
        </a>
        {' on '}
        <a
          href="https://unsplash.com?utm_source=ssota&utm_medium=referral"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-blue-300 transition-colors"
          onClick={e => e.stopPropagation()}
        >
          Unsplash
        </a>
      </p>
    </div>
  );
}

