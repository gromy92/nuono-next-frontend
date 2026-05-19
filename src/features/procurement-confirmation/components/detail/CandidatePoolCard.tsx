import { Button, Card, Col, Empty, Row, Space, Tag, Typography } from 'antd';
import { MAX_POOL_SIZE } from '../../constants';
import { canAdjustCandidatePool, canEditFinalSelection, formatFinalPick } from '../../domain';
import { inquiryStatusMeta } from '../../statusMeta';
import type { ProcurementCandidateRecord, ProcurementRequirementRecord } from '../../types';
import type { CandidateOperationHandler, CandidateViewHandler, FinalCandidateToggleHandler } from './types';

const { Text } = Typography;

type CandidatePoolCardProps = {
  batch: ProcurementRequirementRecord;
  candidates: ProcurementCandidateRecord[];
  actionLoadingKey: string | null;
  onRemoveFromPool: CandidateOperationHandler;
  onToggleFinalPick: FinalCandidateToggleHandler;
  onViewSourceDetail: CandidateViewHandler;
};

export function CandidatePoolCard({
  batch,
  candidates,
  actionLoadingKey,
  onRemoveFromPool,
  onToggleFinalPick,
  onViewSourceDetail
}: CandidatePoolCardProps) {
  return (
    <Card
      title={`待选池 (${candidates.length} / ${MAX_POOL_SIZE})`}
      bordered={false}
      style={{ borderRadius: 22, border: '1px solid #e2e8f0' }}
    >
      {candidates.length ? (
        <Space direction="vertical" size={14} style={{ width: '100%' }}>
          {candidates.map((candidate) => {
            const inquiryMeta = inquiryStatusMeta[candidate.inquiryStatus];
            return (
              <Card
                data-testid={`procurement-pool-candidate-${candidate.poolItemId ?? candidate.candidateId}`}
                key={candidate.id}
                size="small"
                bordered={false}
                style={{ borderRadius: 18, background: '#f8fafc', border: '1px solid #e2e8f0' }}
              >
                <Row gutter={[14, 14]} align="middle">
                  <Col xs={24} md={5}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img
                        src={candidate.mainImageUrl}
                        alt={candidate.title}
                        style={{ width: 84, height: 84, borderRadius: 18, objectFit: 'cover' }}
                      />
                      <div>
                        <div style={{ color: '#0f172a', fontWeight: 700 }}>待选 {candidate.poolRankNo}</div>
                        <Text style={{ color: '#64748b' }}>原始排名 #{candidate.rankNo}</Text>
                      </div>
                    </div>
                  </Col>
                  <Col xs={24} md={11}>
                    <Space direction="vertical" size={6} style={{ width: '100%' }}>
                      <Space wrap size={[8, 8]}>
                        <Tag color="geekblue">offerId {candidate.offerId}</Tag>
                        <Tag color={inquiryMeta.color}>{inquiryMeta.label}</Tag>
                        {candidate.finalPick ? <Tag color="success">{formatFinalPick(candidate.finalPick)}</Tag> : null}
                      </Space>
                      <div style={{ color: '#0f172a', fontSize: 16, fontWeight: 700 }}>{candidate.title}</div>
                      <Text style={{ color: '#475569' }}>{candidate.supplierName}</Text>
                      <Text style={{ color: '#475569' }}>
                        {candidate.priceText} / {candidate.moqText} / {candidate.locationText}
                      </Text>
                      <Text style={{ color: '#64748b' }}>{candidate.replySummary}</Text>
                    </Space>
                  </Col>
                  <Col xs={24} md={8}>
                    <Space direction="vertical" size={8} style={{ width: '100%' }}>
                      <Space wrap size={[8, 8]}>
                        <Tag color="processing">总分 {candidate.totalScore}</Tag>
                        <Tag color="default">匹配 {candidate.scores.matchScore}</Tag>
                        <Tag color="default">规格 {candidate.scores.specScore}</Tag>
                        <Tag color="default">价格 {candidate.scores.priceScore}</Tag>
                      </Space>
                      <Space wrap size={[8, 8]}>
                        <Button
                          data-testid={`procurement-view-source-${candidate.poolItemId ?? candidate.candidateId}`}
                          size="small"
                          onClick={() => onViewSourceDetail(candidate)}
                        >
                          源数据与评分
                        </Button>
                        <Button
                          data-testid={`procurement-remove-pool-item-${candidate.poolItemId ?? candidate.candidateId}`}
                          size="small"
                          loading={actionLoadingKey === `remove-${candidate.poolItemId}`}
                          disabled={!canAdjustCandidatePool(batch.status)}
                          onClick={() => onRemoveFromPool(batch.id, candidate)}
                        >
                          终止询价并移出
                        </Button>
                        <Button
                          data-testid={`procurement-toggle-final-${candidate.poolItemId ?? candidate.candidateId}`}
                          size="small"
                          type={candidate.finalPick ? 'primary' : 'default'}
                          disabled={!canEditFinalSelection(batch.status)}
                          onClick={() => onToggleFinalPick(batch.id, candidate.id)}
                        >
                          {candidate.finalPick ? '移出最终 2 个' : '设为最终候选'}
                        </Button>
                      </Space>
                      {candidate.nextFollowUpAt ? (
                        <Text style={{ color: '#b45309', fontSize: 12 }}>下一动作：{candidate.nextFollowUpAt}</Text>
                      ) : null}
                    </Space>
                  </Col>
                </Row>
              </Card>
            );
          })}
        </Space>
      ) : (
        <Empty description="当前待选池为空" />
      )}
    </Card>
  );
}
