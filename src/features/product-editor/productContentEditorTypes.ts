import type { ProductCompetitorContentFieldType } from '../product-domain/productCompetitorContent';

export type ProductContentLang = 'EN' | 'AR';
export type ProductContentEditableField = ProductCompetitorContentFieldType;

export type ProductContentEditModalState = {
  fieldType: ProductContentEditableField;
  lang: ProductContentLang;
  value: string;
  sourceText: string;
};

export const PRODUCT_CONTENT_LANG_LABELS: Record<ProductContentLang, string> = {
  EN: '英语',
  AR: '阿语'
};

export const PRODUCT_CONTENT_FIELD_LABELS: Record<ProductContentEditableField, string> = {
  title: '标题',
  description: '详情',
  highlights: '卖点'
};
