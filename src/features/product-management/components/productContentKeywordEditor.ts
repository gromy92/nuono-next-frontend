import type {
  ProductKeywordEventItem,
  ProductKeywordItem,
  ProductKeywordPanelView
} from '../../product-keywords/types';
import type { ProductCompetitorContentMaterial } from '../types/competitorContent';
import { normalizeProductTitleKeywordInput, parseProductTitleKeywordInputList } from './productCompetitorContentKeywords';
import type { ProductCompetitorContentTextItem } from './productCompetitorContentSources';
import { buildProductCompetitorContentSourceView, isNoonCompetitorContentSource } from './productCompetitorContentSources';

export type ProductContentKeywordInputRow = {
  id: string;
  value: string;
  sourceKeywordId?: number;
  originalValue?: string;
  competitorSourceKeys?: string[];
};

export type ProductContentKeywordScope = {
  storeCode: string;
  siteCode: string;
  partnerSku: string;
};

export type ProductContentKeywordSaveChangeSummary = {
  titleChanged: boolean;
  keywordChanged: boolean;
  competitorChanged: boolean;
  messages: string[];
};

export type ProductContentKeywordSaveChangeDetails = ProductContentKeywordSaveChangeSummary & {
  titleBefore?: string;
  titleAfter?: string;
  keywordDetails: string[];
  competitorDetails: string[];
};

export function editableKeywordRowsFromPanel(panel?: ProductKeywordPanelView | null): ProductContentKeywordInputRow[] {
  return (panel?.keywords || [])
    .filter(isEditableTitleKeyword)
    .slice(0, 20)
    .map((keyword) => ({
      id: `keyword-${keyword.id}`,
      sourceKeywordId: keyword.id,
      value: keyword.keyword,
      originalValue: keyword.keyword,
      competitorSourceKeys: []
    }));
}

export function competitorMaterialsFromKeywordEvents(events?: ProductKeywordEventItem[] | null): ProductCompetitorContentMaterial[] {
  const materials: ProductCompetitorContentMaterial[] = [];
  const seen = new Set<string>();
  (events || [])
    .filter((event) => String(event.sourceType || '').toUpperCase() === 'COMPETITOR_KEYWORD')
    .forEach((event) => {
      parseCompetitorSources(event.payloadJson).forEach((source, index) => {
        const url = text(source.url);
        const sourceText = text(source.sourceText);
        const key = `${url}|${sourceText}`;
        if (!url && !sourceText) {
          return;
        }
        if (seen.has(key)) {
          return;
        }
        seen.add(key);
        materials.push({
          id: `keyword-event-${event.id}-${index}`,
          url,
          sourceHost: text(source.label),
          titleEn: sourceText,
          externalSku: text(source.externalSku)
        });
      });
    });
  return materials;
}

export function noonCompetitorTextItems(items: ProductCompetitorContentTextItem[]) {
  return items.filter((item) => isNoonCompetitorContentSource(item.source));
}

