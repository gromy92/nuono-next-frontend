import { apiFetch } from '../../shared/api';
import type {
  ProductCompetitorContentFieldType,
  ProductCompetitorContentTargetLang
} from './types/competitorContent';

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
  data?: {
    draft?: {
      text?: string;
    };
  };
  msg?: string;
  message?: string;
};

async function readBackendError(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as { error?: string; message?: string };
    return payload.message || payload.error || fallback;
  } catch {
    return fallback;
  }
}

export async function mergeProductCompetitorContent(request: ProductCompetitorContentMergeRequest) {
  const response = await apiFetch('/api/product-master/competitor-content/merge', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    throw new Error(await readBackendError(response, `竞品 AI 整合返回 ${response.status}`));
  }

  return (await response.json()) as ProductCompetitorContentMergeResponse;
}
