import { message } from 'antd';
import { type Dispatch, type SetStateAction, useEffect, useMemo, useRef, useState } from 'react';
import { fetchProductKeywordProduct, saveProductKeywordEditorChanges } from '../product-keywords/api';
import type { ProductMasterSnapshotPayload } from '../product-domain/productMasterSnapshot';
import type { ProductCompetitorContentMaterial } from '../product-domain/productCompetitorContent';
import type { LoadingMap } from './ProductContentTranslationEditor.helpers';
import {
  buildProductContentKeywordSaveChangeDetails,
  competitorEvidenceFromItem,
  competitorMaterialsFromKeywordEvents,
  dedupeProductCompetitorContentTextItems,
  editableKeywordRowsFromPanel,
  keywordRowHasKeywordChange,
  keywordRowKeywords,
  keywordRowsForSave,
  noonCompetitorTextItems,
  type ProductContentKeywordInputRow
} from './productContentKeywordEditor';
import {
  collectProductCompetitorContentTextItems
} from './productCompetitorContentSources';
import type { ProductTitleSharedKeyword } from './productCompetitorContentKeywords';
import {
  matchingCompetitorsForKeyword,
  matchingCompetitorsForKeywordRow,
  mergeAiSuggestedKeywordRows,
  sharedAiTitleKeywords,
  withAutomaticKeywordCompetitorMatches
} from './productKeywordCompetitorMatching';
import type { ProductContentEditableField, ProductContentLang } from './productContentEditorTypes';
import { useProductTitleKeywordTranslations } from './useProductTitleKeywordTranslations';

