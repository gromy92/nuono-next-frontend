import { Button, Card, Empty, Space, Spin, Tag, Typography } from 'antd';
import {
  formatProcurementPriceRange,
  procurementAutoSelectionLabel,
  procurementDemandDisplayTitle,
  procurementItemStatusMeta,
  procurementPlatformLabel,
  procurementSourcePlatformColor,
  procurementStructuredFieldSourceMeta,
  procurementTaskStatusMeta
} from './domain';
import type { ProcurementDemandItem, ProcurementState } from './types';

const { Text } = Typography;

type ProcurementDemandListCardProps = {
  procurementState: ProcurementState;
  selectedProcurementItemId?: number;
  procurementRunningDemandItemId?: number;
  onSelectDemandItem: (demandItemId: number) => void;
  onRunAutoSelection: (demandItemId: number) => void | Promise<void>;
  onOpen1688Search: (item?: ProcurementDemandItem) => void;
  onOpenBackfillModal: (item?: ProcurementDemandItem) => void;
};

export function ProcurementDemandListCard({
  procurementState,
  selectedProcurementItemId,
  procurementRunningDemandItemId,
  onSelectDemandItem,
  onRunAutoSelection,
  onOpen1688Search,
  onOpenBackfillModal
}: ProcurementDemandListCardProps) {
  return (
    <Card
      title="采购需求单"
      variant="borderless"
      style={{ boxShadow: '0 12px 32px rgba(15, 23, 42, 0.06)' }}
      extra={
        procurementState.status === 'success' && procurementState.data.order ? (
          <Text style={{ color: '#64748b' }}>{procurementState.data.demandItems.length} 条</Text>
        ) : null
      }
    >
      {procurementState.status === 'success' && procurementState.data.demandItems.length ? (
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          {procurementState.data.demandItems.map((item) => {
            const taskMeta = procurementTaskStatusMeta(item.task?.status);
            const itemStatusMeta = procurementItemStatusMeta(item.status);
            const structuredFieldSourceMeta = procurementStructuredFieldSourceMeta(item.structuredFieldSource);
            const isSelected = item.id === selectedProcurementItemId;

            return (
              <div
                key={item.id}
                onClick={() => onSelectDemandItem(item.id)}
                style={{
                  padding: 14,
                  borderRadius: 10,
                  border: isSelected ? '1px solid #0f766e' : '1px solid #e2e8f0',
                  background: isSelected ? '#f0fdfa' : '#ffffff',
                  cursor: 'pointer'
                }}
              >
                <Space wrap size={[6, 6]} style={{ marginBottom: 8 }}>
                  <Tag color={procurementSourcePlatformColor(item.sourcePlatform)} style={{ marginInlineEnd: 0 }}>
                    {procurementPlatformLabel(item.sourcePlatform)}
                  </Tag>
                  <Tag color={itemStatusMeta.color} style={{ marginInlineEnd: 0 }}>
                    {itemStatusMeta.label}
                  </Tag>
                  <Tag color={taskMeta.color} style={{ marginInlineEnd: 0 }}>
                    {taskMeta.label}
                  </Tag>
                  <Tag color={structuredFieldSourceMeta.color} style={{ marginInlineEnd: 0 }}>
                    字段 {structuredFieldSourceMeta.label}
                  </Tag>
                  {item.selectedCandidateId ? (
                    <Tag color="success" style={{ marginInlineEnd: 0 }}>
                      已选意向采购
                    </Tag>
                  ) : null}
                </Space>

                <Text strong style={{ color: '#0f172a' }}>
                  {item.lineNo ? `${item.lineNo}. ` : ''}
                  {procurementDemandDisplayTitle(item)}
                </Text>

                <div style={{ color: '#64748b', fontSize: 12, marginTop: 8 }}>
                  目标价 {formatProcurementPriceRange(item.targetPriceMin, item.targetPriceMax)} · 目标量{' '}
                  {item.targetQuantity || '-'} · 站点 {item.targetSite || '-'}
                </div>
                <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>
                  候选 {item.candidates.length} 条
                  {item.task?.recommendedCount ? ` · 推荐 ${item.task.recommendedCount} 条` : ''}
                </div>

                <Space wrap size={[8, 8]} style={{ marginTop: 10 }}>
                  <Button
                    size="small"
                    type={isSelected ? 'primary' : 'default'}
                    loading={procurementRunningDemandItemId === item.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      void onRunAutoSelection(item.id);
                    }}
                  >
                    {procurementAutoSelectionLabel(item)}
                  </Button>
                  <Button
                    size="small"
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpen1688Search(item);
                    }}
                  >
                    去 1688 找货
                  </Button>
                  <Button
                    size="small"
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenBackfillModal(item);
                    }}
                  >
                    回填候选
                  </Button>
                </Space>
              </div>
            );
          })}
        </Space>
      ) : procurementState.status === 'loading' ? (
        <Space size={12}>
          <Spin size="small" />
          <Text>正在准备需求列表...</Text>
        </Space>
      ) : (
        <Empty description="当前没有可展示的采购需求" />
      )}
    </Card>
  );
}
