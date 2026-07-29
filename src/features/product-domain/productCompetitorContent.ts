export type ProductCompetitorContentFieldType = 'title' | 'description' | 'highlights';

export type ProductCompetitorContentTargetLang = 'EN' | 'AR';

export type ProductCompetitorCategoryLink = {
  name?: string;
  path?: string;
  url?: string;
};

export type ProductCompetitorContentMaterial = {
  id: string;
  url?: string;
  note?: string;
  sourceHost?: string;
  externalSku?: string;
  fetchedAt?: string;
  categoryName?: string;
  categoryPath?: string;
  categoryUrl?: string;
  categoryLinks?: ProductCompetitorCategoryLink[];
  titleEn?: string;
  titleAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  sellingPointsEn?: string[];
  sellingPointsAr?: string[];
};

function text(value: unknown) {
  return value === null || value === undefined ? '' : String(value).trim();
}

function containsArabicScript(value: string) {
  return /\p{Script=Arabic}/u.test(value);
}

function englishCategoryPathFromUrl(value?: string) {
  try {
    return new URL(text(value)).pathname
      .split('/')
      .map((item) => decodeURIComponent(item))
      .filter((item) => item && !/^[a-z]+-(?:en|ar)$/i.test(item))
      .map((item) =>
        item
          .replace(/-\d+$/, '')
          .replace(/[-_]+/g, ' ')
          .replace(/\b\w/g, (letter) => letter.toUpperCase())
      )
      .join(' > ');
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
  return (
    [material.categoryPath, englishCategoryPathFromUrl(categoryUrl || material.categoryUrl), material.categoryName]
      .map(text)
      .find((item) => item && !containsArabicScript(item)) || value
  );
}
