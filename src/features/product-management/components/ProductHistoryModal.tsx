import { useMemo, useState } from 'react';
import { Alert, Empty, Modal, Segmented, Space, Spin, Tag, Typography } from 'antd';
import { ProductKeywordHistorySection } from '../../product-keywords/ProductKeywordHistorySection';
import { useProductManagementWorkspace } from '../useProductManagementWorkspace';
import type { ProductSummarySurface } from '../types';
import {
  ProductHistoryAuditList,
  ProductHistoryHeaderSummary
} from './ProductHistoryModal.helpers';
import {
  PRODUCT_HISTORY_FILTER_ALL,
  buildProductHistoryFilterOptions,
  filterProductHistoryItems,
  type ProductHistoryFilter
} from './ProductHistoryModal.utils';

const { Text } = Typography;

type ProductManagementWorkspace = ReturnType<typeof useProductManagementWorkspace>;

type ProductHistoryModalProps = {
  workspace: ProductManagementWorkspace;
};

function siteCodeFromStoreCode(storeCode?: string) {
  const normalized = (storeCode || '').toUpperCase();
  if (normalized.endsWith('-NSA') || normalized.endsWith('-SAU') || normalized.endsWith('-SA')) return 'SA';
  if (normalized.endsWith('-NAE') || normalized.endsWith('-UAE') || normalized.endsWith('-AE')) return 'AE';
  if (normalized.endsWith('-NEG') || normalized.endsWith('-EG')) return 'EG';
  return '';
}

function productHistoryKeywordSiteCode(summary?: ProductSummarySurface | null) {
  return summary?.siteLabels?.find((site) => /^[A-Z]{2,3}$/.test(site)) || siteCodeFromStoreCode(summary?.storeCode);
}

