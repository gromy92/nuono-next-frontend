import { apiRequestJson } from '../../shared/api';
import type {
  ProductCompetitorContentFieldType,
  ProductCompetitorContentTargetLang
} from '../product-domain/productCompetitorContent';

export type ProductContentTranslateRequest = {
  text: string;
  sourceLang?: 'AUTO' | 'ZH' | 'EN' | 'AR';
  targetLang: 'ZH' | 'EN' | 'AR';
};

export type ProductContentTranslateResponse = {
  ready?: boolean;
  source?: 'ai' | string;
  warnings?: string[];
  data?: { translation?: { text?: string } };
  msg?: string;
  message?: string;
};

export type ProductCompetitorContentMergeRequest = {
  fieldType: ProductCompetitorContentFieldType;
  targetLang: ProductCompetitorContentTargetLang;
  currentText?: string;
  competitorTexts: string[];
};

export type ProductCompetitorContentMergeResponse = {
  ready?: boolean;
  source?: 'ai' | string;
  warnings?: string[];
  data?: { draft?: { text?: string } };
  msg?: string;
  message?: string;
};

export function translateProductContentText(request: ProductContentTranslateRequest) {
  return apiRequestJson<ProductContentTranslateResponse>(
    '/api/product-master/translate',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    },
    (status) => `翻译服务返回 ${status}`
  );
}

export function mergeProductCompetitorContent(request: ProductCompetitorContentMergeRequest) {
  return apiRequestJson<ProductCompetitorContentMergeResponse>(
    '/api/product-master/competitor-content/merge',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    },
    (status) => `竞品 AI 整合返回 ${status}`
  );
}
