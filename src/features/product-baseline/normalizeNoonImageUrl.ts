// Compatibility normalizer for historical Noon catalog image references.
function hasImageExtension(value: string) {
  return /\.(?:avif|gif|jpe?g|png|webp)(?:[?#].*)?$/i.test(value);
}

export function normalizeNoonImageUrl(value: unknown) {
  const raw = String(value ?? '').trim();
  if (!raw) {
    return '';
  }

  let normalized = raw;
  if (/^original\/pzsku\//i.test(normalized)) {
    normalized = normalized.replace(/^original\/pzsku\//i, 'https://f.nooncdn.com/p/pzsku/');
  } else if (/^pzsku\//i.test(normalized)) {
    normalized = `https://f.nooncdn.com/p/${normalized}`;
  } else if (/^https:\/\/f\.nooncdn\.com\/p\/original\/pzsku\//i.test(normalized)) {
    normalized = normalized.replace(
      /^https:\/\/f\.nooncdn\.com\/p\/original\/pzsku\//i,
      'https://f.nooncdn.com/p/pzsku/'
    );
  } else if (/^https:\/\/f\.nooncdn\.com\/pzsku\//i.test(normalized)) {
    normalized = normalized.replace(/^https:\/\/f\.nooncdn\.com\/pzsku\//i, 'https://f.nooncdn.com/p/pzsku/');
  }

  if (/^https:\/\/f\.nooncdn\.com\/p\/pzsku\//i.test(normalized) && !hasImageExtension(normalized)) {
    return `${normalized}.jpg`;
  }
  return normalized;
}
