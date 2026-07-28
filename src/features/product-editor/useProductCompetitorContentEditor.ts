import { message } from 'antd';
import { type Dispatch, type SetStateAction, useEffect, useMemo, useState } from 'react';
import {
  type LoadingMap,
  type TranslationNotice,
  translateProductTextWithFeedback
} from './ProductContentTranslationEditor.helpers';
import { mergeProductCompetitorContent } from './productContentApi';
import { extractSharedProductTitleKeywords, type ProductTitleSharedKeyword } from './productCompetitorContentKeywords';
import {
  competitorContentTranslationInputText,
  initialSelectedCompetitorContentKeys,
  selectedCompetitorContentTexts,
  type ProductCompetitorContentTextItem
} from './productCompetitorContentSources';
import type { ProductContentEditableField, ProductContentLang } from './productContentEditorTypes';

export function useProductCompetitorContentEditor(params: {
  acceptSharedKeywords: (keywords: ProductTitleSharedKeyword[]) => Promise<void>;
  competitorTextItems: ProductCompetitorContentTextItem[];
  draftValue: string;
  fieldType: ProductContentEditableField;
  lang: ProductContentLang;
  loading: LoadingMap;
  open: boolean;
  setDraftValue: Dispatch<SetStateAction<string>>;
  setLoading: Dispatch<SetStateAction<LoadingMap>>;
}) {
  const {
    acceptSharedKeywords, competitorTextItems, draftValue, fieldType, lang,
    open, setDraftValue, setLoading
  } = params;
  const [competitorLoading, setCompetitorLoading] = useState(false);
  const [competitorNotice, setCompetitorNotice] = useState<{ type: 'error' | 'warning'; message: string }>();
  const [selectedCompetitorKeys, setSelectedCompetitorKeys] = useState<string[]>([]);
  const [competitorTranslations, setCompetitorTranslations] = useState<Record<string, string>>({});
  const [translationNotices, setTranslationNotices] = useState<Record<string, TranslationNotice>>({});
  const selectedCompetitorTexts = useMemo(
    () => selectedCompetitorContentTexts(competitorTextItems, selectedCompetitorKeys),
    [competitorTextItems, selectedCompetitorKeys]
  );
  const allCompetitorsSelected = competitorTextItems.length > 0
    && selectedCompetitorKeys.length === competitorTextItems.length;
  const partiallySelected = selectedCompetitorKeys.length > 0
    && selectedCompetitorKeys.length < competitorTextItems.length;

  useEffect(() => {
    if (!open) return;
    setCompetitorNotice(undefined);
    setSelectedCompetitorKeys(initialSelectedCompetitorContentKeys(competitorTextItems));
    setCompetitorTranslations({});
    setTranslationNotices({});
    setCompetitorLoading(false);
  }, [fieldType, lang, open]);

  useEffect(() => {
    if (open) setSelectedCompetitorKeys(initialSelectedCompetitorContentKeys(competitorTextItems));
  }, [competitorTextItems, open]);

  const setTranslationNotice = (key: string): Dispatch<SetStateAction<TranslationNotice>> => (next) => {
    setTranslationNotices((current) => ({
      ...current,
      [key]: typeof next === 'function' ? next(current[key] ?? null) : next
    }));
  };

  const toggleCompetitorKey = (key: string, checked: boolean) => {
    setSelectedCompetitorKeys((current) => checked
      ? current.includes(key) ? current : [...current, key]
      : current.filter((item) => item !== key)
    );
  };

  const toggleAllCompetitors = (checked: boolean) => {
    setSelectedCompetitorKeys(checked ? initialSelectedCompetitorContentKeys(competitorTextItems) : []);
  };

  const generateCompetitorTranslation = async (item: ProductCompetitorContentTextItem) => {
    const translatedText = await translateProductTextWithFeedback({
      text: competitorContentTranslationInputText(item),
      sourceLang: 'AUTO',
      targetLang: 'ZH',
      loadingKey: `competitor-translation-${item.key}`,
      emptyMessage: '当前竞品文案为空，无法生成中文翻译',
      setLoading,
      setNotice: setTranslationNotice(item.key)
    });
    if (translatedText) {
      setCompetitorTranslations((current) => ({ ...current, [item.key]: translatedText }));
    }
  };

  const generateCompetitorDraft = async () => {
    if (!competitorTextItems.length || !selectedCompetitorTexts.length) {
      const warning = competitorTextItems.length
        ? '请先选择要参与 AI 整合的竞品素材'
        : '当前没有可用于整合的竞品素材';
      setCompetitorNotice({ type: 'warning', message: warning });
      message.warning(warning);
      return;
    }
    setCompetitorLoading(true);
    setCompetitorNotice(undefined);
    try {
      const result = await mergeProductCompetitorContent({
        fieldType,
        targetLang: lang,
        currentText: draftValue,
        competitorTexts: selectedCompetitorTexts
      });
      const mergedText = result.data?.draft?.text?.trim();
      if (result.ready === false || !mergedText) {
        const errorMessage = result.msg || result.message || '竞品 AI 整合没有返回结果';
        setCompetitorNotice({ type: 'error', message: errorMessage });
        message.error(errorMessage);
        return;
      }
      setDraftValue(mergedText);
      const sharedKeywords = fieldType === 'title'
        ? extractSharedProductTitleKeywords(mergedText, selectedCompetitorTexts)
        : [];
      await acceptSharedKeywords(sharedKeywords);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '竞品 AI 整合失败';
      setCompetitorNotice({ type: 'error', message: errorMessage });
      message.error(errorMessage);
    } finally {
      setCompetitorLoading(false);
    }
  };

  return {
    allCompetitorsSelected,
    competitorLoading,
    competitorNotice,
    competitorTranslations,
    generateCompetitorDraft,
    generateCompetitorTranslation,
    partiallySelected,
    selectedCompetitorKeys,
    selectedCompetitorTexts,
    toggleAllCompetitors,
    toggleCompetitorKey,
    translationNotices
  };
}
