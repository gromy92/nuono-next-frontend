import { CopyOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Alert, Button, Checkbox, Col, Empty, Input, List, Modal, Row, Space, Tag, Tooltip, Typography, message as antdMessage } from 'antd';
import { type Dispatch, type SetStateAction, useEffect, useMemo, useRef, useState } from 'react';
import { fetchProductKeywordProduct, saveProductKeywordEditorChanges } from '../../product-keywords/api';
import { translateProductContentText } from '../api';
import { mergeProductCompetitorContent } from '../productCompetitorContentApi';
import type { ProductMasterSnapshotPayload } from '../types';
import type {
  ProductCompetitorContentFieldType,
  ProductCompetitorContentMaterial
} from '../types/competitorContent';
import { normalizeStringList, textInputValue } from '../utils';
import {
  setLoadingKey,
  type LoadingMap,
  type TranslationNotice,
  translateProductTextWithFeedback
} from './ProductContentTranslationEditor.helpers';
import {
  extractSharedProductTitleKeywords,
  normalizeProductTitleKeywordInput,
  parseProductTitleKeywordInputList,
  splitProductTitleKeywordHighlights,
  type ProductTitleSharedKeyword
} from './productCompetitorContentKeywords';
import {
  collectProductCompetitorContentTextItems,
  competitorContentTranslationInputText,
  initialSelectedCompetitorContentKeys,
  selectedCompetitorContentTexts
} from './productCompetitorContentSources';
import {
  buildProductContentKeywordSaveChangeDetails,
  dedupeProductCompetitorContentTextItems,
  competitorEvidenceFromItem,
  competitorMaterialsFromKeywordEvents,
  competitorSourceDisplayText,
  competitorSourceLinkTitle,
  editableKeywordRowsFromPanel,
  hasChineseText,
  keywordRowHasKeywordChange,
  keywordRowKeywords,
  keywordRowsForSave,
  noonCompetitorTextItems,
  titleKeywordChineseTranslations,
  type ProductContentKeywordSaveChangeDetails,
  type ProductContentKeywordInputRow
} from './productContentKeywordEditor';

const { Text } = Typography;

type ContentLang = 'EN' | 'AR';
type EditableFieldType = ProductCompetitorContentFieldType;

type EditModalState = {
  fieldType: EditableFieldType;
  lang: ContentLang;
  value: string;
  sourceText: string;
};

const LANG_LABELS: Record<ContentLang, string> = {
  EN: '英语',
  AR: '阿语'
};

const FIELD_LABELS: Record<EditableFieldType, string> = {
  title: '标题',
  description: '详情',
  highlights: '卖点'
};

const TITLE_KEYWORD_HIGHLIGHT_STYLES = {
  generated: {
    backgroundColor: '#eff6ff',
    borderColor: '#93c5fd',
    color: '#1d4ed8'
  },
  competitor: {
    backgroundColor: '#fff7ed',
    borderColor: '#fdba74',
    color: '#c2410c'
  }
};

export function ProductBilingualContentEditor(props: {
  productSnapshotView?: ProductMasterSnapshotPayload;
  productCompetitorMaterials?: ProductCompetitorContentMaterial[];
  enableCompetitorContentMerge?: boolean;
  updateProductSectionField: (
    section: 'identity' | 'taxonomy' | 'content' | 'group',
    field: string,
    value: unknown
  ) => void;
  updateProductMultilineField: (field: 'highlightsEn' | 'highlightsAr' | 'images', value: string) => void;
}) {
  const {
    enableCompetitorContentMerge = false,
    productCompetitorMaterials = [],
    productSnapshotView,
    updateProductSectionField,
    updateProductMultilineField
  } = props;
  const content = productSnapshotView?.content;
  const [editModal, setEditModal] = useState<EditModalState>();

  const fieldValue = (fieldType: EditableFieldType, lang: ContentLang) => {
    if (fieldType === 'title') {
      return textInputValue(lang === 'EN' ? content?.titleEn : content?.titleAr);
    }
    if (fieldType === 'description') {
      return textInputValue(lang === 'EN' ? content?.descriptionEn : content?.descriptionAr);
    }
    return normalizeStringList(lang === 'EN' ? content?.highlightsEn : content?.highlightsAr).join('\n');
  };

  const translationSource = (fieldType: EditableFieldType, lang: ContentLang) => {
    const fallbackLang = lang === 'EN' ? 'AR' : 'EN';
    if (fieldType === 'title') {
      return fieldValue('title', fallbackLang);
    }
    if (fieldType === 'description') {
      return fieldValue('description', fallbackLang);
    }
    return normalizeStringList(fallbackLang === 'EN' ? content?.highlightsEn : content?.highlightsAr).join('\n');
  };

  const updateFieldValue = (fieldType: EditableFieldType, lang: ContentLang, value: string) => {
    if (fieldType === 'title') {
      updateProductSectionField('content', lang === 'EN' ? 'titleEn' : 'titleAr', value);
      return;
    }
    if (fieldType === 'description') {
      updateProductSectionField('content', lang === 'EN' ? 'descriptionEn' : 'descriptionAr', value);
      return;
    }
    updateProductMultilineField(lang === 'EN' ? 'highlightsEn' : 'highlightsAr', value);
  };

  const openEditor = (fieldType: EditableFieldType, lang: ContentLang) => {
    setEditModal({
      fieldType,
      lang,
      value: fieldValue(fieldType, lang),
      sourceText: translationSource(fieldType, lang)
    });
  };

  return (
    <>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <LanguageContentColumn lang="EN" openEditor={openEditor} productSnapshotView={productSnapshotView} />
        </Col>
        <Col xs={24} lg={12}>
          <LanguageContentColumn lang="AR" openEditor={openEditor} productSnapshotView={productSnapshotView} />
        </Col>
      </Row>
      {editModal ? (
        <ProductContentFieldEditModal
          open
          enableCompetitorContentMerge={enableCompetitorContentMerge}
          fieldType={editModal.fieldType}
          lang={editModal.lang}
          materials={productCompetitorMaterials}
          productSnapshotView={productSnapshotView}
          sourceText={editModal.sourceText}
          value={editModal.value}
          onCancel={() => setEditModal(undefined)}
          onSave={(value) => {
            updateFieldValue(editModal.fieldType, editModal.lang, value);
            setEditModal(undefined);
          }}
        />
      ) : null}
    </>
  );
}

