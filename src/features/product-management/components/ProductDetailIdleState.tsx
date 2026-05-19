import { Empty, List, Space, Tag, Typography } from 'antd';
import { ProductSummaryEntry } from './ProductSummaryBlocks';
import type { ProductManagementWorkspace } from '../workspaceTypes';

const { Text } = Typography;

type ProductDetailIdleStateProps = {
  workspace: ProductManagementWorkspace;
};

export function ProductDetailIdleState({ workspace }: ProductDetailIdleStateProps) {
  const {
    selectedInitializationStore,
    initializationStatusMeta,
    quickOpenSummaryItems,
    productSnapshotSubmitting,
    openProductWorkbench
  } = workspace;

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="这个标签页用于展示单个商品详情；从商品列表点击一条后会直接打开到这里。" />

      {selectedInitializationStore ? (
        <div style={{ padding: 16, borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <Space wrap size={[8, 8]} style={{ marginBottom: 10 }}>
            <Tag color="processing" style={{ marginInlineEnd: 0 }}>
              {selectedInitializationStore.projectName || selectedInitializationStore.projectCode || selectedInitializationStore.storeCode}
            </Tag>
            <Tag color="default" style={{ marginInlineEnd: 0 }}>
              {selectedInitializationStore.storeCode}
            </Tag>
            <Tag color={initializationStatusMeta.color} style={{ marginInlineEnd: 0 }}>
              {initializationStatusMeta.label}
            </Tag>
          </Space>
          <Text style={{ color: '#475569' }}>先从一条商品进入详情，查看商品信息、站点价格和发布动作。</Text>
        </div>
      ) : null}

      {quickOpenSummaryItems.length ? (
        <div style={{ padding: 16, borderRadius: 8, border: '1px solid #e2e8f0', background: '#ffffff' }}>
          <Space wrap size={[8, 8]} style={{ width: '100%', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text strong>快捷打开常用商品</Text>
            <Text style={{ color: '#64748b' }}>这里和商品列表、详情头部使用同一套摘要语言。</Text>
          </Space>
          <List
            size="small"
            dataSource={quickOpenSummaryItems}
            renderItem={(summary) => (
              <ProductSummaryEntry
                compact
                summary={summary}
                actionLabel="打开"
                actionKey={`${summary.skuParent}-${summary.partnerSku || 'open'}`}
                disabled={productSnapshotSubmitting}
                onAction={() =>
                  openProductWorkbench({
                    skuParent: summary.skuParent,
                    partnerSku: summary.partnerSku,
                    pskuCode: summary.pskuCode,
                    storeCode: summary.storeCode
                  })
                }
              />
            )}
          />
        </div>
      ) : null}
    </Space>
  );
}
