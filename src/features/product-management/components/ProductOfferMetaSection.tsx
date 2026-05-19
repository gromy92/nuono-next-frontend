import { useEffect, useMemo, useState } from 'react';
import { Button, Col, Input, Row, Select, Space, Tag, Tooltip, Typography, message } from 'antd';
import type { ProductMasterSnapshotPayload, ProductSummarySurface } from '../types';
import { siteOfferCode, textInputValue } from '../utils';

const { Text } = Typography;

const WARRANTY_OPTIONS = [
  { value: '0', label: 'No warranty' },
  { value: '3', label: '3 months' },
  { value: '6', label: '6 months' },
  { value: '12', label: '1 year' },
  { value: '24', label: '2 years' }
];

function findBarcodeAttribute(productSnapshotView?: ProductMasterSnapshotPayload) {
  return productSnapshotView?.keyAttributes.find((item) => {
    const code = textInputValue(item.code).toLowerCase();
    return ['barcode', 'gtin', 'ean', 'upc'].some((keyword) => code.includes(keyword));
  });
}

function splitBarcodeValues(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => splitBarcodeValues(item));
  }
  return textInputValue(value)
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function collectBarcodes(
  activeProductSiteOffer?: Record<string, unknown>,
  productSnapshotView?: ProductMasterSnapshotPayload,
  currentProductSummarySurface?: ProductSummarySurface | null
) {
  const summaryRecord = currentProductSummarySurface as Record<string, unknown> | null | undefined;
  const values = [
    currentProductSummarySurface?.barcode ??
      productSnapshotView?.identity.barcode ??
      productSnapshotView?.pricing.barcode ??
      activeProductSiteOffer?.barcode,
    summaryRecord?.barcodes,
    productSnapshotView?.identity.barcodes,
    productSnapshotView?.pricing.barcodes,
    activeProductSiteOffer?.barcodes,
    summaryRecord?.gtin,
    productSnapshotView?.identity.gtin,
    productSnapshotView?.pricing.gtin,
    activeProductSiteOffer?.gtin,
    summaryRecord?.ean,
    productSnapshotView?.identity.ean,
    productSnapshotView?.pricing.ean,
    activeProductSiteOffer?.ean,
    summaryRecord?.upc,
    productSnapshotView?.identity.upc,
    productSnapshotView?.pricing.upc,
    activeProductSiteOffer?.upc
  ];

  const matchedAttribute = findBarcodeAttribute(productSnapshotView);
  values.push(matchedAttribute?.commonValue, matchedAttribute?.enValue, matchedAttribute?.arValue);

  return Array.from(new Set(values.flatMap((item) => splitBarcodeValues(item))));
}

function warrantySelectOptions(value: string) {
  if (!value || WARRANTY_OPTIONS.some((item) => item.value === value)) {
    return WARRANTY_OPTIONS;
  }
  return [{ value, label: value }, ...WARRANTY_OPTIONS];
}

