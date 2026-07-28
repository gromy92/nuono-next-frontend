import { Button, Card, Col, Row, Typography } from 'antd';
import { MAX_POOL_SIZE } from '../constants';
import type { ProcurementRequirementRecord } from '../types';
import {
  AliCandidateCollectionColumn,
  PurchaseProgressColumn,
  SourceCollectionColumn
} from './RequirementDemandListColumns';
import { resolvePreviewCandidate } from './requirementDemandListCardModel';

const { Text } = Typography;

type RequirementDemandListCardProps = {
  batch: ProcurementRequirementRecord;
  onViewDetail: (demandId: string) => void;
  onOpenExternalLink: (url: string, label: string) => void;
};

export function RequirementDemandListCard({
  batch,
  onViewDetail,
  onOpenExternalLink
}: RequirementDemandListCardProps) {
  const poolCount = batch.poolCount ?? batch.candidates.filter((candidate) => candidate.inPool).length;
  const maxPoolSize = batch.maxPoolSize || MAX_POOL_SIZE;
  const finalists = batch.finalCandidateCount ?? batch.candidates.filter((candidate) => candidate.finalPick).length;
  const topCandidate = resolvePreviewCandidate(batch.candidates);

  return (
    <Card
      data-testid={`procurement-demand-card-${batch.id}`}
      hoverable
      onClick={() => onViewDetail(batch.id)}
      styles={{ body: { padding: 14 } }}
      style={{
        borderRadius: 8,
        border: '1px solid #e2e8f0',
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.045)'
      }}
    >
      <Row gutter={[12, 12]} align="stretch">
        <Col xs={24} lg={8}>
          <SourceCollectionColumn batch={batch} onOpenExternalLink={onOpenExternalLink} />
        </Col>
        <Col xs={24} lg={8}>
          <AliCandidateCollectionColumn batch={batch} />
        </Col>
        <Col xs={24} lg={8}>
          <PurchaseProgressColumn
            batch={batch}
            poolCount={poolCount}
            maxPoolSize={maxPoolSize}
            finalists={finalists}
            topCandidate={topCandidate}
            onOpenExternalLink={onOpenExternalLink}
          />
        </Col>
      </Row>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 10,
          marginTop: 12,
          flexWrap: 'wrap'
        }}
      >
        <Text style={{ color: '#94a3b8', fontSize: 12 }}>更新：{batch.updatedAt}</Text>
        <Button
          type="primary"
          onClick={(event) => {
            event.stopPropagation();
            onViewDetail(batch.id);
          }}
          data-testid={`procurement-view-detail-${batch.id}`}
        >
          查看详情
        </Button>
      </div>
    </Card>
  );
}
