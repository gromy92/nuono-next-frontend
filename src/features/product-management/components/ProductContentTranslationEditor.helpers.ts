import type { Dispatch, SetStateAction } from 'react';
import { message } from 'antd';
import { translateProductContentText } from '../api';

export type LangCode = 'ZH' | 'EN' | 'AR';

export type LoadingMap = Record<string, boolean>;

export type TranslationNotice = {
  type: 'error' | 'warning';
  message: string;
} | null;

export const FIELD_LABEL_STYLE = { color: 'var(--pm-text-muted)', display: 'block', marginBottom: 6 } as const;

export function setLoadingKey(setLoading: Dispatch<SetStateAction<LoadingMap>>, key: string, value: boolean) {
  setLoading((currentValue) => ({ ...currentValue, [key]: value }));
}

export function listWithValueAt(values: string[], index: number, value: string) {
  const nextValues = [...values];
  while (nextValues.length <= index) {
    nextValues.push('');
  }
  nextValues[index] = value;
  return nextValues;
}

export function trimTrailingEmpty(values: string[]) {
  const nextValues = [...values];
  while (nextValues.length > 0 && !nextValues[nextValues.length - 1].trim()) {
    nextValues.pop();
  }
  return nextValues;
}

export function resolveHighlightRows(zhValues: string[], enValues: string[], arValues: string[]) {
  return Math.max(1, zhValues.length, enValues.length, arValues.length);
}

export async function translateProductTextWithFeedback(params: {
  text: string;
  targetLang: LangCode;
  loadingKey: string;
  emptyMessage: string;
  setLoading: Dispatch<SetStateAction<LoadingMap>>;
  setNotice: Dispatch<SetStateAction<TranslationNotice>>;
}) {
  const { emptyMessage, loadingKey, setLoading, setNotice, targetLang, text } = params;
  if (!text.trim()) {
    message.warning(emptyMessage);
    setNotice({ type: 'warning', message: emptyMessage });
    return '';
  }

  setNotice(null);
  setLoadingKey(setLoading, loadingKey, true);
  try {
    const result = await translateProductContentText({ text, targetLang });
    const translatedText = result.data?.translation?.text;
    if (result.ready === false || !translatedText) {
      const errorMessage = result.msg || result.message || '翻译服务没有返回结果';
      message.error(errorMessage);
      setNotice({ type: 'error', message: errorMessage });
      return '';
    }
    if (translatedText.trim() === text.trim()) {
      const warningMessage = 'AI 未生成有效翻译，请调整原文后重试';
      message.warning(warningMessage);
      setNotice({ type: 'warning', message: warningMessage });
      return '';
    }
    return translatedText;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '翻译服务错误';
    message.error(errorMessage);
    setNotice({ type: 'error', message: errorMessage });
    return '';
  } finally {
    setLoadingKey(setLoading, loadingKey, false);
  }
}
