import { Space, Tag } from 'antd';
import {
  productSummaryPrimarySite,
  productSyncStatusMeta
} from '../product-baseline';
import type { ProductSummarySurface } from '../product-domain/productSummaryTypes';

export function ProductWorkspaceDetailTabLabel(props: {
  summary?: ProductSummarySurface | null;
}) {
  const detailSite = props.summary ? productSummaryPrimarySite(props.summary) : '-';
  const syncMeta = props.summary?.syncStatus
    ? productSyncStatusMeta(props.summary.syncStatus)
    : null;
  return (
    <Space wrap={false} size={[6, 6]} style={{ maxWidth: 260 }}>
      <span style={{
        display: 'inline-block', maxWidth: 112, overflow: 'hidden',
        textOverflow: 'ellipsis', whiteSpace: 'nowrap', verticalAlign: 'bottom'
      }}>
        商品详情
      </span>
      {syncMeta ? <Tag color={syncMeta.color} style={{ marginInlineEnd: 0 }}>{syncMeta.label}</Tag> : null}
      {detailSite !== '-' ? <Tag color="default" style={{ marginInlineEnd: 0 }}>{detailSite}</Tag> : null}
    </Space>
  );
}