export function ProductHistoryModal({ workspace }: ProductHistoryModalProps) {
  const {
    productHistoryModalOpen,
    setProductHistoryModalOpen,
    productHistoryModalTitle,
    setProductHistoryModalTitle,
    productHistoryModalSummary,
    setProductHistoryModalSummary,
    productHistoryModalEntryLabel,
    setProductHistoryModalEntryLabel,
    productHistoryModalEntryColor,
    setProductHistoryModalEntryColor,
    productHistoryModalItems,
    setProductHistoryModalItems,
    productHistoryModalNote,
    setProductHistoryModalNote,
    productHistoryModalLoading,
    setProductHistoryModalLoading,
    productHistoryModalHistoryMetaReady,
    setProductHistoryModalHistoryMetaReady,
    productHistoryModalVisibleHistoryCount,
    setProductHistoryModalVisibleHistoryCount,
    productHistoryModalPendingCount,
    setProductHistoryModalPendingCount,
    productHistoryModalPendingVisibleAfter,
    setProductHistoryModalPendingVisibleAfter
  } = workspace;
  const [activeFilter, setActiveFilter] = useState<ProductHistoryFilter>(PRODUCT_HISTORY_FILTER_ALL);
  const filterOptions = useMemo(
    () => buildProductHistoryFilterOptions(productHistoryModalItems),
    [productHistoryModalItems]
  );
  const activeFilterValue = filterOptions.some((item) => item.value === activeFilter)
    ? activeFilter
    : PRODUCT_HISTORY_FILTER_ALL;
  const filteredHistoryItems = useMemo(
    () => filterProductHistoryItems(productHistoryModalItems, activeFilterValue),
    [activeFilterValue, productHistoryModalItems]
  );
  const keywordSiteCode = productHistoryKeywordSiteCode(productHistoryModalSummary);

  const closeModal = () => {
    setProductHistoryModalOpen(false);
    setProductHistoryModalTitle(undefined);
    setProductHistoryModalSummary(null);
    setProductHistoryModalEntryLabel(undefined);
    setProductHistoryModalEntryColor('default');
    setProductHistoryModalItems([]);
    setProductHistoryModalNote(undefined);
    setProductHistoryModalLoading(false);
    setProductHistoryModalHistoryMetaReady(false);
    setProductHistoryModalVisibleHistoryCount(0);
    setProductHistoryModalPendingCount(0);
    setProductHistoryModalPendingVisibleAfter(undefined);
    setActiveFilter(PRODUCT_HISTORY_FILTER_ALL);
  };

  return (
    <Modal
      title={
        <Space direction="vertical" size={2} style={{ width: '100%', minWidth: 0 }}>
          <Text strong style={{ fontSize: 18 }}>
            商品历史
          </Text>
          {!productHistoryModalSummary && productHistoryModalTitle ? (
            <Text
              type="secondary"
              style={{
                display: 'block',
                maxWidth: 760,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: 12
              }}
            >
              {productHistoryModalTitle}
            </Text>
          ) : null}
        </Space>
      }
      open={productHistoryModalOpen}
      footer={null}
      onCancel={closeModal}
      width={980}
      destroyOnClose
      styles={{ body: { maxHeight: '76vh', overflowY: 'auto' } }}
    >
      <Space direction="vertical" size={14} style={{ width: '100%' }}>
        {productHistoryModalSummary ? (
          <ProductHistoryHeaderSummary summary={productHistoryModalSummary} />
        ) : null}

        {productHistoryModalSummary ? (
          <ProductKeywordHistorySection
            storeCode={productHistoryModalSummary.storeCode}
            siteCode={keywordSiteCode}
            partnerSku={productHistoryModalSummary.partnerSku}
            maxEvents={80}
          />
        ) : null}

        <Space wrap size={[8, 8]}>
          {productHistoryModalEntryLabel ? (
            <Tag color={productHistoryModalEntryColor} style={{ marginInlineEnd: 0 }}>
              {productHistoryModalEntryLabel}
            </Tag>
          ) : null}
          {productHistoryModalVisibleHistoryCount ? (
            <Tag color="default" style={{ marginInlineEnd: 0 }}>
              图文正式 {productHistoryModalVisibleHistoryCount} 条
            </Tag>
          ) : null}
          {productHistoryModalPendingCount ? (
            <Tag color="processing" style={{ marginInlineEnd: 0 }}>
              图文待转正式 {productHistoryModalPendingCount} 条
            </Tag>
          ) : null}
        </Space>

        {productHistoryModalItems.length ? (
          <Segmented
            size="small"
            options={filterOptions}
            value={activeFilterValue}
            onChange={(value) => setActiveFilter(value as ProductHistoryFilter)}
          />
        ) : null}

        {productHistoryModalPendingCount ? (
          <Alert
            type="info"
            showIcon
            message="最近发布的关键内容改动还在观察期内。"
            description={
              productHistoryModalPendingVisibleAfter
                ? `最早一条预计会在 ${productHistoryModalPendingVisibleAfter} 后进入正式历史。`
                : '最早一条进入正式历史的时间还没有回传。'
            }
          />
        ) : null}

        {productHistoryModalNote ? <Alert type="info" showIcon message={productHistoryModalNote} /> : null}

        {productHistoryModalLoading ? (
          <Space size={12}>
            <Spin size="small" />
            <Text>正在读取真实历史明细...</Text>
          </Space>
        ) : null}

        {!productHistoryModalLoading && filteredHistoryItems.length ? (
          <ProductHistoryAuditList items={filteredHistoryItems} summary={productHistoryModalSummary} />
        ) : !productHistoryModalLoading && productHistoryModalItems.length ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="当前筛选下没有商品修改历史。" />
        ) : !productHistoryModalLoading &&
          productHistoryModalHistoryMetaReady &&
          (productHistoryModalVisibleHistoryCount > 0 || productHistoryModalPendingCount > 0) ? (
          <Alert
            type="info"
            showIcon
            message="完整历史明细需先进入详情"
            description="当前列表入口已经能识别这条商品有没有正式历史或待转正式记录；如需查看逐条变更内容，请先进入详情工作台。"
          />
        ) : !productHistoryModalLoading ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="当前还没有商品修改历史。" />
        ) : null}
      </Space>
    </Modal>
  );
}
