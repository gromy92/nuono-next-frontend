import { BranchesOutlined, DeleteOutlined, HistoryOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { Button, Popconfirm, Space, Tag, Tooltip, Typography } from 'antd';
import type { ProductListRowPayload } from '../types';
import {
  buildNoonProductUrl,
  buildProductSummarySurfaceFromListItem,
  formatDateTimeParts,
  isProductNotListedSource,
  mergeGalleryImageUrls,
  productListingStartedSourceLabel,
  productSourceTypeMeta,
  productSummaryTitle
} from '../utils';

const { Text } = Typography;

type ProductListRowAction = (record: ProductListRowPayload) => void | Promise<void>;

function ProductListThumbnail(props: {
  src?: string;
  alt: string;
  imageCount: number;
}) {
  const { src, alt, imageCount } = props;
  const [imageFailed, setImageFailed] = useState(false);

  if (!src || imageFailed) {
    return (
      <span
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#9ca3af',
          fontSize: 11,
          background: '#f3f4f6'
        }}
      >
        无图
      </span>
    );
  }

  return (
    <span style={{ position: 'relative', width: '100%', height: '100%', display: 'block' }}>
      <img
        src={src}
        alt={alt}
        onError={() => setImageFailed(true)}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
      {imageCount > 1 ? (
        <span
          style={{
            position: 'absolute',
            right: 4,
            bottom: 4,
            padding: '1px 5px',
            borderRadius: 4,
            color: '#ffffff',
            background: 'rgba(15, 23, 42, 0.72)',
            fontSize: 11,
            lineHeight: '16px'
          }}
        >
          {imageCount}
        </span>
      ) : null}
    </span>
  );
}

function productName(record: ProductListRowPayload) {
  return record.title || record.partnerSku || record.skuParent || '当前商品';
}

