import { BranchesOutlined, MoreOutlined, ProfileOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Modal, Popover, Space, Tooltip, Typography } from 'antd';
import { useState } from 'react';
import { ProductKeywordListHoverPopover } from '../../product-keywords/ProductKeywordListHoverPopover';
import type { ProductListRowPayload } from '../types';
import { productKeywordSiteCodeFromScope } from '../utils/productKeywordSiteScope';
import { productRebuildActionState } from '../utils/productRebuildActionState';
import { ProductDeleteAction } from './ProductDeleteAction';
import { ProductRebuildConfirmDescription } from './ProductListConfirmDescriptions';

const { Text } = Typography;

type ProductListRowAction = (record: ProductListRowPayload) => void | Promise<void>;

function productVariantSpecMissing(record: ProductListRowPayload) {
  const status = record.productVariantSpecStatus;
  return Boolean(status && status !== 'ready');
}

function productVariantSpecTooltip(record: ProductListRowPayload) {
  if (!productVariantSpecMissing(record)) return '商品规格';
  const totalCount = record.productVariantSpecTotalCount ?? record.variantCount ?? 0;
  const readyCount = record.productVariantSpecReadyCount ?? 0;
  const maintainedCount = record.productVariantSpecMaintainedCount ?? 0;
  return totalCount > 0
    ? `商品规格缺失：${readyCount}/${totalCount} 个 SKU 完整，已维护 ${maintainedCount} 个`
    : '商品规格缺失';
}

export function ProductListMoreOperations(props: {
  record: ProductListRowPayload;
  deleting?: boolean;
  rebuilding?: boolean;
  openProductVariantSpecModal: ProductListRowAction;
  openProductSiteCompareModal: ProductListRowAction;
  requestDeleteLocalProduct: ProductListRowAction;
  requestRebuildLocalProduct: ProductListRowAction;
}) {
  const {
    record,
    deleting,
    rebuilding,
    openProductVariantSpecModal,
    openProductSiteCompareModal,
    requestDeleteLocalProduct,
    requestRebuildLocalProduct
  } = props;
  const [open, setOpen] = useState(false);
  const [rebuildConfirmOpen, setRebuildConfirmOpen] = useState(false);
  const [rebuildBlockedReason, setRebuildBlockedReason] = useState<string>();
  const rebuildAction = productRebuildActionState(record);
  const rebuildDisabled = rebuildAction.disabled || deleting;
  const rebuildTooltip = deleting ? '当前商品正在删除，请等待完成后再重建' : rebuildAction.tooltip;
  const specStyle = productVariantSpecMissing(record)
    ? { height: 20, padding: 0, fontSize: 12, color: '#d97706' }
    : { height: 20, padding: 0, fontSize: 12 };
  const keywordSiteCode = productKeywordSiteCodeFromScope({
    storeCode: record.referenceStoreCode,
    siteLabels: record.siteLabels
  });

  return (
    <>
      <Popover
        trigger="click"
        placement="bottomLeft"
        title="更多操作"
        open={open}
        onOpenChange={setOpen}
        content={(
          <Space direction="vertical" size={4} align="start" style={{ minWidth: 132 }}>
            <Tooltip title={productVariantSpecTooltip(record)} placement="right">
              <Button type="link" size="small" icon={<ProfileOutlined />} style={specStyle} onClick={() => {
                setOpen(false);
                openProductVariantSpecModal(record);
              }}>
                商品规格
              </Button>
            </Tooltip>
            <Button type="link" size="small" icon={<BranchesOutlined />} style={linkStyle} onClick={() => {
              setOpen(false);
              void openProductSiteCompareModal(record);
            }}>
              站点对比
            </Button>
            <ProductKeywordListHoverPopover
              storeCode={record.referenceStoreCode}
              siteCode={keywordSiteCode}
              partnerSku={record.partnerSku}
            />
            <div style={{ width: '100%', borderTop: '1px solid #f0f0f0', margin: '4px 0' }} />
            <Tooltip title={rebuildTooltip} placement="right">
              <span title={rebuildTooltip} aria-label={rebuildTooltip} style={{ display: 'inline-flex' }} onClick={() => {
                if (rebuildDisabled) setRebuildBlockedReason(rebuildTooltip);
              }}>
                <Button
                  type="link"
                  size="small"
                  icon={<ReloadOutlined />}
                  loading={rebuilding}
                  disabled={rebuildDisabled}
                  style={{ ...linkStyle, pointerEvents: rebuildDisabled ? 'none' : undefined }}
                  onClick={() => {
                    setOpen(false);
                    setRebuildConfirmOpen(true);
                  }}
                >
                  重建商品
                </Button>
              </span>
            </Tooltip>
            <ProductDeleteAction
              record={record}
              deleting={deleting}
              requestDeleteLocalProduct={requestDeleteLocalProduct}
            />
          </Space>
        )}
      >
        <Button type="link" size="small" icon={<MoreOutlined />} style={linkStyle} onClick={(event) => event.stopPropagation()}>
          更多
        </Button>
      </Popover>
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
    </>
  );
}

const linkStyle = { height: 20, padding: 0, fontSize: 12 };
