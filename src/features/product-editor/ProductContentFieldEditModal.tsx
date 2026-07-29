import { Button, Col, Input, Modal, Row, Space } from 'antd';
import type { ProductCompetitorContentMaterial } from '../product-domain/productCompetitorContent';
import type { ProductMasterSnapshotPayload } from '../product-domain/productMasterSnapshot';
import { ProductCompetitorContentSection } from './ProductCompetitorContentSection';
import { ProductContentSaveConfirmModal } from './ProductContentSaveConfirmModal';
import { ProductContentTranslationSection } from './ProductContentTranslationSection';
import { ProductKeywordCompetitorMatchModal } from './ProductKeywordCompetitorMatchModal';
import { ProductTitleKeywordPanel } from './ProductTitleKeywordPanel';
import {
  PRODUCT_CONTENT_FIELD_LABELS,
  PRODUCT_CONTENT_LANG_LABELS,
  type ProductContentEditableField,
  type ProductContentLang
} from './productContentEditorTypes';
import { useProductContentFieldEditor } from './useProductContentFieldEditor';

export function ProductContentFieldEditModal(props: {
  open: boolean;
  fieldType: ProductContentEditableField;
  lang: ProductContentLang;
  value: string;
  sourceText: string;
  productSnapshotView?: ProductMasterSnapshotPayload;
  materials: ProductCompetitorContentMaterial[];
  suggestedKeywords: string[];
  enableCompetitorContentMerge: boolean;
  onSave: (value: string) => void;
  onCancel: () => void;
}) {
  const {
    enableCompetitorContentMerge, fieldType, lang, materials, onCancel, onSave,
    open, productSnapshotView, sourceText, suggestedKeywords, value
  } = props;
  const controller = useProductContentFieldEditor({
    fieldType, lang, materials, onSave, open, productSnapshotView, sourceText, suggestedKeywords, value
  });
  const { keyword } = controller;
  return (
    <Modal
      destroyOnClose
      open={open}
      title={`编辑${PRODUCT_CONTENT_LANG_LABELS[lang]}${PRODUCT_CONTENT_FIELD_LABELS[fieldType]}`}
      width={fieldType === 'title' ? 1180 : 820}
      closable={!keyword.keywordSaving}
      keyboard={!keyword.keywordSaving}
      maskClosable={!keyword.keywordSaving}
      onCancel={() => {
        if (!keyword.keywordSaving) onCancel();
      }}
      footer={[
        <Button key="cancel" disabled={keyword.keywordSaving} onClick={onCancel}>取消</Button>,
        <Button
          key="save"
          loading={keyword.keywordSaving}
          type="primary"
          onClick={controller.requestProductContentSave}
        >
          保存内容
        </Button>
      ]}
    >
      <Row data-testid="product-content-modal-layout" gutter={[16, 16]} align="top">
        <Col xs={24} lg={fieldType === 'title' ? 16 : 24} data-testid="product-content-left-panel">
          <Space direction="vertical" size={14} style={{ width: '100%' }}>
            <Input.TextArea
              aria-label={`${PRODUCT_CONTENT_LANG_LABELS[lang]}${PRODUCT_CONTENT_FIELD_LABELS[fieldType]}内容`}
              autoSize={{ minRows: fieldType === 'title' ? 3 : 6, maxRows: fieldType === 'title' ? 6 : 12 }}
              value={controller.draftValue}
              onChange={(event) => controller.updateDraftValue(event.target.value)}
            />
            <ProductContentTranslationSection
              loading={controller.loading}
              notice={controller.translationNotice}
              translationDraft={controller.translationDraft}
              onGenerate={() => void controller.generateTranslation()}
            />
            {enableCompetitorContentMerge ? <ProductCompetitorContentSection controller={controller} /> : null}
          </Space>
        </Col>
        {fieldType === 'title' ? (
          <Col xs={24} lg={8} data-testid="product-content-keyword-panel">
            <div style={{ position: 'sticky', top: 0 }}>
              <ProductTitleKeywordPanel controller={controller} lang={lang} />
            </div>
          </Col>
        ) : null}
      </Row>
      <ProductKeywordCompetitorMatchModal
        open={Boolean(keyword.competitorMatchRowId)}
        row={keyword.automaticKeywordRows.find((row) => row.id === keyword.competitorMatchRowId)}
        competitors={keyword.noonCompetitorItems}
        productTitle={controller.draftValue}
        onCancel={() => keyword.setCompetitorMatchRowId(undefined)}
      />
      <ProductContentSaveConfirmModal
        detail={controller.saveConfirmDetail}
        errorMessage={controller.saveConfirmError}
        loading={keyword.keywordSaving}
        onCancel={() => {
          controller.setSaveConfirmDetail(null);
          controller.setSaveConfirmError(null);
        }}
        onConfirm={() => void controller.persistAndSave()}
      />
    </Modal>
  );
}
