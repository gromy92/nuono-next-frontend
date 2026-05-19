import { Button, Card, Col, Descriptions, Empty, Row, Space, Tag, Typography } from 'antd';
import { MAX_POOL_SIZE } from '../../constants';
import { canAdjustCandidatePool } from '../../domain';
import { inquiryStatusMeta } from '../../statusMeta';
import type { ProcurementCandidateRecord, ProcurementRequirementRecord } from '../../types';
import type { CandidateOperationHandler, CandidateViewHandler, ExternalLinkHandler } from './types';

const { Text } = Typography;

type BackupCandidatePoolCardProps = {
  batch: ProcurementRequirementRecord;
  candidates: ProcurementCandidateRecord[];
  poolCount: number;
  actionLoadingKey: string | null;
  onAddToPool: CandidateOperationHandler;
  onOpenExternalLink: ExternalLinkHandler;
  onViewSourceDetail: CandidateViewHandler;
};

export function BackupCandidatePoolCard({
  batch,
  candidates,
  poolCount,
  actionLoadingKey,
  onAddToPool,
  onOpenExternalLink,
  onViewSourceDetail
}: BackupCandidatePoolCardProps) {
  return (
    <Card
      title="备选池"
      bordered={false}
      style={{ borderRadius: 22, border: '1px solid #e2e8f0' }}
    >
      {candidates.length ? (
        <Row gutter={[14, 14]}>
          {candidates.map((candidate) => (
            <Col xs={24} md={12} key={candidate.id}>
              <Card
                data-testid={`procurement-backup-candidate-${candidate.candidateId}`}
                size="small"
                bordered={false}
                style={{
                  borderRadius: 18,
                  border: '1px solid #e5e7eb',
                  background: '#ffffff',
                  minHeight: 272
                }}
              >
                <Space direction="vertical" size={10} style={{ width: '100%' }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <img
                      src={candidate.mainImageUrl}
                      alt={candidate.title}
                      style={{ width: 84, height: 84, borderRadius: 18, objectFit: 'cover' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Space wrap size={[8, 8]}>
                        <Tag color="default">#{candidate.rankNo}</Tag>
                        <Tag color="geekblue">offerId {candidate.offerId}</Tag>
                        <Tag color={inquiryStatusMeta[candidate.inquiryStatus].color}>{inquiryStatusMeta[candidate.inquiryStatus].label}</Tag>
                      </Space>
                      <div style={{ color: '#0f172a', fontSize: 16, fontWeight: 700, lineHeight: 1.4 }}>{candidate.title}</div>
                      <Text style={{ color: '#475569' }}>{candidate.supplierName}</Text>
                    </div>
                  </div>
                  <Space wrap size={[8, 8]}>
                    {candidate.tags.map((tag) => (
                      <Tag key={tag} color="processing">
                        {tag}
                      </Tag>
                    ))}
                    {candidate.warnings.map((tag) => (
                      <Tag key={tag} color="warning">
                        {tag}
                      </Tag>
                    ))}
                  </Space>
                  <Descriptions size="small" column={1}>
                    <Descriptions.Item label="价格">{candidate.priceText}</Descriptions.Item>
                    <Descriptions.Item label="MOQ">{candidate.moqText}</Descriptions.Item>
                    <Descriptions.Item label="交期 / 发货地">{candidate.deliveryText} / {candidate.locationText}</Descriptions.Item>
                  </Descriptions>
                  <Space wrap size={[8, 8]}>
                    <Tag color="processing">总分 {candidate.totalScore}</Tag>
                    <Tag color="default">相似度 {candidate.scores.matchScore}</Tag>
                    <Tag color="default">价格 {candidate.scores.priceScore}</Tag>
                    <Tag color="default">规格 {candidate.scores.specScore}</Tag>
                  </Space>
                  <Space wrap size={[8, 8]}>
                    <Button
                      data-testid={`procurement-add-backup-${candidate.candidateId}`}
                      size="small"
                      type="primary"
                      loading={actionLoadingKey === `add-${candidate.candidateId}`}
                      disabled={poolCount >= MAX_POOL_SIZE || !canAdjustCandidatePool(batch.status)}
                      onClick={() => onAddToPool(batch.id, candidate)}
                    >
                      {poolCount >= MAX_POOL_SIZE ? '待选池已满' : '加入待选池并自动询价'}
                    </Button>
                    <Button
                      data-testid={`procurement-open-backup-1688-${candidate.candidateId}`}
                      size="small"
                      onClick={() => onOpenExternalLink(candidate.candidateUrl, candidate.title)}
                    >
                      打开 1688 链接
                    </Button>
                    <Button
                      data-testid={`procurement-view-backup-source-${candidate.candidateId}`}
                      size="small"
                      onClick={() => onViewSourceDetail(candidate)}
                    >
                      源数据与评分
                    </Button>
                  </Space>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Empty description="当前没有可补入的备选候选" />
      )}
    </Card>
  );
}