export function useProductTitleKeywordEditor(params: {
  draftValue: string;
  fieldType: ProductContentEditableField;
  lang: ProductContentLang;
  loading: LoadingMap;
  materials: ProductCompetitorContentMaterial[];
  open: boolean;
  productSnapshotView?: ProductMasterSnapshotPayload;
  setLoading: Dispatch<SetStateAction<LoadingMap>>;
  suggestedKeywords: string[];
  value: string;
}) {
  const {
    draftValue, fieldType, lang, loading, materials, open, productSnapshotView,
    setLoading, suggestedKeywords, value
  } = params;
  const [keywordInputRows, setKeywordInputRows] = useState<ProductContentKeywordInputRow[]>([]);
  const [deletedKeywordRows, setDeletedKeywordRows] = useState<Array<{ id: number; value: string }>>([]);
  const [keywordPanelLoading, setKeywordPanelLoading] = useState(false);
  const [keywordSaving, setKeywordSaving] = useState(false);
  const [keywordPanelMaterials, setKeywordPanelMaterials] = useState<ProductCompetitorContentMaterial[]>([]);
  const [competitorMatchRowId, setCompetitorMatchRowId] = useState<string>();
  const [titleKeywords, setTitleKeywords] = useState<ProductTitleSharedKeyword[]>([]);
  const keywordRowsDirtyRef = useRef(false);
  const supportsTitleKeywords = fieldType === 'title';
  const suggestedKeywordKey = suggestedKeywords.join('|');
  const translations = useProductTitleKeywordTranslations({ lang, loading, setLoading });
  const keywordManagementScope = useMemo(() => productKeywordScope(productSnapshotView), [productSnapshotView]);
  const keywordScopeKey = keywordManagementScope
    ? `${keywordManagementScope.storeCode}|${keywordManagementScope.siteCode}|${keywordManagementScope.partnerSku}`
    : '';
  const competitorTextItems = useMemo(
    () => dedupeProductCompetitorContentTextItems(
      collectProductCompetitorContentTextItems([...materials, ...keywordPanelMaterials], fieldType, lang)
    ),
    [fieldType, keywordPanelMaterials, lang, materials]
  );
  const noonCompetitorItems = useMemo(
    () => noonCompetitorTextItems(competitorTextItems),
    [competitorTextItems]
  );
  const automaticKeywordRows = useMemo(
    () => withAutomaticKeywordCompetitorMatches(keywordInputRows, draftValue, noonCompetitorItems),
    [draftValue, keywordInputRows, noonCompetitorItems]
  );

  useEffect(() => {
    if (!open) return;
    setTitleKeywords(sharedAiTitleKeywords(value, suggestedKeywords, noonCompetitorItems));
    setKeywordInputRows(mergeAiSuggestedKeywordRows([], suggestedKeywords));
    setDeletedKeywordRows([]);
    setKeywordPanelMaterials([]);
    setCompetitorMatchRowId(undefined);
    setKeywordPanelLoading(false);
    setKeywordSaving(false);
    keywordRowsDirtyRef.current = false;
    translations.resetKeywordTranslations();
  }, [fieldType, lang, open, suggestedKeywordKey, value]);

  useEffect(() => {
    if (!open || !supportsTitleKeywords || !keywordManagementScope) return;
    let cancelled = false;
    setKeywordPanelLoading(true);
    fetchProductKeywordProduct(keywordManagementScope.partnerSku, keywordManagementScope)
      .then((panel) => {
        if (cancelled) return;
        if (!keywordRowsDirtyRef.current) {
          setKeywordInputRows(mergeAiSuggestedKeywordRows(editableKeywordRowsFromPanel(panel), suggestedKeywords));
          setDeletedKeywordRows([]);
        }
        setKeywordPanelMaterials(competitorMaterialsFromKeywordEvents(panel.events));
      })
      .catch((error) => {
        if (cancelled) return;
        if (!keywordRowsDirtyRef.current) {
          setKeywordInputRows([]);
          setKeywordPanelMaterials([]);
        }
        message.warning(error instanceof Error ? error.message : '已有关键词加载失败');
      })
      .finally(() => {
        if (!cancelled) setKeywordPanelLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [keywordManagementScope, keywordScopeKey, open, suggestedKeywordKey, supportsTitleKeywords]);

  const addKeywordInputRow = () => {
    keywordRowsDirtyRef.current = true;
    setKeywordInputRows((rows) => [
      ...rows,
      { id: `manual-${Date.now()}-${rows.length}`, value: '', competitorSourceKeys: [] }
    ]);
  };

  const updateKeywordInputRow = (rowId: string, nextValue: string) => {
    keywordRowsDirtyRef.current = true;
    setKeywordInputRows((rows) =>
      rows.map((row) => row.id === rowId ? { ...row, value: nextValue, automatic: false } : row)
    );
  };

  const deleteKeywordInputRow = (rowId: string) => {
    keywordRowsDirtyRef.current = true;
    setKeywordInputRows((rows) => {
      const deleted = rows.find((row) => row.id === rowId);
      if (deleted?.sourceKeywordId) {
        setDeletedKeywordRows((current) => current.some((row) => row.id === deleted.sourceKeywordId)
          ? current
          : [...current, { id: deleted.sourceKeywordId as number, value: deleted.originalValue || deleted.value }]);
      }
      return rows.filter((row) => row.id !== rowId);
    });
  };

  const openAutomaticCompetitorMatches = (row: ProductContentKeywordInputRow) => {
    if (!keywordRowKeywords(row).length) {
      message.warning('请先填写关键词');
      return;
    }
    if (!matchingCompetitorsForKeywordRow(draftValue, row, noonCompetitorItems).length) {
      message.warning('我方标题和竞品标题中没有同时出现该关键词');
      return;
    }
    setCompetitorMatchRowId(row.id);
  };

  const acceptSharedKeywords = async (sharedKeywords: ProductTitleSharedKeyword[]) => {
    setTitleKeywords(sharedKeywords);
    if (sharedKeywords.length) {
      keywordRowsDirtyRef.current = true;
      setKeywordInputRows((rows) =>
        mergeAiSuggestedKeywordRows(rows, sharedKeywords.map((keyword) => keyword.label))
      );
    }
    await translations.translateTitleKeywordsToChinese(sharedKeywords);
  };

  const evidenceForRow = (row: ProductContentKeywordInputRow) =>
    matchingCompetitorsForKeywordRow(draftValue, row, noonCompetitorItems).map(competitorEvidenceFromItem);

  const buildSaveDetail = (initialValue: string) => buildProductContentKeywordSaveChangeDetails({
    fieldType,
    initialValue,
    draftValue,
    rows: supportsTitleKeywords ? automaticKeywordRows : [],
    deletedKeywords: supportsTitleKeywords ? deletedKeywordRows.map((row) => row.value) : [],
    competitorLabelsByRowId: supportsTitleKeywords
      ? Object.fromEntries(automaticKeywordRows.map((row) => [row.id, evidenceForRow(row).map((item) => item.label)]))
      : {}
  });

  const saveKeywordRows = async () => {
    if (!supportsTitleKeywords) return;
    if (!keywordManagementScope) {
      if (keywordRowsForSave(keywordInputRows).some((row) =>
        keywordRowHasKeywordChange(row) || Boolean(row.competitorSourceKeys?.length)
      ) || deletedKeywordRows.length) {
        throw new Error('缺少店铺、站点或正式 PSKU，无法保存关键词');
      }
      return;
    }
    const changedRows = keywordRowsForSave(automaticKeywordRows).filter((row) =>
      keywordRowHasKeywordChange(row) || Boolean(row.competitorSourceKeys?.length)
    );
    if (!changedRows.length && !deletedKeywordRows.length) return;
    setKeywordSaving(true);
    try {
      const result = await saveProductKeywordEditorChanges({
        ...keywordManagementScope,
        deletedKeywordIds: deletedKeywordRows.map((row) => row.id),
        rows: changedRows.flatMap((row) => keywordRowKeywords(row).map((keyword, index) => ({
          keywordId: index === 0 ? row.sourceKeywordId : undefined,
          keyword,
          saveKeyword: index === 0 && keywordRowHasKeywordChange(row),
          competitorSources: matchingCompetitorsForKeyword(draftValue, keyword, noonCompetitorItems)
            .map(competitorEvidenceFromItem)
        })))
      });
      setKeywordInputRows(editableKeywordRowsFromPanel(result));
      setKeywordPanelMaterials(competitorMaterialsFromKeywordEvents(result.events));
      setDeletedKeywordRows([]);
      keywordRowsDirtyRef.current = false;
      const keywordSaveCount = changedRows.filter(keywordRowHasKeywordChange).length + deletedKeywordRows.length;
      const competitorSaveCount = changedRows.reduce((count, row) => count + evidenceForRow(row).length, 0);
      message.success(`已保存关键词变更 ${keywordSaveCount} 个，竞品证据 ${competitorSaveCount} 条`);
    } finally {
      setKeywordSaving(false);
    }
  };

  return {
    ...translations, acceptSharedKeywords, addKeywordInputRow, automaticKeywordRows,
    buildSaveDetail, competitorMatchRowId, competitorTextItems, deleteKeywordInputRow,
    keywordEditingDisabled: keywordPanelLoading || keywordSaving, keywordPanelLoading,
    keywordSaving, noonCompetitorItems, openAutomaticCompetitorMatches, saveKeywordRows,
    setCompetitorMatchRowId, supportsTitleKeywords, titleKeywords, updateKeywordInputRow
  };
}

function productKeywordScope(snapshot?: ProductMasterSnapshotPayload) {
  const storeCode = text(snapshot?.storeContext.storeCode);
  const siteCode = text(
    snapshot?.storeContext.siteCode ?? snapshot?.storeContext.site ?? siteCodeFromStoreCode(storeCode)
  );
  const partnerSku = text(snapshot?.identity.partnerSku ?? snapshot?.identity.psku);
  const persistentPartnerSku = partnerSku.toUpperCase() === 'NEW-LISTING' ? '' : partnerSku;
  return storeCode && siteCode && persistentPartnerSku
    ? { storeCode, siteCode, partnerSku: persistentPartnerSku }
    : undefined;
}

function siteCodeFromStoreCode(storeCode: string) {
  return storeCode.toUpperCase().match(/-N?([A-Z]{2})$/)?.[1] || '';
}

function text(value?: unknown) {
  return String(value || '').trim();
}
