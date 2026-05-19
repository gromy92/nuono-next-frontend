import { Card, Input, Space, Tag, Typography } from 'antd';
import { FormToolbarLayout } from '../../app-shell/FormToolbarLayout';
import type { ProcurementRequirementRecord } from '../types';

const { Search } = Input;
const { Text, Title } = Typography;

type RequirementListHeaderProps = {
  demandBatches: ProcurementRequirementRecord[];
  listKeyword: string;
  onKeywordChange: (value: string) => void;
};

export function RequirementListHeader({
  demandBatches,
  listKeyword,
  onKeywordChange
}: RequirementListHeaderProps) {
  const runningCount = demandBatches.filter((batch) => batch.status === 'POOL_INQUIRY_RUNNING').length;
  const handoffCount = demandBatches.filter((batch) => batch.status === 'POOL_PARTIAL_HANDOFF').length;
  const readyCount = demandBatches.filter((batch) => batch.status === 'SUMMARY_READY').length;

  return (
    <Card
      variant="borderless"
      styles={{ body: { padding: '14px 16px' } }}
      style={{
        borderRadius: 8,
        border: '1px solid #e2e8f0',
        background: '#ffffff',
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)'
      }}
    >
      <FormToolbarLayout
        title={
          <Space direction="vertical" size={2}>
            <Title level={4} style={{ margin: 0, color: '#0f172a' }}>
              采购单
            </Title>
            <Text style={{ color: '#64748b' }}>源头商品采集 / 1688 候选采集 / Top5 自动询价 / AI 总结</Text>
          </Space>
        }
        actions={
          <>
            <Tag color="default">全部 {demandBatches.length}</Tag>
            <Tag color="processing">询价中 {runningCount}</Tag>
            <Tag color={handoffCount ? 'error' : 'default'}>人工 {handoffCount}</Tag>
            <Tag color="success">已总结 {readyCount}</Tag>
          </>
        }
        fieldsStyle={{ flex: '1 1 420px' }}
        actionsStyle={{ gap: 8 }}
      >
        <Search
          data-testid="procurement-confirmation-search"
          allowClear
          size="large"
          value={listKeyword}
          placeholder="搜索源头标题 / 订单号 / 源头链接 / offerId / 供应商"
          onChange={(event) => onKeywordChange(event.target.value)}
          onSearch={(value) => onKeywordChange(value)}
          style={{ minWidth: 280, maxWidth: 680 }}
        />
      </FormToolbarLayout>
    </Card>
  );
}
