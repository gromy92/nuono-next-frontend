import { message } from 'antd';
import { useEffect, useState } from 'react';
import type { ProductCompetitorContentMaterial } from '../product-domain/productCompetitorContent';
import type { ProductMasterSnapshotPayload } from '../product-domain/productMasterSnapshot';
import {
  type LoadingMap,
  type TranslationNotice,
  translateProductTextWithFeedback
} from './ProductContentTranslationEditor.helpers';
import { copyProductContentText } from './productContentClipboard';
import type { ProductContentKeywordSaveChangeDetails } from './productContentKeywordEditor';
import type {
  ProductContentEditableField,
  ProductContentLang
} from './productContentEditorTypes';
import { useProductCompetitorContentEditor } from './useProductCompetitorContentEditor';
import { useProductTitleKeywordEditor } from './useProductTitleKeywordEditor';

export function useProductContentFieldEditor(params: {
  fieldType: ProductContentEditableField;
  lang: ProductContentLang;
  materials: ProductCompetitorContentMaterial[];
  onSave: (value: string) => void;
  open: boolean;
  productSnapshotView?: ProductMasterSnapshotPayload;
  sourceText: string;
  suggestedKeywords: string[];
  value: string;
}) {
  const {
    fieldType, lang, materials, onSave, open, productSnapshotView,
    sourceText, suggestedKeywords, value
  } = params;
  const [draftValue, setDraftValue] = useState(value);
  const [translationDraft, setTranslationDraft] = useState('');
  const [loading, setLoading] = useState<LoadingMap>({});
  const [translationNotice, setTranslationNotice] = useState<TranslationNotice>(null);
  const [saveConfirmDetail, setSaveConfirmDetail] = useState<ProductContentKeywordSaveChangeDetails | null>(null);
  const [saveConfirmError, setSaveConfirmError] = useState<string | null>(null);
  const keyword = useProductTitleKeywordEditor({
    draftValue,
    fieldType,
    lang,
    loading,
    materials,
    open,
    productSnapshotView,
    setLoading,
    suggestedKeywords,
    value
  });
  const competitor = useProductCompetitorContentEditor({
    acceptSharedKeywords: keyword.acceptSharedKeywords,
    competitorTextItems: keyword.competitorTextItems,
    draftValue,
    fieldType,
    lang,
    loading,
    open,
    setDraftValue,
    setLoading
  });

  useEffect(() => {
    if (!open) return;
    setDraftValue(value);
    setTranslationDraft('');
    setTranslationNotice(null);
    setLoading({});
    setSaveConfirmDetail(null);
    setSaveConfirmError(null);
  }, [fieldType, lang, open, value]);

  const updateDraftValue = (nextValue: string) => {
    setSaveConfirmDetail(null);
    setDraftValue(nextValue);
  };

  const generateTranslation = async () => {
    const fieldTranslationSource = draftValue.trim() ? draftValue : sourceText;
    const translatedText = await translateProductTextWithFeedback({
      text: fieldTranslationSource,
      sourceLang: draftValue.trim() ? lang : 'AUTO',
      targetLang: 'ZH',
      loadingKey: 'field-edit-translation',
      emptyMessage: '当前没有可用于翻译成中文的源文案',
      setLoading,
      setNotice: setTranslationNotice
    });
    if (translatedText) setTranslationDraft(translatedText);
  };

  const copyTitleKeywordToClipboard = async (label: string) => {
    try {
      await copyProductContentText(label);
      message.success(`已复制关键词：${label}`);
    } catch {
      message.warning('复制失败，请手动复制关键词');
    }
  };

  const persistAndSave = async () => {
    setSaveConfirmError(null);
    try {
      await keyword.saveKeywordRows();
      setSaveConfirmDetail(null);
      onSave(draftValue);
    } catch (error) {
      const errorMessage = error instanceof Error
        ? `关键词或竞品保存失败：${error.message}`
        : '关键词或竞品保存失败';
      setSaveConfirmError(errorMessage);
      message.error(errorMessage);
    }
  };

  const requestProductContentSave = () => {
    const detail = keyword.buildSaveDetail(value);
    if (!detail.messages.length) {
      void persistAndSave();
      return;
    }
    setSaveConfirmDetail(detail);
    setSaveConfirmError(null);
  };

  return {
    competitor,
    copyTitleKeywordToClipboard,
    draftValue,
    generateTranslation,
    keyword,
    loading,
    persistAndSave,
    requestProductContentSave,
    saveConfirmDetail,
    saveConfirmError,
    setSaveConfirmDetail,
    setSaveConfirmError,
    translationDraft,
    translationNotice,
    updateDraftValue
  };
}

export type ProductContentFieldEditorController = ReturnType<typeof useProductContentFieldEditor>;
