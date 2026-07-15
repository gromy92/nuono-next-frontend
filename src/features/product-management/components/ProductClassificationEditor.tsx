import { EditOutlined, LinkOutlined } from '@ant-design/icons';
import { AutoComplete, Button, Col, Modal, Row, Space, Table, Tag, Typography } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchProductClassificationOptions, type ProductClassificationOptionPayload } from '../api';
import type { ProductFieldDomainSurface, ProductMasterSnapshotPayload } from '../types';
import type { ProductCompetitorContentMaterial } from '../types/competitorContent';
import { textInputValue } from '../utils';
import { ProductDetailSection } from './ProductDetailSection';

const { Text } = Typography;

const LABEL_STYLE = { color: 'var(--pm-text-muted)', display: 'block', marginBottom: 6 } as const;

type ProductCompetitorCategoryRow = {
  rowKey: string;
  competitorLabel: string;
  sourceHost: string;
  categoryPath: string;
  categoryUrl: string;
  productUrl: string;
  categoryValue: string;
};

function optionValue(option: ProductClassificationOptionPayload) {
  return textInputValue(option.value || option.label).trim();
}

function fulltypeParts(value: string) {
  const parts = value.split('-').map((item) => item.trim()).filter(Boolean);
  return {
    family: parts[0] ?? '',
    productType: parts[1] ?? '',
    productSubtype: parts.length > 2 ? parts.slice(2).join('-') : ''
  };
}

function isOfficialNoonFulltypeCode(value: string) {
  return /^[a-z0-9_]+-[a-z0-9_]+-[a-z0-9_]+$/.test(value.trim());
}

