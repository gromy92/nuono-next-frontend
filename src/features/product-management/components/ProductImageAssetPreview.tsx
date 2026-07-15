import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import { isProductImageAssetUrl, resolveProductImageDisplayUrl } from '../utils/productImageAssetDisplay';

type ProductImageAssetPreviewProps = {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
};

export function ProductImageAssetPreview({ alt, className, src, style }: ProductImageAssetPreviewProps) {
  const [displaySrc, setDisplaySrc] = useState(() => initialDisplaySrc(src));

  useEffect(() => {
    let cancelled = false;
    let revokeDisplayUrl: (() => void) | undefined;
    const fallbackSrc = initialDisplaySrc(src);
    setDisplaySrc(fallbackSrc);

    if (!src.trim()) {
      return () => undefined;
    }

    resolveProductImageDisplayUrl(src)
      .then((result) => {
        if (cancelled) {
          result.revoke();
          return;
        }
        revokeDisplayUrl = result.revoke;
        setDisplaySrc(result.displayUrl);
      })
      .catch(() => {
        if (!cancelled) {
          setDisplaySrc(fallbackSrc);
        }
      });

    return () => {
      cancelled = true;
      revokeDisplayUrl?.();
    };
  }, [src]);

  if (!displaySrc) {
    return <div role="img" aria-label={alt} className={className} style={style} />;
  }

  return <img src={displaySrc} alt={alt} className={className} style={style} />;
}

function initialDisplaySrc(src: string) {
  return isProductImageAssetUrl(src) ? '' : src;
}
