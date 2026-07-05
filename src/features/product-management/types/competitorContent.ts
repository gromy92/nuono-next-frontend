export type ProductCompetitorContentFieldType = 'title' | 'description' | 'highlights';

export type ProductCompetitorContentTargetLang = 'EN' | 'AR';

export type ProductCompetitorContentMaterial = {
  id: string;
  url?: string;
  note?: string;
  sourceHost?: string;
  fetchedAt?: string;
  titleEn?: string;
  titleAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  sellingPointsEn?: string[];
  sellingPointsAr?: string[];
};
