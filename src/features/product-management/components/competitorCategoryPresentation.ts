import type { ProductCompetitorContentMaterial } from '../types/competitorContent';

function text(value: unknown) {
  return value === null || value === undefined ? '' : String(value).trim();
}

function containsArabicScript(value: string) {
  return /\p{Script=Arabic}/u.test(value);
}

function englishCategoryPathFromUrl(value?: string) {
  try {
    const parts = new URL(text(value)).pathname
      .split('/')
      .map((item) => decodeURIComponent(item))
      .filter((item) => item && !/^[a-z]+-(?:en|ar)$/i.test(item))
      .map((item) => item.replace(/-\d+$/, '').replace(/[-_]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()));
    return parts.join(' > ');
  } catch {
    return '';
  }
}

export function preferredCompetitorCategoryLabel(
  value: string,
  material: ProductCompetitorContentMaterial,
  categoryUrl?: string
) {
  if (!containsArabicScript(value)) {
    return value;
  }
  return [material.categoryPath, englishCategoryPathFromUrl(categoryUrl || material.categoryUrl), material.categoryName]
    .map(text)
    .find((item) => item && !containsArabicScript(item)) || value;
}
