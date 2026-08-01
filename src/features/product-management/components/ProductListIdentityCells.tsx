import { BranchesOutlined, HistoryOutlined, ProfileOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Modal, Space, Tag, Tooltip, Typography } from 'antd';
import { useState } from 'react';
import { ProductKeywordListHoverPopover } from '../../product-keywords/ProductKeywordListHoverPopover';
import type { ProductListRowPayload, ProductOperationStageCode } from '../types';
import {
  buildNoonProductUrl,
  buildProductSummarySurfaceFromListItem,
  mergeGalleryImageUrls,
  ProductBaselineListCell
} from '../../product-baseline';
import { productKeywordSiteCodeFromScope } from '../utils/productKeywordSiteScope';
import { productRebuildActionState } from '../utils/productRebuildActionState';
import { ProductRebuildConfirmDescription } from './ProductListConfirmDescriptions';
import { ProductDeleteAction } from './ProductDeleteAction';
import { OperationStageCell } from './ProductListOperationalCells';

const { Text } = Typography;

type ProductListRowAction = (record: ProductListRowPayload) => void | Promise<void>;

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

function productKeywordSiteCode(record: ProductListRowPayload) {
  return productKeywordSiteCodeFromScope({
    storeCode: record.referenceStoreCode,
    siteLabels: record.siteLabels
  });
}

export function ProductDetailsCell(props: {
  record: ProductListRowPayload;
  productSnapshotSubmitting: boolean;
  deleting?: boolean;
  rebuilding?: boolean;
  updatingOperationStage?: boolean;
  openProductListGallery: ProductListRowAction;
  openProductWorkbenchInPageTab: ProductListRowAction;
  openProductHistoryModal: ProductListRowAction;
  openProductVariantSpecModal: ProductListRowAction;
  openProductSiteCompareModal: ProductListRowAction;
  requestDeleteLocalProduct: ProductListRowAction;
  requestRebuildLocalProduct: ProductListRowAction;
  requestUpdateProductOperationStage: (
    record: ProductListRowPayload,
    nextStageCode?: ProductOperationStageCode | string
  ) => void | Promise<void>;
}) {
  const {
    record,
    productSnapshotSubmitting,
    deleting,
    rebuilding,
    updatingOperationStage,
    openProductListGallery,
    openProductWorkbenchInPageTab,
    openProductHistoryModal,
    openProductVariantSpecModal,
    openProductSiteCompareModal,
    requestDeleteLocalProduct,
    requestRebuildLocalProduct,
    requestUpdateProductOperationStage
  } = props;
  const [rebuildConfirmOpen, setRebuildConfirmOpen] = useState(false);
  const [rebuildBlockedReason, setRebuildBlockedReason] = useState<string>();
  const summary = buildProductSummarySurfaceFromListItem(record);
  const galleryImages = mergeGalleryImageUrls(record.galleryImages, record.imageUrl);
  const noonProductUrl = buildNoonProductUrl(summary);
  const rebuildAction = productRebuildActionState(record);
  const rebuildDisabled = rebuildAction.disabled || deleting;
  const rebuildTooltip = deleting ? '当前商品正在删除，请等待完成后再重建' : rebuildAction.tooltip;
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
      metaActions={
        <OperationStageCell
          record={record}
          updating={updatingOperationStage}
          requestUpdateProductOperationStage={requestUpdateProductOperationStage}
        />
      }
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
          <Tooltip title={rebuildTooltip}>
            <span
              className="product-rebuild-action-trigger"
              title={rebuildTooltip}
              aria-label={rebuildTooltip}
              style={{ display: 'inline-flex' }}
              onClick={(event) => {
                event.stopPropagation();
                if (rebuildDisabled) {
                  setRebuildBlockedReason(rebuildTooltip);
                }
              }}
            >
              <Button
                type="link"
                size="small"
                icon={<ReloadOutlined />}
                loading={rebuilding}
                disabled={rebuildDisabled}
                onClick={(event) => {
                  event.stopPropagation();
                  setRebuildConfirmOpen(true);
                }}
                style={{
                  height: 20,
                  padding: 0,
                  fontSize: 12,
                  pointerEvents: rebuildDisabled ? 'none' : undefined
                }}
              >
                重建
              </Button>
            </span>
          </Tooltip>
          <Modal
            title="确认重建商品？"
            open={rebuildConfirmOpen}
            okText="重建"
            cancelText="取消"
            okButtonProps={{ danger: true }}
            confirmLoading={rebuilding}
            onOk={() => {
              setRebuildConfirmOpen(false);
              void requestRebuildLocalProduct(record);
            }}
            onCancel={() => setRebuildConfirmOpen(false)}
          >
            <ProductRebuildConfirmDescription record={record} />
          </Modal>
          <Modal
            title="暂时不能重建"
            open={Boolean(rebuildBlockedReason)}
            okText="知道了"
            cancelButtonProps={{ style: { display: 'none' } }}
            onOk={() => setRebuildBlockedReason(undefined)}
            onCancel={() => setRebuildBlockedReason(undefined)}
          >
            <Text>{rebuildBlockedReason}</Text>
          </Modal>
          <ProductKeywordListHoverPopover
            storeCode={record.referenceStoreCode}
            siteCode={productKeywordSiteCode(record)}
            partnerSku={record.partnerSku}
          />
          <ProductDeleteAction
            record={record}
            deleting={deleting}
            requestDeleteLocalProduct={requestDeleteLocalProduct}
          />
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
