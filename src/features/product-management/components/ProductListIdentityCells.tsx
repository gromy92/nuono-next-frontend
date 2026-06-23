import { BranchesOutlined, DeleteOutlined, HistoryOutlined, ProfileOutlined } from '@ant-design/icons';
import { Button, Popconfirm, Space, Tag, Tooltip, Typography } from 'antd';
import type { ProductListRowPayload } from '../types';
import {
  buildNoonProductUrl,
  buildProductSummarySurfaceFromListItem,
  mergeGalleryImageUrls,
  productSummaryCurrentPrice,
  productSummaryPriceLine
} from '../utils';
import { ProductBaselineListCell } from './ProductBaselineDisplay';

const { Text } = Typography;

type ProductListRowAction = (record: ProductListRowPayload) => void | Promise<void>;

function productName(record: ProductListRowPayload) {
  return record.title || record.partnerSku || record.skuParent || '当前商品';
}

function productVariantSpecMissing(record: ProductListRowPayload) {
  const status = record.productVariantSpecStatus;
  return Boolean(status && status !== 'ready');
}

function productVariantSpecTooltip(record: ProductListRowPayload) {
  if (!productVariantSpecMissing(record)) {
    return '商品规格';
  }
  const totalCount = record.productVariantSpecTotalCount ?? record.variantCount ?? 0;
  const readyCount = record.productVariantSpecReadyCount ?? 0;
  const maintainedCount = record.productVariantSpecMaintainedCount ?? 0;
  if (totalCount > 0) {
    return `商品规格缺失：${readyCount}/${totalCount} 个 SKU 完整，已维护 ${maintainedCount} 个`;
  }
  return '商品规格缺失';
}

export function ProductDetailsCell(props: {
  record: ProductListRowPayload;
  productSnapshotSubmitting: boolean;
  deleting?: boolean;
  openProductListGallery: ProductListRowAction;
  openProductWorkbenchInPageTab: ProductListRowAction;
  openProductHistoryModal: ProductListRowAction;
  openProductVariantSpecModal: ProductListRowAction;
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
    openProductVariantSpecModal,
    openProductSiteCompareModal,
    requestDeleteLocalProduct
  } = props;
  const summary = buildProductSummarySurfaceFromListItem(record);
  const galleryImages = mergeGalleryImageUrls(record.galleryImages, record.imageUrl);
  const noonProductUrl = buildNoonProductUrl(summary);
  const productVariantSpecActionStyle = productVariantSpecMissing(record)
    ? { height: 20, padding: 0, fontSize: 12, color: '#d97706' }
    : { height: 20, padding: 0, fontSize: 12 };

  return (
    <ProductBaselineListCell
      summary={summary}
      imageUrl={galleryImages[0]}
      imageCount={galleryImages.length}
      imageAlt={record.title || record.skuParent}
      imageDisabled={!galleryImages.length}
      titleHref={noonProductUrl}
      onImageClick={() => openProductListGallery(record)}
      actions={
        <Space wrap size={[8, 4]}>
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
          <Tooltip title={productVariantSpecTooltip(record)}>
            <Button
              type="link"
              size="small"
              icon={<ProfileOutlined />}
              onClick={(event) => {
                event.stopPropagation();
                openProductVariantSpecModal(record);
              }}
              style={productVariantSpecActionStyle}
            >
              规格
            </Button>
          </Tooltip>
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
      }
    />
  );
}

export function PriceCell(props: {
  record: ProductListRowPayload;
}) {
  const { record } = props;
  const summary = buildProductSummarySurfaceFromListItem(record);
  const currentPrice = productSummaryCurrentPrice(summary);
  const priceLabel = productSummaryPriceLine(summary);
  const priceMode = record.salePrice ? '活动价' : currentPrice ? '售价' : '未返回价格';
  const priceColor = record.salePrice ? 'success' : currentPrice ? 'warning' : 'default';

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