function LanguageContentColumn(props: {
  lang: ContentLang;
  productSnapshotView?: ProductMasterSnapshotPayload;
  openEditor: (fieldType: EditableFieldType, lang: ContentLang) => void;
}) {
  const { lang, openEditor, productSnapshotView } = props;
  const content = productSnapshotView?.content;
  const title = textInputValue(lang === 'EN' ? content?.titleEn : content?.titleAr);
  const description = textInputValue(lang === 'EN' ? content?.descriptionEn : content?.descriptionAr);
  const highlights = normalizeStringList(lang === 'EN' ? content?.highlightsEn : content?.highlightsAr);
  const langLabel = LANG_LABELS[lang];

  return (
    <Space direction="vertical" size={14} style={{ width: '100%' }}>
      <Text strong style={{ color: 'var(--pm-text-primary)', fontSize: 15 }}>
        {langLabel}
      </Text>
      <ContentFieldPreview
        label="标题"
        editButtonLabel={`编辑${langLabel}标题`}
        value={title}
        onEdit={() => openEditor('title', lang)}
      />
      <ContentFieldPreview
        label="详情"
        editButtonLabel={`编辑${langLabel}详情`}
        value={stripHtml(description)}
        onEdit={() => openEditor('description', lang)}
      />
      <ContentFieldPreview
        label="卖点"
        editButtonLabel={`编辑${langLabel}卖点`}
        value=""
        highlightItems={highlights}
        lang={lang}
        onEdit={() => openEditor('highlights', lang)}
      />
    </Space>
  );
}