export function ProductDetailsCell(props: {
  record: ProductListRowPayload;
  productSnapshotSubmitting: boolean;
  deleting?: boolean;
  openProductListGallery: ProductListRowAction;
  openProductWorkbenchInPageTab: ProductListRowAction;
  openProductHistoryModal: ProductListRowAction;
  openProductSiteCompareModal: ProductListRowAction;
  requestDeleteLocalProduct: ProductListRowAction;
}) {
  const {
    record,
    productSnapshotSubmitting,
    deleting,
    openProductListGallery,
    openProductWorkbenchInPageTab,
    openProductHistoryModal,
    openProductSiteCompareModal,
    requestDeleteLocalProduct
  } = props;
  const summary = buildProductSummarySurfaceFromListItem(record);
  const galleryImages = mergeGalleryImageUrls(record.galleryImages, record.imageUrl);
  const title = productSummaryTitle(summary);
  const visiblePsku = summary.partnerSku || summary.pskuCode || '-';
  const noonProductUrl = buildNoonProductUrl(summary);
  const sourceTypeMeta = productSourceTypeMeta(summary.productSourceType);
  const listingStartedParts = formatDateTimeParts(summary.listingStartedAt);
  const listingStartedSourceLabel = productListingStartedSourceLabel(summary.listingStartedSource);
  const productNotListed = isProductNotListedSource(summary.listingStartedSource);

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', minWidth: 0 }}>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          openProductListGallery(record);
        }}
        disabled={!galleryImages.length}
        style={{
          flex: '0 0 auto',
          width: 84,
          height: 84,
          padding: 0,
          borderRadius: 6,
          border: '1px solid #e5e7eb',
          background: '#f8fafc',
          overflow: 'hidden',
          cursor: galleryImages.length ? 'pointer' : 'default'
        }}
      >
        <ProductListThumbnail src={galleryImages[0]} alt={record.title || record.skuParent} imageCount={galleryImages.length} />
      </button>
      <div style={{ minWidth: 0, flex: '1 1 auto' }}>
        <Space size={6} wrap style={{ minHeight: 18 }}>
          <Text style={{ display: 'block', color: '#6b7280', fontSize: 12, lineHeight: '18px' }}>
            {summary.brand || '-'}
          </Text>
          <Tooltip title={sourceTypeMeta.description}>
            <Tag color={sourceTypeMeta.color} style={{ marginInlineEnd: 0, fontSize: 11, lineHeight: '16px' }}>
              {sourceTypeMeta.label}
            </Tag>
          </Tooltip>
        </Space>
        <Tooltip title={title}>
          <a
            href={noonProductUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => {
              event.stopPropagation();
            }}
            style={{
              display: 'block',
              width: '100%',
              height: 20,
              maxWidth: 360,
              padding: 0,
              color: '#111827',
              fontWeight: 600,
              textAlign: 'left',
              lineHeight: '20px',
              textDecoration: 'none'
            }}
          >
            <span
              style={{
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {title}
            </span>
          </a>
        </Tooltip>
        <Space
          wrap
          size={[10, 2]}
          style={{ color: '#6b7280', fontSize: 12, lineHeight: '18px', marginTop: 4 }}
          onClick={(event) => event.stopPropagation()}
        >
          <span>
            <Text style={{ color: '#6b7280', fontSize: 12 }}>PSKU: </Text>
            <Text copyable={visiblePsku !== '-' ? { text: visiblePsku, tooltips: ['复制 PSKU', '已复制'] } : false} style={{ fontSize: 12 }}>
              {visiblePsku}
            </Text>
          </span>
          <span>
            <Text style={{ color: '#9ca3af', fontSize: 12 }}>SKU: </Text>
            <Text
              copyable={summary.skuParent ? { text: summary.skuParent, tooltips: ['复制 SKU', '已复制'] } : false}
              style={{ color: '#9ca3af', fontSize: 12 }}
            >
              {summary.skuParent || '-'}
            </Text>
          </span>
        </Space>
        {summary.barcode ? (
          <div style={{ color: '#9ca3af', fontSize: 12, lineHeight: '18px' }}>
            Barcode: {summary.barcode}
          </div>
        ) : null}
        {listingStartedParts || productNotListed ? (
          <div style={{ color: '#6b7280', fontSize: 12, lineHeight: '18px', marginTop: summary.barcode ? 0 : 2 }}>
            <Text style={{ color: '#9ca3af', fontSize: 12 }}>上架: </Text>
            <Text style={{ color: productNotListed ? '#b45309' : '#6b7280', fontSize: 12 }}>
              {productNotListed
                ? '未上架'
                : `${listingStartedParts?.date ?? ''}${listingStartedParts?.time ? ` ${listingStartedParts.time}` : ''}`}
            </Text>
            {listingStartedSourceLabel && !productNotListed ? (
              <Tag color="default" style={{ marginInlineStart: 6, marginInlineEnd: 0, fontSize: 11, lineHeight: '16px' }}>
                {listingStartedSourceLabel}
              </Tag>
            ) : null}
          </div>
        ) : null}
        <Space wrap size={[8, 4]} style={{ marginTop: 5 }}>
          <Button
            type="link"
            size="small"
            disabled={productSnapshotSubmitting}
            onClick={(event) => {
              event.stopPropagation();
              void openProductWorkbenchInPageTab(record);
            }}
            style={{ height: 20, padding: 0, fontSize: 12 }}
          >
            查看详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<HistoryOutlined />}
            onClick={(event) => {
              event.stopPropagation();
              openProductHistoryModal(record);
            }}
            style={{ height: 20, padding: 0, fontSize: 12 }}
          >
            历史
          </Button>
          <Button
            type="link"
            size="small"
            icon={<BranchesOutlined />}
            onClick={(event) => {
              event.stopPropagation();
              void openProductSiteCompareModal(record);
            }}
            style={{ height: 20, padding: 0, fontSize: 12 }}
          >
            站点对比
          </Button>
          <Popconfirm
            title="确认删除商品？"
            description={`将从本地商品目录删除「${productName(record)}」。此操作不会写回 Noon。`}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
            onConfirm={(event) => {
              event?.stopPropagation();
              void requestDeleteLocalProduct(record);
            }}
            onCancel={(event) => event?.stopPropagation()}
          >
            <Button
              danger
              type="link"
              size="small"
              icon={<DeleteOutlined />}
              loading={deleting}
              onClick={(event) => {
                event.stopPropagation();
              }}
              style={{ height: 20, padding: 0, fontSize: 12 }}
            >
              删除
            </Button>
          </Popconfirm>
          {summary.groupRef ? (
            <Tag color="default" style={{ marginInlineEnd: 0, fontSize: 11 }}>
              Group {summary.groupRef}
            </Tag>
          ) : null}
        </Space>
      </div>
    </div>
  );
}

export function PriceCell(props: {
  record: ProductListRowPayload;
}) {
  const { record } = props;
  const priceLabel = record.referencePrice ? `${record.currency || ''} ${record.referencePrice}` : '-';
  const priceMode = record.salePrice ? '促销' : record.originalPrice ? '售价' : '手动';
  const priceColor = record.salePrice ? 'success' : record.originalPrice ? 'warning' : 'default';

  return (
    <Space direction="vertical" size={5}>
      <Space size={6}>
        <Text strong style={{ color: '#111827' }}>
          {priceLabel}
        </Text>
      </Space>
      <Tag color={priceColor} style={{ width: 'fit-content', marginInlineEnd: 0, fontSize: 11 }}>
        {priceMode}
      </Tag>
      {record.salePrice ? (
        <Text style={{ color: '#6b7280', fontSize: 12 }}>
          活动 {record.currency || ''} {record.salePrice}
        </Text>
      ) : null}
    </Space>
  );
}
