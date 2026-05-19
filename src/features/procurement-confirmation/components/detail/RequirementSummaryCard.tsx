import { Alert, Card, Descriptions, Space, Steps } from 'antd';
import { MAX_POOL_SIZE } from '../../constants';
import { batchStatusMeta, batchSteps } from '../../statusMeta';
import type { ProcurementRequirementRecord } from '../../types';

type RequirementSummaryCardProps = {
  batch: ProcurementRequirementRecord;
  poolCount: number;
  repliedCount: number;
  manualCount: number;
};

export function RequirementSummaryCard({
  batch,
  poolCount,
  repliedCount,
  manualCount
}: RequirementSummaryCardProps) {
  return (
    <Card
      title="需求摘要与状态"
      bordered={false}
      style={{ borderRadius: 22, border: '1px solid #e2e8f0' }}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Descriptions column={2} size="small" bordered>
          <Descriptions.Item label="搜索关键词">{batch.searchKeyword}</Descriptions.Item>
          <Descriptions.Item label="目标站点">{batch.targetSite}</Descriptions.Item>
          <Descriptions.Item label="目标价格">
            {batch.targetPriceMin.toFixed(1)} - {batch.targetPriceMax.toFixed(1)} RMB
          </Descriptions.Item>
          <Descriptions.Item label="目标采购量">{batch.targetQuantity} 件</Descriptions.Item>
          <Descriptions.Item label="发货预期">{batch.expectedDelivery}</Descriptions.Item>
          <Descriptions.Item label="待选池数量">{poolCount} / {MAX_POOL_SIZE}</Descriptions.Item>
          <Descriptions.Item label="已收到回复">{repliedCount} 条</Descriptions.Item>
          <Descriptions.Item label="待人工处理">{manualCount} 条</Descriptions.Item>
          <Descriptions.Item label="更新时间">{batch.updatedAt}</Descriptions.Item>
        </Descriptions>
        <Alert
          type={batch.status === 'POOL_PARTIAL_HANDOFF' ? 'warning' : 'info'}
          showIcon
          message={batchStatusMeta[batch.status].label}
          description={batchStatusMeta[batch.status].description}
        />
        <Steps
          current={batchStatusMeta[batch.status].stepIndex}
          responsive
          items={batchSteps.map((title) => ({ title }))}
        />
      </Space>
    </Card>
  );
}