export function dedupeProductCompetitorContentTextItems(items: ProductCompetitorContentTextItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const sourceKey = item.source.displayCode
      ? `${item.source.platform}:${item.source.displayCode.toUpperCase()}`
      : `${item.source.platform}:${text(item.source.url).toLowerCase() || text(item.source.label).toLowerCase()}`;
    const key = `${sourceKey}:${normalizeComparableText(item.text)}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function keywordRowKeywords(row: ProductContentKeywordInputRow) {
  return parseProductTitleKeywordInputList(row.value);
}

export function keywordRowsForSave(rows: ProductContentKeywordInputRow[]) {
  return rows.filter((row) => keywordRowKeywords(row).length > 0);
}

export function keywordRowHasKeywordChange(row: ProductContentKeywordInputRow) {
  const keywords = keywordRowKeywords(row);
  if (!keywords.length) {
    return false;
  }
  if (!row.sourceKeywordId) {
    return true;
  }
  return normalizeProductTitleKeywordInput(keywords.join(' ')).toLowerCase() !==
    normalizeProductTitleKeywordInput(row.originalValue || '').toLowerCase();
}

export function keywordRowsHaveCompetitorChange(rows: ProductContentKeywordInputRow[]) {
  return rows.some((row) => keywordRowKeywords(row).length > 0 && Boolean(row.competitorSourceKeys?.length));
}

export function buildProductContentKeywordSaveChangeSummary(params: {
  fieldType: 'title' | 'description' | 'highlights';
  initialValue: string;
  draftValue: string;
  rows: ProductContentKeywordInputRow[];
  deletedKeywords?: string[];
}): ProductContentKeywordSaveChangeSummary {
  const titleChanged =
    params.fieldType === 'title' &&
    text(params.initialValue) !== text(params.draftValue);
  const keywordChanged = params.fieldType === 'title' && (
    params.rows.some(keywordRowHasKeywordChange) || Boolean(params.deletedKeywords?.length)
  );
  const competitorChanged = params.fieldType === 'title' && keywordRowsHaveCompetitorChange(params.rows);
  const messages: string[] = [];
  if (titleChanged) {
    messages.push('确认修改标题');
  }
  if (competitorChanged) {
    messages.push('确认添加竞品');
  }
  if (keywordChanged) {
    messages.push('确认添加关键词');
  }
  return {
    titleChanged,
    keywordChanged,
    competitorChanged,
    messages
  };
}

export function buildProductContentKeywordSaveChangeDetails(params: {
  fieldType: 'title' | 'description' | 'highlights';
  initialValue: string;
  draftValue: string;
  rows: ProductContentKeywordInputRow[];
  deletedKeywords?: string[];
  competitorLabelsByRowId?: Record<string, string[]>;
}): ProductContentKeywordSaveChangeDetails {
  const summary = buildProductContentKeywordSaveChangeSummary(params);
  const keywordDetails: string[] = [];
  const competitorDetails: string[] = [];

  if (params.fieldType === 'title') {
    (params.deletedKeywords || []).forEach((keyword) => {
      keywordDetails.push(`删除关键词：${keyword}`);
    });
    params.rows.forEach((row) => {
      const keywords = keywordRowKeywords(row);
      if (!keywords.length) {
        return;
      }
      const keywordText = keywords.join(' / ');
      if (keywordRowHasKeywordChange(row)) {
        keywordDetails.push(row.sourceKeywordId
          ? `修改关键词：${text(row.originalValue) || '未填写'} → ${keywordText}`
          : `新增关键词：${keywordText}`);
      }
      const competitorLabels = params.competitorLabelsByRowId?.[row.id] || [];
      if (competitorLabels.length) {
        competitorDetails.push(`关键词「${keywordText}」添加竞品：${competitorLabels.join('、')}`);
      }
    });
  }

  return {
    ...summary,
    titleBefore: summary.titleChanged ? text(params.initialValue) : undefined,
    titleAfter: summary.titleChanged ? text(params.draftValue) : undefined,
    keywordDetails,
    competitorDetails
  };
}

export function titleKeywordChineseTranslations(
  keywords: Array<{ key: string; label: string }>,
  translatedText?: string
) {
  const translatedLines = text(translatedText)
    .split(/\r?\n|[;；]+/u)
    .map(cleanTranslatedKeywordLine)
    .filter(Boolean);
  const nextTranslations: Record<string, string> = {};
  keywords.forEach((keyword, index) => {
    const translatedKeyword = translatedLines[index] || '';
    if (hasChineseText(translatedKeyword)) {
      nextTranslations[keyword.key] = translatedKeyword;
      return;
    }
    const fallback = arabicKeywordChineseFallback(keyword.label);
    if (fallback) {
      nextTranslations[keyword.key] = fallback;
    }
  });
  return nextTranslations;
}

export function hasChineseText(value?: string | null) {
  return /[\u4e00-\u9fff]/u.test(text(value));
}

export function competitorEvidenceFromItem(item: ProductCompetitorContentTextItem) {
  return {
    label: competitorSourceDisplayText(item),
    url: item.source.url,
    sourceText: item.text
  };
}

export function competitorSourceDisplayText(item: ProductCompetitorContentTextItem) {
  const source = item.source;
  const code = text(source.displayCode);
  if (code) {
    return source.platform === 'amazon' ? `Amazon ${code}` : `Noon ${code}`;
  }
  return text(source.label) || '竞品';
}

export function competitorSourceLinkTitle(item: ProductCompetitorContentTextItem) {
  const displayText = competitorSourceDisplayText(item);
  const source = buildProductCompetitorContentSourceView({
    id: item.key,
    url: item.source.url,
    sourceHost: item.source.label,
    externalSku: item.source.displayCode
  }, 0);
  return source.displayCode ? displayText : `${displayText}（未识别外部 SKU）`;
}

function isEditableTitleKeyword(keyword: ProductKeywordItem) {
  const titleTypes = values(keyword.titleTypes);
  const titleUsageStates = values(keyword.titleUsageStates);
  const status = String(keyword.status || '').toUpperCase();
  return (
    titleTypes.length > 0 ||
    titleUsageStates.length > 0 ||
    Boolean(keyword.competitorEvidence) ||
    status === 'ACTIVE'
  );
}

function parseCompetitorSources(payloadJson?: string | null): Array<{
  label?: string;
  url?: string;
  sourceText?: string;
  externalSku?: string;
}> {
  if (!payloadJson) {
    return [];
  }
  try {
    const payload = JSON.parse(payloadJson) as {
      competitorSources?: Array<{ label?: string; url?: string; sourceText?: string; externalSku?: string }>;
    };
    return Array.isArray(payload.competitorSources) ? payload.competitorSources : [];
  } catch {
    return [];
  }
}

function arabicKeywordChineseFallback(value: string) {
  const normalized = normalizeArabicKeyword(value);
  const dictionary: Record<string, string> = {
    'جراب': '保护壳',
    'مغناطيسي': '磁吸',
    'لهاتف': '手机',
    'ايفون': 'iPhone',
    'آيفون': 'iPhone',
    'متوافق': '兼容',
    'مقاوم': '防护',
    'للسقوط': '防摔',
    'ارتفاع': '高度',
    'صدمات': '防震',
    'للصدمات': '防震',
    'حلقي': '环形',
    'دوار': '旋转',
    'مسند': '支架',
    'اسود': '黑色',
    'أسود': '黑色'
  };
  return dictionary[normalized] || '';
}

function normalizeArabicKeyword(value: string) {
  return text(value)
    .replace(/[ًٌٍَُِّْـ]/gu, '')
    .replace(/[إأٱا]/gu, 'ا')
    .replace(/[ى]/gu, 'ي')
    .replace(/[ة]/gu, 'ه')
    .toLocaleLowerCase();
}

function cleanTranslatedKeywordLine(value: string) {
  const cleaned = text(value).replace(/^\s*[-*•\d.、)）]+/u, '').trim();
  const colonMatch = cleaned.match(/[:：]\s*(.+)$/u);
  if (colonMatch?.[1] && hasChineseText(colonMatch[1])) {
    return colonMatch[1].trim();
  }
  return cleaned;
}

function normalizeComparableText(value?: string | null) {
  return text(value).replace(/\s+/g, ' ').toLocaleLowerCase();
}

function values(items?: string[] | null) {
  return (items || []).map((item) => String(item).trim()).filter(Boolean);
}

function text(value?: string | null) {
  return (value || '').trim();
}
