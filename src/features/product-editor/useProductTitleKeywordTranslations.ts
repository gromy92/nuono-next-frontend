import { type Dispatch, type SetStateAction, useState } from 'react';
import { setLoadingKey, type LoadingMap, type TranslationNotice } from './ProductContentTranslationEditor.helpers';
import { translateProductContentText } from './productContentApi';
import {
  hasChineseText,
  titleKeywordChineseTranslations
} from './productKeywordChineseTranslation';
import type { ProductTitleSharedKeyword } from './productCompetitorContentKeywords';
import type { ProductContentLang } from './productContentEditorTypes';

export function useProductTitleKeywordTranslations(params: {
  lang: ProductContentLang;
  loading: LoadingMap;
  setLoading: Dispatch<SetStateAction<LoadingMap>>;
}) {
  const { lang, setLoading } = params;
  const [titleKeywordTranslations, setTitleKeywordTranslations] = useState<Record<string, string>>({});
  const [keywordTranslationNotice, setKeywordTranslationNotice] = useState<TranslationNotice>(null);

  const resetKeywordTranslations = () => {
    setTitleKeywordTranslations({});
    setKeywordTranslationNotice(null);
  };

  const translateTitleKeywordsToChinese = async (keywords: ProductTitleSharedKeyword[]) => {
    if (lang !== 'AR' || !keywords.length) {
      resetKeywordTranslations();
      return;
    }
    const fallbackTranslations = titleKeywordChineseTranslations(keywords);
    setTitleKeywordTranslations(fallbackTranslations);
    setKeywordTranslationNotice(null);
    setLoadingKey(setLoading, 'title-keyword-translation', true);
    try {
      const result = await translateProductContentText({
        text: keywords.map((keyword) => keyword.label).join('\n'),
        sourceLang: 'AR',
        targetLang: 'ZH'
      });
      const nextTranslations = titleKeywordChineseTranslations(
        keywords,
        result.data?.translation?.text || ''
      );
      const hasTranslation = Object.values(nextTranslations).some(hasChineseText);
      if (result.ready === false || !hasTranslation) {
        if (!Object.values(fallbackTranslations).some(hasChineseText)) {
          setKeywordTranslationNotice({
            type: 'warning',
            message: result.msg || result.message || '阿语关键词未返回中文翻译'
          });
        }
        return;
      }
      setTitleKeywordTranslations({ ...fallbackTranslations, ...nextTranslations });
    } catch (error) {
      if (!Object.values(fallbackTranslations).some(hasChineseText)) {
        setKeywordTranslationNotice({
          type: 'error',
          message: error instanceof Error ? error.message : '阿语关键词翻译失败'
        });
      }
    } finally {
      setLoadingKey(setLoading, 'title-keyword-translation', false);
    }
  };

  return {
    keywordTranslationNotice,
    resetKeywordTranslations,
    titleKeywordTranslations,
    translateTitleKeywordsToChinese
  };
}
