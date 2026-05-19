import { AutoComplete, Col, Row, Typography } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchProductClassificationOptions, type ProductClassificationOptionPayload } from '../api';
import type { ProductFieldDomainSurface, ProductMasterSnapshotPayload } from '../types';
import { textInputValue } from '../utils';
import { ProductDetailSection } from './ProductDetailSection';

const { Text } = Typography;

const LABEL_STYLE = { color: 'var(--pm-text-muted)', display: 'block', marginBottom: 6 } as const;

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

function normalizeOptions(options: ProductClassificationOptionPayload[], currentValue: string) {
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
  if (currentValue && !seen.has(currentValue.toLowerCase())) {
    result.unshift({ value: currentValue, label: currentValue, usageCount: undefined });
  }
  return result;
}

export function ProductClassificationEditor(props: {
  productMainDomain?: ProductFieldDomainSurface;
  productSnapshotView?: ProductMasterSnapshotPayload;
  updateProductSectionField: (
    section: 'identity' | 'taxonomy' | 'content' | 'group',
    field: string,
    value: unknown
  ) => void;
}) {
  const { productMainDomain, productSnapshotView, updateProductSectionField } = props;
  const taxonomy = productSnapshotView?.taxonomy ?? {};
  const storeContext = productSnapshotView?.storeContext ?? {};
  const ownerUserId = Number(storeContext.ownerUserId);
  const storeCode = textInputValue(storeContext.storeCode);
  const brand = textInputValue(productSnapshotView?.identity.brand);
  const productFulltype = textInputValue(taxonomy.productFulltype);
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
      normalizeOptions(classificationOptions.fulltypes, productFulltype).map((option) => ({
        value: option.value,
        label: option.value
      })),
    [classificationOptions.fulltypes, productFulltype]
  );

  const updateFulltype = (value: string) => {
    updateProductSectionField('taxonomy', 'productFulltype', value);
    const parts = fulltypeParts(value);
    updateProductSectionField('taxonomy', 'family', parts.family);
    updateProductSectionField('taxonomy', 'productType', parts.productType);
    updateProductSectionField('taxonomy', 'productSubtype', parts.productSubtype);
  };

  return (
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
          <Text style={LABEL_STYLE}>Product Fulltype（官方类目）</Text>
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
        </Col>
      </Row>
    </ProductDetailSection>
  );
}
