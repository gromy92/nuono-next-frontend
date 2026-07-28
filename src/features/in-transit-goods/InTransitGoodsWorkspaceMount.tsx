import { Space, Tag } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { WorkspaceMountProps } from '../route-catalog/workspaceMount';
import { useWorkspaceOwnedTabs } from '../route-catalog/WorkspaceOwnedTabs';
import { InTransitGoodsPage } from './InTransitGoodsPage';
import type { InTransitBoxDetailTabRequest } from './types';

export function InTransitGoodsWorkspaceMount(_props: WorkspaceMountProps) {
  const {
    activeOwnedTabKey,
    activateParentMenu,
    openOwnedTab,
    registerOwnedTab,
    unregisterOwnedTab
  } = useWorkspaceOwnedTabs();
  const [detailRequest, setDetailRequest] = useState<InTransitBoxDetailTabRequest | null>(null);
  const closeDetail = useCallback(() => {
    setDetailRequest(null);
    unregisterOwnedTab('in-transit-box-detail');
    activateParentMenu('purchase-in-transit-goods');
  }, [activateParentMenu, unregisterOwnedTab]);
  const detailTab = useMemo(() => detailRequest ? {
    key: 'in-transit-box-detail',
    parentMenuKey: 'purchase-in-transit-goods' as const,
    pathLabel: '采购 / 在途商品 / 商品明细',
    label: (
      <Space wrap={false} size={[6, 6]} style={{ maxWidth: 260 }}>
        <span style={{
          display: 'inline-block', maxWidth: 120, overflow: 'hidden',
          textOverflow: 'ellipsis', whiteSpace: 'nowrap', verticalAlign: 'bottom'
        }}>
          商品明细
        </span>
        <Tag color="default" style={{ marginInlineEnd: 0 }}>
          {detailRequest.batchReferenceNo || '批次'}
        </Tag>
      </Space>
    ),
    closable: true,
    onClose: closeDetail
  } : null, [closeDetail, detailRequest]);

  useEffect(() => {
    if (detailTab) registerOwnedTab(detailTab);
  }, [detailTab, registerOwnedTab]);
  useEffect(() => () => unregisterOwnedTab('in-transit-box-detail'), [unregisterOwnedTab]);

  const openDetail = useCallback((request: InTransitBoxDetailTabRequest) => {
    setDetailRequest(request);
    openOwnedTab({
      key: 'in-transit-box-detail',
      parentMenuKey: 'purchase-in-transit-goods',
      pathLabel: '采购 / 在途商品 / 商品明细',
      label: (
        <Space wrap={false} size={[6, 6]}>
          <span>商品明细</span>
          <Tag color="default">{request.batchReferenceNo || '批次'}</Tag>
        </Space>
      ),
      closable: true,
      onClose: closeDetail
    });
  }, [closeDetail, openOwnedTab]);

  return (
    <InTransitGoodsPage
      boxDetailRequest={detailRequest}
      isBoxDetailTab={activeOwnedTabKey === 'in-transit-box-detail'}
      onCloseBoxDetailTab={closeDetail}
      onOpenBoxDetailTab={openDetail}
    />
  );
}
