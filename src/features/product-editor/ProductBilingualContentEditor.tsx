import { EditOutlined } from '@ant-design/icons';
import { Button, Col, Row, Space, Typography } from 'antd';
import { useState } from 'react';
import type { ProductCompetitorContentMaterial } from '../product-domain/productCompetitorContent';
import type { ProductMasterSnapshotPayload } from '../product-domain/productMasterSnapshot';
import { ProductContentFieldEditModal } from './ProductContentFieldEditModal';
import {
  PRODUCT_CONTENT_LANG_LABELS,
  type ProductContentEditableField,
  type ProductContentEditModalState,
  type ProductContentLang
} from './productContentEditorTypes';

const { Text } = Typography;

export function ProductBilingualContentEditor(props: {
  productSnapshotView?: ProductMasterSnapshotPayload;
  productCompetitorMaterials?: ProductCompetitorContentMaterial[];
  productListingKeywordSuggestions?: { EN?: string[]; AR?: string[] };
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
    productListingKeywordSuggestions,
    productSnapshotView,
    updateProductSectionField,
    updateProductMultilineField
  } = props;
  const content = productSnapshotView?.content;
  const [editModal, setEditModal] = useState<ProductContentEditModalState>();
  const fieldValue = (fieldType: ProductContentEditableField, lang: ProductContentLang) => {
    if (fieldType === 'title') return text(lang === 'EN' ? content?.titleEn : content?.titleAr);
    if (fieldType === 'description') return text(lang === 'EN' ? content?.descriptionEn : content?.descriptionAr);
    return stringList(lang === 'EN' ? content?.highlightsEn : content?.highlightsAr).join('\n');
  };
  const translationSource = (fieldType: ProductContentEditableField, lang: ProductContentLang) => {
    const fallbackLang = lang === 'EN' ? 'AR' : 'EN';
    if (fieldType === 'title') return fieldValue('title', fallbackLang);
    if (fieldType === 'description') return fieldValue('description', fallbackLang);
    return stringList(fallbackLang === 'EN' ? content?.highlightsEn : content?.highlightsAr).join('\n');
  };
  const updateFieldValue = (fieldType: ProductContentEditableField, lang: ProductContentLang, value: string) => {
    if (fieldType === 'title') {
      updateProductSectionField('content', lang === 'EN' ? 'titleEn' : 'titleAr', value);
    } else if (fieldType === 'description') {
      updateProductSectionField('content', lang === 'EN' ? 'descriptionEn' : 'descriptionAr', value);
    } else {
      updateProductMultilineField(lang === 'EN' ? 'highlightsEn' : 'highlightsAr', value);
    }
  };
  const openEditor = (fieldType: ProductContentEditableField, lang: ProductContentLang) => {
    setEditModal({ fieldType, lang, value: fieldValue(fieldType, lang), sourceText: translationSource(fieldType, lang) });
  };
  return (
    <>
      <Row gutter={[16, 16]}>
        {(['EN', 'AR'] as const).map((lang) => (
          <Col key={lang} xs={24} lg={12}>
            <LanguageContentColumn lang={lang} openEditor={openEditor} productSnapshotView={productSnapshotView} />
          </Col>
        ))}
      </Row>
      {editModal ? (
        <ProductContentFieldEditModal
          open
          enableCompetitorContentMerge={enableCompetitorContentMerge}
          fieldType={editModal.fieldType}
          lang={editModal.lang}
          materials={productCompetitorMaterials}
          suggestedKeywords={productListingKeywordSuggestions?.[editModal.lang] || []}
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
  lang: ProductContentLang;
  productSnapshotView?: ProductMasterSnapshotPayload;
  openEditor: (fieldType: ProductContentEditableField, lang: ProductContentLang) => void;
}) {
  const { lang, openEditor, productSnapshotView } = props;
  const content = productSnapshotView?.content;
  const title = text(lang === 'EN' ? content?.titleEn : content?.titleAr);
  const description = text(lang === 'EN' ? content?.descriptionEn : content?.descriptionAr);
  const highlights = stringList(lang === 'EN' ? content?.highlightsEn : content?.highlightsAr);
  return (
    <Space direction="vertical" size={14} style={{ width: '100%' }}>
      <Text strong style={{ color: 'var(--pm-text-primary)', fontSize: 15 }}>
        {PRODUCT_CONTENT_LANG_LABELS[lang]}
      </Text>
      <ContentFieldPreview label="标题" value={title} onEdit={() => openEditor('title', lang)} />
      <ContentFieldPreview label="详情" value={stripHtml(description)} onEdit={() => openEditor('description', lang)} />
      <ContentFieldPreview label="卖点" value="" items={highlights} lang={lang} onEdit={() => openEditor('highlights', lang)} />
    </Space>
  );
}

function ContentFieldPreview(props: {
  label: string;
  value: string;
  items?: string[];
  lang?: ProductContentLang;
  onEdit: () => void;
}) {
  const { items, label, lang, onEdit, value } = props;
  return (
    <div style={{ borderBottom: '1px solid var(--pm-border-subtle, #e5e7eb)', paddingBottom: 12 }}>
      <Space align="center" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={{ color: 'var(--pm-text-muted)' }}>{label}</Text>
        <Button
          aria-label={`编辑${lang ? PRODUCT_CONTENT_LANG_LABELS[lang] : ''}${label}`}
          icon={<EditOutlined />}
          size="small"
          onClick={onEdit}
        >
          编辑
        </Button>
      </Space>
      {items ? items.length ? (
        <ul
          data-testid={lang ? `product-content-highlights-list-${lang}` : undefined}
          style={{ margin: 0, minHeight: 42, paddingInlineStart: 18, color: 'var(--pm-text-primary)', lineHeight: 1.6 }}
        >
          {items.map((item, index) => (
            <li key={`${item}-${index}`} data-testid={lang ? `product-content-highlight-item-${lang}` : undefined}>
              {item}
            </li>
          ))}
        </ul>
      ) : <PreviewText value="" /> : <PreviewText value={value} />}
    </div>
  );
}

function PreviewText({ value }: { value: string }) {
  return (
    <div style={{
      minHeight: 42, whiteSpace: 'pre-wrap',
      color: value ? 'var(--pm-text-primary)' : 'var(--pm-text-muted)', lineHeight: 1.6
    }}>
      {value || '未填写'}
    </div>
  );
}

function stringList(value?: unknown) {
  return Array.isArray(value) ? value.map((item) => text(item)).filter(Boolean) : [];
}

function text(value?: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
