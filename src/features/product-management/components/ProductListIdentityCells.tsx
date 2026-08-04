import { HistoryOutlined } from '@ant-design/icons';
import { Button, Space, Tag, Typography } from 'antd';
import type { ProductListRowPayload, ProductOperationStageCode, ProductSyncStatus } from '../types';
import {
  buildNoonProductUrl,
  buildProductSummarySurfaceFromListItem,
  mergeGalleryImageUrls,
  ProductBaselineListCell
} from '../../product-baseline';
import { OperationStageCell } from './ProductListOperationalCells';
import { ProductListMoreOperations } from './ProductListMoreOperations';

const { Text } = Typography;

type ProductListRowAction = (record: ProductListRowPayload) => void | Promise<void>;

export function productListPrimaryActionLabel(managementStatus: ProductSyncStatus) {
  return managementStatus === 'failed'
    ? '处理失败'
    : managementStatus === 'draft' || managementStatus === 'conflict'
      ? '继续编辑'
      : '查看详情';
}

export function ProductDetailsCell(props: {
  record: ProductListRowPayload;
  managementStatus: ProductSyncStatus;
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
    managementStatus,
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
  const summary = buildProductSummarySurfaceFromListItem(record);
  const galleryImages = mergeGalleryImageUrls(record.galleryImages, record.imageUrl);
  const noonProductUrl = buildNoonProductUrl(summary);
  const primaryActionLabel = productListPrimaryActionLabel(managementStatus);

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
            danger={managementStatus === 'failed'}
            disabled={productSnapshotSubmitting}
            onClick={(event) => {
              event.stopPropagation();
              void openProductWorkbenchInPageTab(record);
            }}
            style={{ height: 20, padding: 0, fontSize: 12 }}
          >
            {primaryActionLabel}
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
          <ProductListMoreOperations
            record={record}
            deleting={deleting}
            rebuilding={rebuilding}
            openProductVariantSpecModal={openProductVariantSpecModal}
            openProductSiteCompareModal={openProductSiteCompareModal}
            requestDeleteLocalProduct={requestDeleteLocalProduct}
            requestRebuildLocalProduct={requestRebuildLocalProduct}
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