function normalizeOptions(
  options: ProductClassificationOptionPayload[],
  currentValue: string,
  shouldAppendCurrent: (value: string) => boolean = () => true
) {
  const seen = new Set<string>();
  const result = options
    .map((option) => ({ ...option, value: optionValue(option) }))
    .filter((option) => {
      const value = option.value.trim();
      const key = value.toLowerCase();
      if (!value || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  if (currentValue && shouldAppendCurrent(currentValue) && !seen.has(currentValue.toLowerCase())) {
    result.unshift({ value: currentValue, label: currentValue, usageCount: undefined });
  }
  return result;
}

function sourceHostFromUrl(value?: string) {
  try {
    return new URL(textInputValue(value)).host;
  } catch {
    return '';
  }
}

function isCategoryLikeUrl(value?: string) {
  const normalized = textInputValue(value).toLowerCase();
  if (!normalized) {
    return false;
  }
  return (
    normalized.includes('/c/') ||
    normalized.includes('/category') ||
    normalized.includes('/categories') ||
    normalized.includes('/search') ||
    normalized.includes('/s?') ||
    normalized.includes('?rh=') ||
    normalized.includes('&rh=')
  );
}

function competitorLabel(material: ProductCompetitorContentMaterial, index: number) {
  return (
    textInputValue(material.titleEn) ||
    textInputValue(material.titleAr) ||
    textInputValue(material.note) ||
    textInputValue(material.url) ||
    `竞品 ${index + 1}`
  );
}

function buildProductCompetitorCategoryRows(
  materials: ProductCompetitorContentMaterial[] = []
): ProductCompetitorCategoryRow[] {
  return materials.flatMap((material, materialIndex) => {
    const sourceHost = textInputValue(material.sourceHost) || sourceHostFromUrl(material.url);
    const productUrl = textInputValue(material.url);
    const label = competitorLabel(material, materialIndex);
    const explicitLinks = (material.categoryLinks || []).filter(
      (item) => textInputValue(item.url) || textInputValue(item.path) || textInputValue(item.name)
    );

    if (explicitLinks.length) {
      return explicitLinks.map((item, linkIndex) => {
        const categoryValue = textInputValue(item.path) || textInputValue(item.name);
        return {
          rowKey: `${material.id || materialIndex}-${linkIndex}`,
          competitorLabel: label,
          sourceHost,
          categoryPath: categoryValue || '未命名类目',
          categoryUrl: textInputValue(item.url),
          productUrl,
          categoryValue
        };
      });
    }

    const categoryUrl = textInputValue(material.categoryUrl) || (isCategoryLikeUrl(productUrl) ? productUrl : '');
    const categoryValue = textInputValue(material.categoryPath) || textInputValue(material.categoryName);
    if (!categoryValue && !categoryUrl) {
      return [];
    }
    return [
      {
        rowKey: material.id || String(materialIndex),
        competitorLabel: label,
        sourceHost,
        categoryPath: categoryValue || label,
        categoryUrl,
        productUrl,
        categoryValue
      }
    ];
  });
}

export function ProductClassificationEditor(props: {
  productMainDomain?: ProductFieldDomainSurface;
  productSnapshotView?: ProductMasterSnapshotPayload;
  productCompetitorMaterials?: ProductCompetitorContentMaterial[];
  updateProductSectionField: (
    section: 'identity' | 'taxonomy' | 'content' | 'group',
    field: string,
    value: unknown
  ) => void;
}) {
  const { productMainDomain, productSnapshotView, productCompetitorMaterials, updateProductSectionField } = props;
  const taxonomy = productSnapshotView?.taxonomy ?? {};
  const storeContext = productSnapshotView?.storeContext ?? {};
  const ownerUserId = Number(storeContext.ownerUserId);
  const storeCode = textInputValue(storeContext.storeCode);
  const brand = textInputValue(productSnapshotView?.identity.brand);
  const productFulltype = textInputValue(taxonomy.productFulltype);
  const [categoryEditorOpen, setCategoryEditorOpen] = useState(false);
  const [classificationOptions, setClassificationOptions] = useState<{
    brands: ProductClassificationOptionPayload[];
    fulltypes: ProductClassificationOptionPayload[];
  }>({ brands: [], fulltypes: [] });

  const loadClassificationOptions = useCallback(
    async (query?: { brandQuery?: string; fulltypeQuery?: string }) => {
      if (!Number.isFinite(ownerUserId) || !storeCode) {
        setClassificationOptions({ brands: [], fulltypes: [] });
        return;
      }
      try {
        const payload = await fetchProductClassificationOptions({
          ownerUserId,
          storeCode,
          brandQuery: query?.brandQuery,
          fulltypeQuery: query?.fulltypeQuery,
          limit: 120
        });
        setClassificationOptions({
          brands: payload.brands ?? [],
          fulltypes: payload.fulltypes ?? []
        });
      } catch {
        setClassificationOptions({ brands: [], fulltypes: [] });
      }
    },
    [ownerUserId, storeCode]
  );

  useEffect(() => {
    if (!Number.isFinite(ownerUserId) || !storeCode) {
      setClassificationOptions({ brands: [], fulltypes: [] });
      return;
    }

    void loadClassificationOptions();
  }, [loadClassificationOptions, ownerUserId, storeCode]);

  const brandOptions = useMemo(
    () =>
      normalizeOptions(classificationOptions.brands, brand).map((option) => ({
        value: option.value,
        label: option.value
      })),
    [brand, classificationOptions.brands]
  );

  const fulltypeOptions = useMemo(
    () =>
      normalizeOptions(classificationOptions.fulltypes, productFulltype, isOfficialNoonFulltypeCode).map((option) => ({
        value: option.value,
        label: option.value
      })),
    [classificationOptions.fulltypes, productFulltype]
  );
  const competitorCategoryRows = useMemo(
    () => buildProductCompetitorCategoryRows(productCompetitorMaterials || []),
    [productCompetitorMaterials]
  );

  const updateFulltype = (value: string) => {
    updateProductSectionField('taxonomy', 'productFulltype', value);
    const parts = fulltypeParts(value);
    updateProductSectionField('taxonomy', 'family', parts.family);
    updateProductSectionField('taxonomy', 'productType', parts.productType);
    updateProductSectionField('taxonomy', 'productSubtype', parts.productSubtype);
  };

  const renderFulltypeInput = () => (
    <AutoComplete
      allowClear
      aria-label="Product Fulltype"
      filterOption={false}
      options={fulltypeOptions}
      placeholder="请选择或输入官方类目"
      style={{ width: '100%' }}
      value={productFulltype}
      onFocus={() => void loadClassificationOptions()}
      onSearch={(value) => void loadClassificationOptions({ fulltypeQuery: value })}
      onChange={updateFulltype}
      onSelect={updateFulltype}
    />
  );

  return (
    <>
      <ProductDetailSection title="品牌与类目" domain={productMainDomain}>
        <Row gutter={[12, 12]}>
          <Col xs={24} md={12}>
            <Text style={LABEL_STYLE}>品牌</Text>
            <AutoComplete
              allowClear
              aria-label="品牌"
              filterOption={false}
              options={brandOptions}
              placeholder="请选择或输入品牌"
              style={{ width: '100%' }}
              value={brand}
              onFocus={() => void loadClassificationOptions()}
              onSearch={(value) => void loadClassificationOptions({ brandQuery: value })}
              onChange={(value) => updateProductSectionField('identity', 'brand', value)}
            />
          </Col>
          <Col xs={24} md={12}>
            <Space align="center" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ color: 'var(--pm-text-muted)' }}>Product Fulltype（官方类目）</Text>
              <Button
                size="small"
                icon={<EditOutlined />}
                data-testid="product-listing-category-editor-button"
                onClick={() => setCategoryEditorOpen(true)}
              >
                编辑类目
              </Button>
            </Space>
            {renderFulltypeInput()}
          </Col>
        </Row>
      </ProductDetailSection>

      <Modal
        title="编辑类目"
        open={categoryEditorOpen}
        width={920}
        destroyOnClose={false}
        footer={[
          <Button key="close" type="primary" onClick={() => setCategoryEditorOpen(false)}>
            完成
          </Button>
        ]}
        onCancel={() => setCategoryEditorOpen(false)}
      >
        <Space direction="vertical" size={14} style={{ width: '100%' }}>
          <Space direction="vertical" size={6} style={{ width: '100%' }}>
            <Text strong>当前官方类目</Text>
            {renderFulltypeInput()}
          </Space>
          <Space align="center" size={8}>
            <Text strong>竞品类目</Text>
            <Tag color="blue" style={{ marginInlineEnd: 0 }}>
              {competitorCategoryRows.length}
            </Tag>
          </Space>
          <Table<ProductCompetitorCategoryRow>
            data-testid="product-listing-competitor-category-table"
            rowKey="rowKey"
            size="small"
            pagination={false}
            dataSource={competitorCategoryRows}
            columns={[
              {
                title: '竞品',
                dataIndex: 'competitorLabel',
                width: 260,
                render: (value: string) => (
                  <Typography.Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 0 }}>
                    {value}
                  </Typography.Paragraph>
                )
              },
              {
                title: '来源',
                dataIndex: 'sourceHost',
                width: 130,
                render: (value: string) => value || '-'
              },
              {
                title: '类目',
                dataIndex: 'categoryPath',
                render: (value: string) => (
                  <Text type={value === '暂无类目链接' ? 'secondary' : undefined}>{value}</Text>
                )
              },
              {
                title: '链接',
                width: 160,
                render: (_, record) => (
                  <Space size={8}>
                    {record.categoryUrl ? (
                      <Typography.Link href={record.categoryUrl} target="_blank" rel="noreferrer">
                        类目
                      </Typography.Link>
                    ) : null}
                    {record.productUrl ? (
                      <Typography.Link href={record.productUrl} target="_blank" rel="noreferrer">
                        商品
                      </Typography.Link>
                    ) : null}
                    {!record.categoryUrl && !record.productUrl ? <Text type="secondary">暂无</Text> : null}
                  </Space>
                )
              },
              {
                title: '操作',
                width: 110,
                render: (_, record) => (
                  <Button
                    size="small"
                    icon={<LinkOutlined />}
                    disabled={!isOfficialNoonFulltypeCode(record.categoryValue)}
                    title={isOfficialNoonFulltypeCode(record.categoryValue)
                      ? '填入官方 Product Fulltype'
                      : '竞品前台类目仅供参考，请从官方类目列表选择'}
                    onClick={() => updateFulltype(record.categoryValue)}
                  >
                    填入
                  </Button>
                )
              }
            ]}
            locale={{ emptyText: '当前上架资料暂无竞品类目' }}
          />
        </Space>
      </Modal>
    </>
  );
}
