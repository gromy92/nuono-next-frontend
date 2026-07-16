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