export function ProductOfferMetaSection(props: {
  productSnapshotView?: ProductMasterSnapshotPayload;
  currentProductSummarySurface?: ProductSummarySurface | null;
  activeProductSiteOffer?: Record<string, unknown>;
  updateSiteOfferField: (storeCode: string, field: string, value: unknown) => void;
  updateProductSectionField: (
    section: 'identity' | 'taxonomy' | 'content' | 'group',
    field: string,
    value: unknown
  ) => void;
  updateProductAttributeField: (code: string, field: 'commonValue' | 'enValue' | 'arValue', value: string) => void;
}) {
  const {
    productSnapshotView,
    currentProductSummarySurface,
    activeProductSiteOffer,
    updateSiteOfferField,
    updateProductSectionField,
    updateProductAttributeField
  } = props;
  const barcodes = useMemo(
    () => collectBarcodes(activeProductSiteOffer, productSnapshotView, currentProductSummarySurface),
    [activeProductSiteOffer, currentProductSummarySurface, productSnapshotView]
  );
  const primaryBarcode = barcodes[0] ?? '';
  const barcodeAttribute = useMemo(() => findBarcodeAttribute(productSnapshotView), [productSnapshotView]);
  const barcodeAttributeCode = textInputValue(barcodeAttribute?.code);
  const canAddBarcode = Boolean(barcodeAttributeCode);
  const [barcodeDraft, setBarcodeDraft] = useState('');
  const warrantyValue = textInputValue(activeProductSiteOffer?.idWarranty ?? productSnapshotView?.pricing.idWarranty ?? '0') || '0';

  useEffect(() => {
    setBarcodeDraft('');
  }, [primaryBarcode]);

  const updateField = (field: string, value: unknown) => {
    if (!activeProductSiteOffer) {
      return;
    }
    updateSiteOfferField(siteOfferCode(activeProductSiteOffer), field, value);
  };

  const submitBarcode = () => {
    const nextBarcode = barcodeDraft.trim();
    if (!nextBarcode) {
      return;
    }

    const nextBarcodes = Array.from(new Set([...barcodes, nextBarcode]));
    if (!barcodeAttributeCode) {
      message.warning('当前官方模板没有 Barcode 写回字段，只能展示已有 Barcode。');
      return;
    }

    updateProductAttributeField(barcodeAttributeCode, 'commonValue', nextBarcodes.join(','));
    updateProductSectionField('identity', 'barcode', nextBarcodes[0] ?? nextBarcode);
    updateProductSectionField('identity', 'barcodes', nextBarcodes);
    setBarcodeDraft('');
    message.warning('Barcode 已加入当前草稿；当前 Barcode 暂不支持发布到 Noon。');
  };

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={8}>
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Text strong style={{ color: 'var(--pm-text-primary)' }}>
            Barcode
          </Text>
          <Text style={{ color: 'var(--pm-text-muted)' }}>已有 Barcode</Text>
          {barcodes.length ? (
            <Space wrap size={[6, 6]}>
              {barcodes.map((item) => (
                <Tag key={item} color="default" style={{ width: 'fit-content', marginInlineEnd: 0 }}>
                  {item}
                </Tag>
              ))}
            </Space>
          ) : (
            <Text style={{ color: 'var(--pm-text-faint)', fontSize: 12 }}>暂无</Text>
          )}
          <Text style={{ color: 'var(--pm-text-muted)' }}>新增 Barcode</Text>
          <Space.Compact style={{ width: '100%' }}>
            <Input
              placeholder="Enter Barcode"
              value={barcodeDraft}
              style={{ width: 'calc(100% - 112px)' }}
              disabled={!canAddBarcode}
              onChange={(event) => setBarcodeDraft(event.target.value)}
            />
            <Tooltip title={canAddBarcode ? undefined : '当前官方模板没有 Barcode 写回字段，只能展示已有 Barcode'}>
              <span style={{ width: 112 }}>
                <Button disabled={!barcodeDraft.trim() || !canAddBarcode} style={{ width: '100%' }} onClick={submitBarcode}>
                  添加 Barcode
                </Button>
              </span>
            </Tooltip>
          </Space.Compact>
          {!canAddBarcode ? (
            <Text style={{ color: 'var(--pm-text-muted)', fontSize: 12 }}>
              当前商品模板未提供 Barcode 写回字段，已有值仅作展示。
            </Text>
          ) : null}
        </Space>
      </Col>
      <Col xs={24} lg={8}>
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Text strong style={{ color: 'var(--pm-text-primary)' }}>
            Warranty
          </Text>
          <Text style={{ color: 'var(--pm-text-muted)' }}>Select warranty duration</Text>
          <Select
            value={warrantyValue}
            options={warrantySelectOptions(warrantyValue)}
            onChange={(value) => updateField('idWarranty', value)}
            style={{ width: '100%' }}
          />
        </Space>
      </Col>
      <Col xs={24} lg={8}>
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Text strong style={{ color: 'var(--pm-text-primary)' }}>
            Offer Note
          </Text>
          <Text style={{ color: 'var(--pm-text-muted)' }}>Add offer note</Text>
          <Input.TextArea
            autoSize={{ minRows: 2, maxRows: 4 }}
            maxLength={255}
            showCount
            value={textInputValue(activeProductSiteOffer?.offerNote)}
            onChange={(event) => updateField('offerNote', event.target.value)}
          />
        </Space>
      </Col>
    </Row>
  );
}
