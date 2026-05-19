import { Card, Col, Empty, List, Row, Space } from 'antd';
import type { ProcurementFeedbackEntry, ProcurementRequirementRecord } from '../types';
import { ActionFeedback } from './ActionFeedback';
import { RequirementDemandListCard } from './RequirementDemandListCard';
import { RequirementListHeader } from './RequirementListHeader';

type RequirementListPageProps = {
  demandBatches: ProcurementRequirementRecord[];
  filteredDemandBatches: ProcurementRequirementRecord[];
  listKeyword: string;
  latestFeedback: ProcurementFeedbackEntry | null;
  onKeywordChange: (value: string) => void;
  onViewDetail: (demandId: string) => void;
  onOpenExternalLink: (url: string, label: string) => void;
};

export function RequirementListPage({
  demandBatches,
  filteredDemandBatches,
  listKeyword,
  latestFeedback,
  onKeywordChange,
  onViewDetail,
  onOpenExternalLink
}: RequirementListPageProps) {
  return (
    <Row gutter={[14, 14]} align="top">
      <Col span={24} data-testid="procurement-confirmation-list-page">
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <RequirementListHeader
            demandBatches={demandBatches}
            listKeyword={listKeyword}
            onKeywordChange={onKeywordChange}
          />
          <ActionFeedback entry={latestFeedback} />
          <Card
            bordered={false}
            bodyStyle={{ padding: 10 }}
            style={{
              borderRadius: 18,
              border: '1px solid #e2e8f0',
              background: '#ffffff'
            }}
          >
            <List
              data-testid="procurement-demand-list"
              dataSource={filteredDemandBatches}
              split={false}
              locale={{
                emptyText: (
                  <Empty description={listKeyword.trim() ? '没有匹配的采购需求' : '暂无采购需求'} />
                )
              }}
              renderItem={(batch) => (
                <List.Item
                  data-testid="procurement-demand-list-item"
                  style={{ paddingInline: 0, paddingTop: 0, paddingBottom: 10 }}
                >
                  <RequirementDemandListCard
                    batch={batch}
                    onViewDetail={onViewDetail}
                    onOpenExternalLink={onOpenExternalLink}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Space>
      </Col>
    </Row>
  );
}
