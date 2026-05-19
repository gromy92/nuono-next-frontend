import { type ComponentProps, type ReactNode } from 'react';
import { Alert, Button, Card, Col, Descriptions, Empty, Row, Space, Spin, Tag, Typography } from 'antd';
import { procurementPageBusinessDescription } from './autoInquiry';
import {
  procurementOrderStatusMeta,
  procurementPriorityLabel,
  procurementSourceTypeLabel
} from './domain';
import { ProcurementAutoInquiryValidationPanel } from './ProcurementAutoInquiryValidationPanel';
import { ProcurementBuildProgressCard } from './ProcurementBuildProgressCard';
import { ProcurementSourcingEntryCard } from './ProcurementSourcingEntryCard';
import type { ProcurementDemandItem, ProcurementSourcingProgress, ProcurementState } from './types';

const { Text } = Typography;

type ProcurementSummaryCard = {
  label: string;
  value: ReactNode;
};

type ProcurementCandidatePoolOverviewCardProps = {
  procurementState: ProcurementState;
  procurementSummaryCards: readonly ProcurementSummaryCard[];
  showDevValidation: boolean;
  buildProgress: ComponentProps<typeof ProcurementBuildProgressCard>['progress'];
  buildRoadmap: ComponentProps<typeof ProcurementBuildProgressCard>['roadmap'];
  selectedProcurementItem?: ProcurementDemandItem;
  selectedProcurementSourcingProgress?: ProcurementSourcingProgress;
  autoInquiryValidationProps: ComponentProps<typeof ProcurementAutoInquiryValidationPanel>;
  refreshDisabled: boolean;
  onOpenRequirementConfirmation: () => void;
  onRefresh: () => void | Promise<void>;
  onOpen1688Search: (item?: ProcurementDemandItem) => void;
  onCopy1688Keyword: (item?: ProcurementDemandItem) => void | Promise<void>;
  onOpenBackfillModal: (item?: ProcurementDemandItem) => void;
};

export function ProcurementCandidatePoolOverviewCard({
  procurementState,
  procurementSummaryCards,
  showDevValidation,
  buildProgress,
  buildRoadmap,
  selectedProcurementItem,
  selectedProcurementSourcingProgress,
  autoInquiryValidationProps,
  refreshDisabled,
  onOpenRequirementConfirmation,
  onRefresh,
  onOpen1688Search,
  onCopy1688Keyword,
  onOpenBackfillModal
}: ProcurementCandidatePoolOverviewCardProps) {
  return (
    <Card
      variant="borderless"
      style={{ boxShadow: '0 12px 32px rgba(15, 23, 42, 0.06)' }}
      title={
        <Space wrap size={[8, 8]}>
          <Text strong style={{ fontSize: 16, color: '#0f172a' }}>
            异步筛选结果与候选池
          </Text>
          {procurementState.status === 'success' && procurementState.data.order ? (
            <>
              <Tag color={procurementOrderStatusMeta(procurementState.data.order.status).color} style={{ marginInlineEnd: 0 }}>
                {procurementOrderStatusMeta(procurementState.data.order.status).label}
              </Tag>
              <Tag color="geekblue" style={{ marginInlineEnd: 0 }}>
                {procurementState.data.order.orderNo}
              </Tag>
              {procurementState.data.order.targetMarket ? (
                <Tag color="cyan" style={{ marginInlineEnd: 0 }}>
                  目标市场 {procurementState.data.order.targetMarket}
                </Tag>
              ) : null}
            </>
          ) : null}
        </Space>
      }
      extra={
        <Space wrap size={[8, 8]}>
          <Button type="primary" onClick={onOpenRequirementConfirmation}>
            需求确认
          </Button>
          <Button onClick={() => void onRefresh()} disabled={refreshDisabled}>
            刷新结果
          </Button>
        </Space>
      }
    >
      {procurementState.status === 'loading' ? (
        <Space size={12}>
          <Spin size="small" />
          <Text>正在读取采购候选池...</Text>
        </Space>
      ) : null}

      {procurementState.status === 'error' ? (
        <Alert type="warning" showIcon message="采购候选池暂时不可用" description={procurementState.message} />
      ) : null}

      {procurementState.status === 'success' ? (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Alert
            type={procurementState.data.ready ? 'info' : 'warning'}
            showIcon
            message={procurementState.data.order?.title || '采购样本已接入'}
            description={
              showDevValidation
                ? procurementState.data.message || '这里先用本地采购样本验证采购需求、异步筛选和候选池决策的完整链路。'
                : procurementPageBusinessDescription(procurementState.data.message)
            }
          />

          {showDevValidation ? <ProcurementBuildProgressCard progress={buildProgress} roadmap={buildRoadmap} /> : null}

          {showDevValidation ? <ProcurementAutoInquiryValidationPanel {...autoInquiryValidationProps} /> : null}

          <ProcurementSourcingEntryCard
            selectedProcurementItem={selectedProcurementItem}
            selectedProcurementSourcingProgress={selectedProcurementSourcingProgress}
            onOpen1688Search={onOpen1688Search}
            onCopy1688Keyword={onCopy1688Keyword}
            onOpenBackfillModal={onOpenBackfillModal}
          />

          {procurementState.data.missingCoreTables.length ? (
            <Space wrap size={[8, 8]}>
              {procurementState.data.missingCoreTables.map((table) => (
                <Tag key={table} color="warning" style={{ marginInlineEnd: 0 }}>
                  {table}
                </Tag>
              ))}
            </Space>
          ) : null}

          {procurementState.data.order ? (
            <>
              {procurementSummaryCards.length ? (
                <Row gutter={[12, 12]}>
                  {procurementSummaryCards.map((item) => (
                    <Col xs={12} md={6} key={item.label}>
                      <div
                        style={{
                          padding: 14,
                          borderRadius: 8,
                          border: '1px solid #dbe4ea',
                          background: '#ffffff'
                        }}
                      >
                        <div style={{ color: '#64748b', marginBottom: 6 }}>{item.label}</div>
                        <div style={{ fontSize: 24, fontWeight: 600, color: '#0f172a' }}>{item.value}</div>
                      </div>
                    </Col>
                  ))}
                </Row>
              ) : null}

              <Descriptions
                size="small"
                column={{ xs: 1, sm: 2, xl: 4 }}
                items={[
                  {
                    key: 'sourceType',
                    label: '来源方式',
                    children: procurementSourceTypeLabel(procurementState.data.order.sourceType)
                  },
                  {
                    key: 'priority',
                    label: '优先级',
                    children: procurementPriorityLabel(procurementState.data.order.priority)
                  },
                  {
                    key: 'createdAt',
                    label: '创建时间',
                    children: procurementState.data.order.createdAt || '-'
                  },
                  {
                    key: 'updatedAt',
                    label: '最近更新',
                    children: procurementState.data.order.updatedAt || '-'
                  }
                ]}
              />
            </>
          ) : (
            <Empty description="当前还没有采购需求单样本" />
          )}
        </Space>
      ) : null}
    </Card>
  );
}
