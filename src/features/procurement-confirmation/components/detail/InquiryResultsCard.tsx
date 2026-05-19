import { Button, Card, Col, Descriptions, Empty, Row, Space, Tag, Typography } from 'antd';
import { canAdjustCandidatePool, canEditFinalSelection, canFinishInquiryForBatch } from '../../domain';
import { externalResultStatusMeta, inquiryChannelMeta, inquiryStatusMeta, replyParseStatusMeta } from '../../statusMeta';
import type { ProcurementCandidateRecord, ProcurementRequirementRecord } from '../../types';
import type { BatchOperationHandler, CandidateOperationHandler } from './types';

const { Link, Text } = Typography;

type InquiryResultsCardProps = {
  batch: ProcurementRequirementRecord;
  candidates: ProcurementCandidateRecord[];
  actionLoadingKey: string | null;
  onFinishInquiry: BatchOperationHandler;
  onConfirmFinalTwo: BatchOperationHandler;
  onRecordReply: CandidateOperationHandler;
  onAdvanceFollowUp: CandidateOperationHandler;
  onMarkNoReplyHandoff: CandidateOperationHandler;
  onMarkParseFailure: CandidateOperationHandler;
};

export function InquiryResultsCard({
  batch,
  candidates,
  actionLoadingKey,
  onFinishInquiry,
  onConfirmFinalTwo,
  onRecordReply,
  onAdvanceFollowUp,
  onMarkNoReplyHandoff,
  onMarkParseFailure
}: InquiryResultsCardProps) {
  return (
    <Card
      title="待选池询价结果"
      extra={
        <Space>
          <Button
            data-testid="procurement-finish-inquiry-button"
            loading={actionLoadingKey === `finish-${batch.id}`}
            disabled={!canFinishInquiryForBatch(batch)}
            onClick={() => onFinishInquiry(batch.id)}
          >
            收口询价
          </Button>
          <Button
            data-testid="procurement-confirm-final-button"
            loading={actionLoadingKey === `final-${batch.id}`}
            disabled={!canEditFinalSelection(batch.status)}
            onClick={() => onConfirmFinalTwo(batch.id)}
          >
            确认最终 2 个
          </Button>
        </Space>
      }
      bordered={false}
      style={{ borderRadius: 22, border: '1px solid #e2e8f0' }}
    >
      {candidates.length ? (
        <Space direction="vertical" size={14} style={{ width: '100%' }}>
          {candidates.map((candidate) => {
            const inquiryMeta = inquiryStatusMeta[candidate.inquiryStatus];
            return (
              <Card
                data-testid={`procurement-inquiry-result-${candidate.poolItemId ?? candidate.candidateId}`}
                key={`${candidate.id}-inquiry`}
                size="small"
                bordered={false}
                style={{ borderRadius: 18, background: '#fbfdff', border: '1px solid #e2e8f0' }}
              >
                <Row gutter={[14, 14]}>
                  <Col xs={24} md={7}>
                    <Space direction="vertical" size={8} style={{ width: '100%' }}>
                      <Space wrap size={[8, 8]}>
                        <Tag color="default">待选 {candidate.poolRankNo}</Tag>
                        <Tag color={inquiryMeta.color}>{inquiryMeta.label}</Tag>
                        {candidate.plannedChannel ? (
                          <Tag color={resolveMeta(inquiryChannelMeta, candidate.plannedChannel).color}>
                            计划 {resolveMeta(inquiryChannelMeta, candidate.plannedChannel).label}
                          </Tag>
                        ) : null}
                        {candidate.activeChannel ? (
                          <Tag color={resolveMeta(inquiryChannelMeta, candidate.activeChannel).color}>
                            执行 {resolveMeta(inquiryChannelMeta, candidate.activeChannel).label}
                          </Tag>
                        ) : null}
                      </Space>
                      <div style={{ color: '#0f172a', fontSize: 16, fontWeight: 700 }}>{candidate.title}</div>
                      <Text style={{ color: '#475569' }}>{candidate.supplierName}</Text>
                      <Text style={{ color: '#64748b' }}>{inquiryMeta.description}</Text>
                    </Space>
                  </Col>
                  <Col xs={24} md={10}>
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="当前反馈">{candidate.replySummary}</Descriptions.Item>
                      <Descriptions.Item label="最近回复时间">{candidate.latestReplyAt || '尚无'}</Descriptions.Item>
                      <Descriptions.Item label="报价 / MOQ / 交期">
                        {candidate.quotePrice || '-'} / {candidate.quoteMoq || '-'} / {candidate.quoteDelivery || '-'}
                      </Descriptions.Item>
                      {candidate.channelFallbackReason ? (
                        <Descriptions.Item label="降级原因">{candidate.channelFallbackReason}</Descriptions.Item>
                      ) : null}
                      <Descriptions.Item label="1688 外部单据">
                        <Space wrap size={[8, 4]}>
                          {candidate.externalInquiryUrl ? (
                            <Link href={candidate.externalInquiryUrl} target="_blank" rel="noreferrer">
                              {candidate.externalInquiryId || '查看结果'}
                            </Link>
                          ) : (
                            <Text type="secondary">{candidate.externalInquiryId || '未创建外部单据'}</Text>
                          )}
                          {candidate.externalResultStatus ? (
                            <Tag color={resolveMeta(externalResultStatusMeta, candidate.externalResultStatus).color}>
                              {resolveMeta(externalResultStatusMeta, candidate.externalResultStatus).label}
                            </Tag>
                          ) : null}
                        </Space>
                      </Descriptions.Item>
                      <Descriptions.Item label="回复解析">
                        <Space wrap size={[8, 4]}>
                          {candidate.replySource ? (
                            <Tag color={resolveMeta(inquiryChannelMeta, candidate.replySource).color}>
                              {resolveMeta(inquiryChannelMeta, candidate.replySource).label}
                            </Tag>
                          ) : null}
                          {candidate.replyParseStatus ? (
                            <Tag color={resolveMeta(replyParseStatusMeta, candidate.replyParseStatus).color}>
                              {resolveMeta(replyParseStatusMeta, candidate.replyParseStatus).label}
                            </Tag>
                          ) : (
                            <Text type="secondary">待回复</Text>
                          )}
                          {candidate.replyParseError ? <Text type="danger">{candidate.replyParseError}</Text> : null}
                        </Space>
                      </Descriptions.Item>
                    </Descriptions>
                  </Col>
                  <Col xs={24} md={7}>
                    <Space direction="vertical" size={8} style={{ width: '100%' }}>
                      <Button
                        data-testid={`procurement-record-reply-${candidate.poolItemId ?? candidate.candidateId}`}
                        size="small"
                        loading={actionLoadingKey === `reply-${candidate.poolItemId}`}
                        disabled={!canAdjustCandidatePool(batch.status)}
                        onClick={() => onRecordReply(batch.id, candidate)}
                      >
                        记录收到回复
                      </Button>
                      <Button
                        data-testid={`procurement-advance-follow-up-${candidate.poolItemId ?? candidate.candidateId}`}
                        size="small"
                        loading={actionLoadingKey === `follow-${candidate.poolItemId}`}
                        disabled={!canAdjustCandidatePool(batch.status)}
                        onClick={() => onAdvanceFollowUp(batch.id, candidate)}
                      >
                        推进催发
                      </Button>
                      <Button
                        data-testid={`procurement-no-reply-handoff-${candidate.poolItemId ?? candidate.candidateId}`}
                        size="small"
                        loading={actionLoadingKey === `no-reply-${candidate.poolItemId}`}
                        disabled={!canAdjustCandidatePool(batch.status)}
                        onClick={() => onMarkNoReplyHandoff(batch.id, candidate)}
                      >
                        标记 24 小时无回复
                      </Button>
                      <Button
                        data-testid={`procurement-reply-parse-failed-${candidate.poolItemId ?? candidate.candidateId}`}
                        size="small"
                        danger
                        loading={actionLoadingKey === `parse-failed-${candidate.poolItemId}`}
                        disabled={!canAdjustCandidatePool(batch.status)}
                        onClick={() => onMarkParseFailure(batch.id, candidate)}
                      >
                        标记解析失败
                      </Button>
                    </Space>
                  </Col>
                </Row>
              </Card>
            );
          })}
        </Space>
      ) : (
        <Empty description="当前还没有待选池候选" />
      )}
    </Card>
  );
}

function resolveMeta(meta: Record<string, { label: string; color: string }>, value: string) {
  return meta[value] ?? { label: value, color: 'default' };
}