function ContentFieldPreview(props: {
  label: string;
  editButtonLabel: string;
  value: string;
  highlightItems?: string[];
  lang?: ContentLang;
  onEdit: () => void;
}) {
  const { editButtonLabel, highlightItems, label, lang, onEdit, value } = props;
  const hasHighlights = Boolean(highlightItems?.length);
  return (
    <div
      style={{
        borderBottom: '1px solid var(--pm-border-subtle, #e5e7eb)',
        paddingBottom: 12
      }}
    >
      <Space align="center" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={{ color: 'var(--pm-text-muted)' }}>{label}</Text>
        <Button aria-label={editButtonLabel} icon={<EditOutlined />} size="small" onClick={onEdit}>
          编辑
        </Button>
      </Space>
      {highlightItems ? (
        hasHighlights ? (
          <ul
            data-testid={lang ? `product-content-highlights-list-${lang}` : undefined}
            style={{
              margin: 0,
              minHeight: 42,
              paddingInlineStart: 18,
              color: 'var(--pm-text-primary)',
              lineHeight: 1.6
            }}
          >
            {highlightItems.map((item, index) => (
              <li key={`${item}-${index}`} data-testid={lang ? `product-content-highlight-item-${lang}` : undefined}>
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <div style={{ minHeight: 42, color: 'var(--pm-text-muted)', lineHeight: 1.6 }}>未填写</div>
        )
      ) : (
        <div
          style={{
            minHeight: 42,
            whiteSpace: 'pre-wrap',
            color: value ? 'var(--pm-text-primary)' : 'var(--pm-text-muted)',
            lineHeight: 1.6
          }}
        >
          {value || '未填写'}
        </div>
      )}
    </div>
  );
}

function ProductContentFieldEditModal(props: {
  open: boolean;
  fieldType: EditableFieldType;
  lang: ContentLang;
  value: string;
  sourceText: string;
  productSnapshotView?: ProductMasterSnapshotPayload;
  materials: ProductCompetitorContentMaterial[];
  enableCompetitorContentMerge: boolean;
  onSave: (value: string) => void;
  onCancel: () => void;
}) {
  const {
    enableCompetitorContentMerge,
    fieldType,
    lang,
    materials,
    onCancel,
    onSave,
    open,
    productSnapshotView,
    sourceText,
    value
  } = props;
  const [draftValue, setDraftValue] = useState(value);
  const [translationDraft, setTranslationDraft] = useState('');
  const [loading, setLoading] = useState<LoadingMap>({});
  const [translationNotice, setTranslationNotice] = useState<TranslationNotice>(null);
  const [competitorLoading, setCompetitorLoading] = useState(false);
  const [competitorNotice, setCompetitorNotice] = useState<{ type: 'error' | 'warning'; message: string }>();
  const [selectedCompetitorKeys, setSelectedCompetitorKeys] = useState<string[]>([]);
  const [competitorTranslations, setCompetitorTranslations] = useState<Record<string, string>>({});
  const [competitorTranslationNotices, setCompetitorTranslationNotices] = useState<Record<string, TranslationNotice>>({});
  const [titleKeywords, setTitleKeywords] = useState<ProductTitleSharedKeyword[]>([]);
  const [titleKeywordTranslations, setTitleKeywordTranslations] = useState<Record<string, string>>({});
  const [keywordTranslationNotice, setKeywordTranslationNotice] = useState<TranslationNotice>(null);
  const [keywordInputRows, setKeywordInputRows] = useState<ProductContentKeywordInputRow[]>([]);
  const [deletedKeywordRows, setDeletedKeywordRows] = useState<Array<{ id: number; value: string }>>([]);
  const [keywordPanelLoading, setKeywordPanelLoading] = useState(false);
  const [keywordSaving, setKeywordSaving] = useState(false);
  const keywordRowsDirtyRef = useRef(false);
  const [saveConfirmDetail, setSaveConfirmDetail] = useState<ProductContentKeywordSaveChangeDetails | null>(null);
  const [saveConfirmError, setSaveConfirmError] = useState<string | null>(null);
  const [keywordPanelCompetitorMaterials, setKeywordPanelCompetitorMaterials] = useState<ProductCompetitorContentMaterial[]>([]);
  const [competitorPickerRowId, setCompetitorPickerRowId] = useState<string>();
  const combinedMaterials = useMemo(
    () => [...materials, ...keywordPanelCompetitorMaterials],
    [keywordPanelCompetitorMaterials, materials]
  );
  const competitorTextItems = useMemo(
    () => dedupeProductCompetitorContentTextItems(collectProductCompetitorContentTextItems(combinedMaterials, fieldType, lang)),
    [combinedMaterials, fieldType, lang]
  );
  const noonCompetitorItems = useMemo(() => noonCompetitorTextItems(competitorTextItems), [competitorTextItems]);
  const selectedCompetitorTexts = useMemo(
    () => selectedCompetitorContentTexts(competitorTextItems, selectedCompetitorKeys),
    [competitorTextItems, selectedCompetitorKeys]
  );
  const selectedCompetitorKeywordEvidenceItems = (row: ProductContentKeywordInputRow) => {
    const selectedKeySet = new Set(row.competitorSourceKeys || []);
    return noonCompetitorItems.filter((item) => selectedKeySet.has(item.key)).map(competitorEvidenceFromItem);
  };
  const allCompetitorsSelected = competitorTextItems.length > 0 && selectedCompetitorKeys.length === competitorTextItems.length;
  const partiallySelected = selectedCompetitorKeys.length > 0 && selectedCompetitorKeys.length < competitorTextItems.length;
  const keywordManagementScope = useMemo(() => {
    const storeCode = textInputValue(productSnapshotView?.storeContext.storeCode);
    const siteCode = textInputValue(
      productSnapshotView?.storeContext.siteCode ??
        productSnapshotView?.storeContext.site ??
        siteCodeFromStoreCode(storeCode)
    );
    const partnerSku = textInputValue(
      productSnapshotView?.identity.partnerSku ?? productSnapshotView?.identity.psku
    );
    const persistentPartnerSku = partnerSku.toUpperCase() === 'NEW-LISTING' ? '' : partnerSku;
    return storeCode && siteCode && persistentPartnerSku
      ? { storeCode, siteCode, partnerSku: persistentPartnerSku }
      : undefined;
  }, [productSnapshotView]);
  const langLabel = LANG_LABELS[lang];
  const fieldLabel = FIELD_LABELS[fieldType];
  const supportsTitleKeywords = fieldType === 'title';
  const keywordEditingDisabled = keywordPanelLoading || keywordSaving;
  const keywordScopeKey = keywordManagementScope
    ? `${keywordManagementScope.storeCode}|${keywordManagementScope.siteCode}|${keywordManagementScope.partnerSku}`
    : '';

  useEffect(() => {
    if (!open) {
      return;
    }
    setDraftValue(value);
    setTranslationDraft('');
    setTranslationNotice(null);
    setCompetitorNotice(undefined);
    setSelectedCompetitorKeys(initialSelectedCompetitorContentKeys(competitorTextItems));
    setCompetitorTranslations({});
    setCompetitorTranslationNotices({});
    setTitleKeywords([]);
    setTitleKeywordTranslations({});
    setKeywordTranslationNotice(null);
    setKeywordInputRows([]);
    setDeletedKeywordRows([]);
    setKeywordPanelCompetitorMaterials([]);
    setCompetitorPickerRowId(undefined);
    setLoading({});
    setCompetitorLoading(false);
    setKeywordPanelLoading(false);
    setKeywordSaving(false);
    keywordRowsDirtyRef.current = false;
    setSaveConfirmDetail(null);
    setSaveConfirmError(null);
  }, [open, value, fieldType, lang]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setSelectedCompetitorKeys(initialSelectedCompetitorContentKeys(competitorTextItems));
  }, [competitorTextItems, open]);

  useEffect(() => {
    if (!open || !supportsTitleKeywords || !keywordManagementScope) {
      return;
    }
    let cancelled = false;
    setKeywordPanelLoading(true);
    fetchProductKeywordProduct(keywordManagementScope.partnerSku, {
      storeCode: keywordManagementScope.storeCode,
      siteCode: keywordManagementScope.siteCode
    })
      .then((panel) => {
        if (cancelled) {
          return;
        }
        if (!keywordRowsDirtyRef.current) {
          setKeywordInputRows(editableKeywordRowsFromPanel(panel));
          setDeletedKeywordRows([]);
        }
        setKeywordPanelCompetitorMaterials(competitorMaterialsFromKeywordEvents(panel.events));
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        if (!keywordRowsDirtyRef.current) {
          setKeywordInputRows([]);
          setKeywordPanelCompetitorMaterials([]);
        }
        antdMessage.warning(error instanceof Error ? error.message : '已有关键词加载失败');
      })
      .finally(() => {
        if (!cancelled) {
          setKeywordPanelLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [keywordManagementScope, keywordScopeKey, open, supportsTitleKeywords]);

  const setCompetitorTranslationNotice = (key: string): Dispatch<SetStateAction<TranslationNotice>> => (nextValue) => {
    setCompetitorTranslationNotices((currentValue) => {
      const currentNotice = currentValue[key] ?? null;
      const resolvedValue = typeof nextValue === 'function' ? nextValue(currentNotice) : nextValue;
      return {
        ...currentValue,
        [key]: resolvedValue
      };
    });
  };

  const toggleCompetitorKey = (key: string, checked: boolean) => {
    setSaveConfirmDetail(null);
    setSelectedCompetitorKeys((currentValue) =>
      checked
        ? currentValue.includes(key)
          ? currentValue
          : [...currentValue, key]
        : currentValue.filter((item) => item !== key)
    );
  };

  const toggleAllCompetitors = (checked: boolean) => {
    setSaveConfirmDetail(null);
    setSelectedCompetitorKeys(checked ? initialSelectedCompetitorContentKeys(competitorTextItems) : []);
  };

  const copyTitleKeywordToClipboard = async (label: string) => {
    try {
      await copyTextToClipboard(label);
      antdMessage.success(`已复制关键词：${label}`);
    } catch (error) {
      antdMessage.warning('复制失败，请手动复制关键词');
    }
  };

  const addKeywordInputRow = () => {
    keywordRowsDirtyRef.current = true;
    setSaveConfirmDetail(null);
    setKeywordInputRows((currentValue) => [
      ...currentValue,
      { id: `manual-${Date.now()}-${currentValue.length}`, value: '', competitorSourceKeys: [] }
    ]);
  };

  const updateKeywordInputRow = (rowId: string, value: string) => {
    keywordRowsDirtyRef.current = true;
    setSaveConfirmDetail(null);
    setKeywordInputRows((currentValue) =>
      currentValue.map((row) => (row.id === rowId ? { ...row, value } : row))
    );
  };

  const deleteKeywordInputRow = (rowId: string) => {
    keywordRowsDirtyRef.current = true;
    setSaveConfirmDetail(null);
    setKeywordInputRows((currentValue) => {
      const deletedRow = currentValue.find((row) => row.id === rowId);
      if (deletedRow?.sourceKeywordId) {
        setDeletedKeywordRows((currentDeleted) => currentDeleted.some((row) => row.id === deletedRow.sourceKeywordId)
          ? currentDeleted
          : [...currentDeleted, {
              id: deletedRow.sourceKeywordId as number,
              value: deletedRow.originalValue || deletedRow.value
            }]);
      }
      return currentValue.filter((row) => row.id !== rowId);
    });
  };

  const saveKeywordRowsToManagement = async () => {
    if (!keywordManagementScope) {
      if (keywordRowsForSave(keywordInputRows).some((row) =>
        keywordRowHasKeywordChange(row) || Boolean(row.competitorSourceKeys?.length)
      ) || deletedKeywordRows.length) {
        throw new Error('缺少店铺、站点或正式 PSKU，无法保存关键词');
      }
      return;
    }
    const rowsToSave = keywordRowsForSave(keywordInputRows);
    const changedRows = rowsToSave.filter((row) =>
      keywordRowHasKeywordChange(row) || Boolean(row.competitorSourceKeys?.length)
    );
    if (!changedRows.length && !deletedKeywordRows.length) {
      return;
    }
    setKeywordSaving(true);
    try {
      const result = await saveProductKeywordEditorChanges({
        ...keywordManagementScope,
        deletedKeywordIds: deletedKeywordRows.map((row) => row.id),
        rows: changedRows.flatMap((row) => {
          const keywords = keywordRowKeywords(row);
          const competitorSources = selectedCompetitorKeywordEvidenceItems(row);
          return keywords.map((keyword, index) => ({
            keywordId: index === 0 ? row.sourceKeywordId : undefined,
            keyword,
            saveKeyword: index === 0 && keywordRowHasKeywordChange(row),
            competitorSources
          }));
        })
      });
      const keywordSaveCount = changedRows.filter(keywordRowHasKeywordChange).length + deletedKeywordRows.length;
      const competitorSaveCount = changedRows.reduce(
        (count, row) => count + selectedCompetitorKeywordEvidenceItems(row).length,
        0
      );
      setKeywordInputRows(editableKeywordRowsFromPanel(result));
      setKeywordPanelCompetitorMaterials(competitorMaterialsFromKeywordEvents(result.events));
      setDeletedKeywordRows([]);
      keywordRowsDirtyRef.current = false;
      antdMessage.success(`已保存关键词变更 ${keywordSaveCount} 个，竞品证据 ${competitorSaveCount} 条`);
    } catch (error) {
      antdMessage.error(error instanceof Error ? error.message : '竞品关键词写入失败');
      throw error;
    } finally {
      setKeywordSaving(false);
    }
  };

  const openCompetitorPickerForKeywordRow = (row: ProductContentKeywordInputRow) => {
    const selectedKeywords = parseProductTitleKeywordInputList(row.value);
    if (!selectedKeywords.length) {
      antdMessage.warning('请先填写关键词');
      return;
    }
    if (!noonCompetitorItems.length) {
      antdMessage.warning('当前没有可添加的 Noon 竞品');
      return;
    }
    setCompetitorPickerRowId(row.id);
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
    if (translatedText) {
      setTranslationDraft(translatedText);
    }
  };

  const generateCompetitorTranslation = async (item: (typeof competitorTextItems)[number]) => {
    const translatedText = await translateProductTextWithFeedback({
      text: competitorContentTranslationInputText(item),
      sourceLang: 'AUTO',
      targetLang: 'ZH',
      loadingKey: `competitor-translation-${item.key}`,
      emptyMessage: '当前竞品文案为空，无法生成中文翻译',
      setLoading,
      setNotice: setCompetitorTranslationNotice(item.key)
    });
    if (translatedText) {
      setCompetitorTranslations((currentValue) => ({
        ...currentValue,
        [item.key]: translatedText
      }));
    }
  };

  const translateTitleKeywordsToChinese = async (keywords: ProductTitleSharedKeyword[]) => {
    if (lang !== 'AR' || !keywords.length) {
      setTitleKeywordTranslations({});
      setKeywordTranslationNotice(null);
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
      const translatedText = result.data?.translation?.text || '';
      const nextTranslations = titleKeywordChineseTranslations(keywords, translatedText);
      const hasAnyChineseTranslation = Object.values(nextTranslations).some(hasChineseText);
      if (result.ready === false || !hasAnyChineseTranslation) {
        if (!Object.values(fallbackTranslations).some(hasChineseText)) {
          setKeywordTranslationNotice({
            type: 'warning',
            message: result.msg || result.message || '阿语关键词未返回中文翻译'
          });
        }
        return;
      }
      setTitleKeywordTranslations({
        ...fallbackTranslations,
        ...nextTranslations
      });
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

  const generateCompetitorDraft = async () => {
    if (!competitorTextItems.length) {
      const warningMessage = '当前没有可用于整合的竞品素材';
      setCompetitorNotice({ type: 'warning', message: warningMessage });
      antdMessage.warning(warningMessage);
      return;
    }
    if (!selectedCompetitorTexts.length) {
      const warningMessage = '请先选择要参与 AI 整合的竞品素材';
      setCompetitorNotice({ type: 'warning', message: warningMessage });
      antdMessage.warning(warningMessage);
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
        antdMessage.error(errorMessage);
        return;
      }
      setDraftValue(mergedText);
      const sharedKeywords = fieldType === 'title'
        ? extractSharedProductTitleKeywords(mergedText, selectedCompetitorTexts)
        : [];
      setTitleKeywords(sharedKeywords);
      setSaveConfirmDetail(null);
      await translateTitleKeywordsToChinese(sharedKeywords);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '竞品 AI 整合失败';
      setCompetitorNotice({ type: 'error', message: errorMessage });
      antdMessage.error(errorMessage);
    } finally {
      setCompetitorLoading(false);
    }
  };

  const persistAndSave = async () => {
    setSaveConfirmError(null);
    try {
      if (supportsTitleKeywords) {
        await saveKeywordRowsToManagement();
      }
      setSaveConfirmDetail(null);
      onSave(draftValue);
    } catch (error) {
      const errorMessage = error instanceof Error
        ? `关键词或竞品保存失败：${error.message}`
        : '关键词或竞品保存失败';
      setSaveConfirmError(errorMessage);
      antdMessage.error(errorMessage);
    }
  };

  const requestProductContentSave = () => {
    const competitorLabelsByRowId = supportsTitleKeywords
      ? Object.fromEntries(
        keywordInputRows.map((row) => [
          row.id,
          selectedCompetitorKeywordEvidenceItems(row).map((item) => item.label)
        ])
      )
      : {};
    const detail = buildProductContentKeywordSaveChangeDetails({
      fieldType,
      initialValue: value,
      draftValue,
      rows: supportsTitleKeywords ? keywordInputRows : [],
      deletedKeywords: supportsTitleKeywords ? deletedKeywordRows.map((row) => row.value) : [],
      competitorLabelsByRowId
    });
    if (!detail.messages.length) {
      void persistAndSave();
      return;
    }
    setSaveConfirmDetail(detail);
    setSaveConfirmError(null);
  };

  const fieldEditor = (
    <Input.TextArea
      aria-label={`${langLabel}${fieldLabel}内容`}
      autoSize={{ minRows: fieldType === 'title' ? 3 : 6, maxRows: fieldType === 'title' ? 6 : 12 }}
      value={draftValue}
      onChange={(event) => {
        setSaveConfirmDetail(null);
        setDraftValue(event.target.value);
      }}
    />
  );

  const translationSection = (
    <div>
      <Space align="center" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <Space size={8}>
          <Text strong>翻译</Text>
          <Tag color="processing">翻译成中文</Tag>
        </Space>
        <Button loading={Boolean(loading['field-edit-translation'])} onClick={() => void generateTranslation()}>
          生成中文翻译
        </Button>
      </Space>
      {translationNotice ? <Alert showIcon type={translationNotice.type} message={translationNotice.message} /> : null}
      <div
        data-testid="product-content-translation-draft-preview"
        style={{
          color: translationDraft ? 'var(--pm-text-primary)' : 'var(--pm-text-muted)',
          lineHeight: 1.6,
          minHeight: 24,
          padding: '2px 0',
          whiteSpace: 'pre-wrap'
        }}
      >
        {translationDraft || '点击生成翻译后在这里显示结果'}
      </div>
    </div>
  );

  const titleKeywordPanel = supportsTitleKeywords ? (
    <div
      data-testid="product-competitor-shared-keywords"
      style={{
        border: '1px solid #e0e7ff',
        borderRadius: 6,
        background: '#f8fafc',
        padding: '10px 12px'
      }}
    >
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        <Space size={8}>
          <Text strong>共用关键词</Text>
          <Tag color="geekblue">{titleKeywords.length}</Tag>
          {lang === 'AR' && loading['title-keyword-translation'] ? <Tag color="processing">翻译中</Tag> : null}
        </Space>
        {keywordTranslationNotice ? (
          <Alert showIcon type={keywordTranslationNotice.type} message={keywordTranslationNotice.message} />
        ) : null}
        {titleKeywords.length ? (
          <Space size={[6, 6]} wrap>
            {titleKeywords.map((keyword) => (
              <Tooltip key={keyword.key} title="点击复制关键词">
                <Tag
                  data-testid="product-competitor-keyword-chip"
                  color="geekblue"
                  style={{ cursor: 'pointer' }}
                  onClick={() => void copyTitleKeywordToClipboard(keyword.label)}
                >
                  <CopyOutlined style={{ marginRight: 4 }} />
                  {keyword.label}
                  {titleKeywordTranslations[keyword.key] ? `（${titleKeywordTranslations[keyword.key]}）` : ''}
                </Tag>
              </Tooltip>
            ))}
          </Space>
        ) : (
          <Text type="secondary">AI整合后会在这里显示共用关键词，点击可复制。</Text>
        )}
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Space align="center" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text type="secondary">关键词管理</Text>
            {keywordPanelLoading ? <Tag color="processing">加载中</Tag> : null}
          </Space>
          {keywordInputRows.length ? (
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              {keywordInputRows.map((row, index) => (
                <Space key={row.id} align="center" size={8} style={{ display: 'flex', width: '100%' }}>
                  <Input
                    data-testid="product-competitor-keyword-row-input"
                    disabled={keywordEditingDisabled}
                    placeholder={`关键词${index + 1}`}
                    value={row.value}
                    onChange={(event) => updateKeywordInputRow(row.id, event.target.value)}
                  />
                  <Button
                    disabled={keywordEditingDisabled || !noonCompetitorItems.length}
                    style={{ flex: '0 0 auto' }}
                    onClick={() => openCompetitorPickerForKeywordRow(row)}
                  >
                    {row.competitorSourceKeys?.length ? `已选 ${row.competitorSourceKeys.length}` : '添加到竞品'}
                  </Button>
                  <Tooltip title="删除关键词">
                    <Button
                      aria-label="删除关键词"
                      danger
                      disabled={keywordEditingDisabled}
                      icon={<DeleteOutlined />}
                      style={{ flex: '0 0 auto' }}
                      onClick={() => deleteKeywordInputRow(row.id)}
                    />
                  </Tooltip>
                </Space>
              ))}
            </Space>
          ) : (
            <Text type="secondary">暂无标题关键词，点击下方添加。</Text>
          )}
          <Button
            block
            disabled={keywordPanelLoading}
            icon={<PlusOutlined />}
            loading={keywordSaving}
            onClick={addKeywordInputRow}
          >
            添加关键词
          </Button>
        </Space>
      </Space>
    </div>
  ) : null;

  const competitorSection = enableCompetitorContentMerge ? (
    <div>
      <Space align="center" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <Space size={8}>
          <Text strong>竞品</Text>
          <Tag color="processing">
            {selectedCompetitorTexts.length}/{competitorTextItems.length} 条参与整合
          </Tag>
          {competitorTextItems.length ? (
            <Checkbox
              checked={allCompetitorsSelected}
              indeterminate={partiallySelected}
              onChange={(event) => toggleAllCompetitors(event.target.checked)}
            >
              全选
            </Checkbox>
          ) : null}
        </Space>
        <Button disabled={!selectedCompetitorTexts.length} loading={competitorLoading} onClick={() => void generateCompetitorDraft()}>
          AI整合
        </Button>
      </Space>
      {competitorNotice ? <Alert showIcon type={competitorNotice.type} message={competitorNotice.message} /> : null}
      {competitorTextItems.length ? (
        <List
          bordered
          size="small"
          dataSource={competitorTextItems}
          renderItem={(item, index) => (
            <List.Item key={item.key} style={{ background: selectedCompetitorKeys.includes(item.key) ? '#f8fafc' : '#fff' }}>
              <Space align="start" size={10} style={{ width: '100%' }}>
                <Checkbox
                  checked={selectedCompetitorKeys.includes(item.key)}
                  style={{ marginTop: 4 }}
                  onChange={(event) => toggleCompetitorKey(item.key, event.target.checked)}
                />
                <Space direction="vertical" size={6} style={{ width: '100%' }}>
                  <Space size={8} wrap>
                    <Text type="secondary">竞品 {index + 1}</Text>
                    {item.source.url ? (
                      <Typography.Link href={item.source.url} rel="noreferrer" target="_blank" title={competitorSourceLinkTitle(item)}>
                        {competitorSourceDisplayText(item)}
                      </Typography.Link>
                    ) : (
                      <Text type="secondary">{competitorSourceDisplayText(item)}</Text>
                    )}
                    {item.source.platform === 'noon' ? <Tag color="geekblue">可添加竞品</Tag> : null}
                  </Space>
                  <Space align="start" size={10} style={{ display: 'flex', width: '100%' }}>
                    <Text style={{ flex: 1, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      <HighlightedKeywordText text={item.text} keywords={titleKeywords} tone="competitor" />
                    </Text>
                    <Button
                      loading={Boolean(loading[`competitor-translation-${item.key}`])}
                      size="small"
                      onClick={() => void generateCompetitorTranslation(item)}
                    >
                      翻译
                    </Button>
                  </Space>
                  {competitorTranslationNotices[item.key] ? (
                    <Alert
                      showIcon
                      type={competitorTranslationNotices[item.key]?.type}
                      message={competitorTranslationNotices[item.key]?.message}
                    />
                  ) : null}
                  {competitorTranslations[item.key] ? (
                    <div
                      style={{
                        background: '#f6ffed',
                        border: '1px solid #b7eb8f',
                        borderRadius: 6,
                        color: '#135200',
                        lineHeight: 1.6,
                        padding: '8px 10px',
                        whiteSpace: 'pre-wrap'
                      }}
                    >
                      {competitorTranslations[item.key]}
                    </div>
                  ) : null}
                </Space>
              </Space>
            </List.Item>
          )}
        />
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无竞品素材" />
      )}
    </div>
  ) : null;

  return (
    <Modal
      destroyOnClose
      open={open}
      title={`编辑${langLabel}${fieldLabel}`}
      width={fieldType === 'title' ? 1180 : 820}
      closable={!keywordSaving}
      keyboard={!keywordSaving}
      maskClosable={!keywordSaving}
      onCancel={() => {
        if (!keywordSaving) {
          onCancel();
        }
      }}
      footer={[
        <Button key="cancel" disabled={keywordSaving} onClick={onCancel}>
          取消
        </Button>,
        <Button key="save" loading={keywordSaving} type="primary" onClick={requestProductContentSave}>
          保存内容
        </Button>
      ]}
    >
      <Row data-testid="product-content-modal-layout" gutter={[16, 16]} align="top">
        <Col xs={24} lg={fieldType === 'title' ? 16 : 24} data-testid="product-content-left-panel">
          <Space direction="vertical" size={14} style={{ width: '100%' }}>
            {fieldEditor}
            {translationSection}
            {competitorSection}
          </Space>
        </Col>
        {fieldType === 'title' ? (
          <Col xs={24} lg={8} data-testid="product-content-keyword-panel">
            <div style={{ position: 'sticky', top: 0 }}>{titleKeywordPanel}</div>
          </Col>
        ) : null}
      </Row>
      <ProductKeywordCompetitorPickerModal
        open={Boolean(competitorPickerRowId)}
        row={keywordInputRows.find((row) => row.id === competitorPickerRowId)}
        competitors={noonCompetitorItems}
        onCancel={() => setCompetitorPickerRowId(undefined)}
        onSave={(rowId, selectedKeys) => {
          setSaveConfirmDetail(null);
          keywordRowsDirtyRef.current = true;
          setKeywordInputRows((currentValue) =>
            currentValue.map((row) => (row.id === rowId ? { ...row, competitorSourceKeys: selectedKeys } : row))
          );
          setCompetitorPickerRowId(undefined);
        }}
      />
      <ProductContentSaveConfirmModal
        detail={saveConfirmDetail}
        errorMessage={saveConfirmError}
        loading={keywordSaving}
        onCancel={() => {
          setSaveConfirmDetail(null);
          setSaveConfirmError(null);
        }}
        onConfirm={() => void persistAndSave()}
      />
    </Modal>
  );
}

function ProductContentSaveConfirmModal(props: {
  detail: ProductContentKeywordSaveChangeDetails | null;
  errorMessage?: string | null;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { detail, errorMessage, loading, onCancel, onConfirm } = props;

  return (
    <Modal
      destroyOnClose
      open={Boolean(detail)}
      title="确认保存本次修改"
      width={720}
      confirmLoading={loading}
      closable={!loading}
      keyboard={!loading}
      maskClosable={!loading}
      okText="确认保存"
      cancelText="返回修改"
      onCancel={() => {
        if (!loading) {
          onCancel();
        }
      }}
      onOk={onConfirm}
    >
      {detail ? (
        <Space data-testid="product-content-save-confirm-modal" direction="vertical" size={14} style={{ width: '100%' }}>
          <Alert showIcon type="warning" message="请确认本次修改内容，确认后会保存到当前商品草稿。" />
          {errorMessage ? <Alert showIcon type="error" message="保存失败，请处理后重试" description={errorMessage} /> : null}
          {detail.titleChanged ? (
            <div>
              <Text strong>标题修改</Text>
              <Space direction="vertical" size={8} style={{ marginTop: 8, width: '100%' }}>
                <SaveConfirmTextBlock label="修改前" value={detail.titleBefore || '未填写'} />
                <SaveConfirmTextBlock label="修改后" value={detail.titleAfter || '未填写'} />
              </Space>
            </div>
          ) : null}
          {detail.keywordDetails.length ? (
            <SaveConfirmList title="关键词变更" items={detail.keywordDetails} />
          ) : null}
          {detail.competitorDetails.length ? (
            <SaveConfirmList title="竞品变更" items={detail.competitorDetails} />
          ) : null}
        </Space>
      ) : null}
    </Modal>
  );
}

function SaveConfirmTextBlock(props: { label: string; value: string }) {
  const { label, value } = props;
  return (
    <div>
      <Text type="secondary">{label}</Text>
      <div
        style={{
          background: '#f8fafc',
          border: '1px solid #e5e7eb',
          borderRadius: 6,
          lineHeight: 1.6,
          marginTop: 4,
          padding: '8px 10px',
          whiteSpace: 'pre-wrap'
        }}
      >
        {value}
      </div>
    </div>
  );
}

function SaveConfirmList(props: { title: string; items: string[] }) {
  const { items, title } = props;
  return (
    <div>
      <Text strong>{title}</Text>
      <ul style={{ margin: '8px 0 0', paddingInlineStart: 20 }}>
        {items.map((item) => (
          <li key={item} style={{ lineHeight: 1.7 }}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProductKeywordCompetitorPickerModal(props: {
  open: boolean;
  row?: ProductContentKeywordInputRow;
  competitors: ReturnType<typeof noonCompetitorTextItems>;
  onCancel: () => void;
  onSave: (rowId: string, selectedKeys: string[]) => void;
}) {
  const { competitors, onCancel, onSave, open, row } = props;
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setSelectedKeys(row?.competitorSourceKeys || []);
  }, [open, row]);

  const toggleCompetitor = (key: string, checked: boolean) => {
    setSelectedKeys((currentValue) =>
      checked
        ? currentValue.includes(key)
          ? currentValue
          : [...currentValue, key]
        : currentValue.filter((item) => item !== key)
    );
  };

  return (
    <Modal
      destroyOnClose
      open={open}
      title="选择要添加的 Noon 竞品"
      width={720}
      onCancel={onCancel}
      onOk={() => {
        if (row) {
          onSave(row.id, selectedKeys);
        }
      }}
      okText="确认选择"
      cancelText="取消"
    >
      <Space direction="vertical" size={10} style={{ width: '100%' }}>
        <Text type="secondary">只展示 Noon 竞品；Amazon 和其它来源只作为参考，不写入系统竞品。</Text>
        {competitors.length ? (
          <List
            bordered
            size="small"
            dataSource={competitors}
            renderItem={(item) => (
              <List.Item key={item.key}>
                <Space align="start" size={10} style={{ width: '100%' }}>
                  <Checkbox
                    checked={selectedKeys.includes(item.key)}
                    style={{ marginTop: 4 }}
                    onChange={(event) => toggleCompetitor(item.key, event.target.checked)}
                  />
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    {item.source.url ? (
                      <Typography.Link href={item.source.url} rel="noreferrer" target="_blank" title={competitorSourceLinkTitle(item)}>
                        {competitorSourceDisplayText(item)}
                      </Typography.Link>
                    ) : (
                      <Text>{competitorSourceDisplayText(item)}</Text>
                    )}
                    <Text type="secondary" style={{ whiteSpace: 'pre-wrap' }}>
                      {item.text}
                    </Text>
                  </Space>
                </Space>
              </List.Item>
            )}
          />
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无 Noon 竞品" />
        )}
      </Space>
    </Modal>
  );
}

function HighlightedKeywordText(props: {
  text: string;
  keywords: ProductTitleSharedKeyword[];
  tone: 'generated' | 'competitor';
}) {
  const { keywords, text, tone } = props;
  const parts = splitProductTitleKeywordHighlights(text, keywords);
  const style = TITLE_KEYWORD_HIGHLIGHT_STYLES[tone];
  const testId =
    tone === 'generated' ? 'product-competitor-generated-title-keyword' : 'product-competitor-source-title-keyword';

  return (
    <span style={{ whiteSpace: 'pre-wrap' }}>
      {parts.map((part, index) =>
        part.highlighted ? (
          <span
            key={`${part.text}-${index}`}
            data-testid={testId}
            style={{
              backgroundColor: style.backgroundColor,
              border: `1px solid ${style.borderColor}`,
              borderRadius: 4,
              color: style.color,
              padding: '0 3px'
            }}
          >
            {part.text}
          </span>
        ) : (
          part.text
        )
      )}
    </span>
  );
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

async function copyTextToClipboard(value: string) {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  if (typeof document === 'undefined') {
    throw new Error('clipboard unavailable');
  }
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  document.body.removeChild(textarea);
  if (!copied) {
    throw new Error('copy command failed');
  }
}

function siteCodeFromStoreCode(storeCode: string) {
  const match = storeCode.toUpperCase().match(/-N?([A-Z]{2})$/);
  return match?.[1] || '';
}
