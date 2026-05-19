import { Button, Card, Col, Row, Space, Tag, Typography } from 'antd';
import type { CSSProperties } from 'react';
import { MAX_POOL_SIZE } from '../constants';
import { batchStatusMeta } from '../statusMeta';
import type {
  ProcurementCandidateRecord,
  ProcurementCollectionStatus,
  ProcurementRequirementRecord
} from '../types';

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

function SourceCollectionColumn({
  batch,
  onOpenExternalLink
}: {
  batch: ProcurementRequirementRecord;
  onOpenExternalLink: (url: string, label: string) => void;
}) {
  const sourceTitle = batch.sourceTitle?.trim();
  const hasSourceDetail = Boolean(batch.sourceDetailImageUrl);
  const sourceReady = batch.sourceCollectionStatus === 'SUCCESS' || batch.sourceCollectionStatus === 'PARTIAL_SUCCESS';

  return (
    <section style={columnPanelStyle}>
      <ColumnTitle title="源头商品采集状态" />
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        <Space wrap size={[6, 6]}>
          <CollectionStatusTag status={batch.sourceCollectionStatus} />
          <SourcePlatformTag platform={batch.sourcePlatform} />
          <Tag color="default">{batch.orderNo}</Tag>
        </Space>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <SourceVisual
            imageUrl={batch.sourceImageUrl}
            title={sourceTitle || '源头商品图片'}
            status={batch.sourceCollectionStatus}
          />
          <Space direction="vertical" size={5} style={{ minWidth: 0 }}>
            <div style={primaryTextStyle}>
              {sourceReady ? sourceTitle || '源头标题待采集' : '原链接采集中'}
            </div>
            <Text style={{ color: '#64748b' }}>{batch.sourceCollectionMessage}</Text>
            {hasSourceDetail ? (
              <Tag color="success" style={{ width: 'fit-content' }}>详情资料已采集</Tag>
            ) : null}
          </Space>
        </div>
        {batch.sourceUrl ? (
          <Button
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              onOpenExternalLink(batch.sourceUrl, sourceTitle || batch.orderNo);
            }}
          >
            打开来源商品
          </Button>
        ) : null}
      </Space>
    </section>
  );
}

function AliCandidateCollectionColumn({ batch }: { batch: ProcurementRequirementRecord }) {
  const hasCandidates = batch.candidateCount > 0;

  return (
    <section style={columnPanelStyle}>
      <ColumnTitle title="1688 候选采集状态" />
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        <Space wrap size={[6, 6]}>
          <CollectionStatusTag status={batch.candidateCollectionStatus} />
          {batch.candidateCollectionMethod ? <Tag color="blue">{batch.candidateCollectionMethod}</Tag> : null}
          {batch.candidateCollectionProgressPercent != null ? (
            <Tag color="default">{batch.candidateCollectionProgressPercent}%</Tag>
          ) : null}
        </Space>
        {hasCandidates ? (
          <>
            <div style={metricRowStyle}>
              <Metric label="已采集候选" value={`${batch.candidateCount} 个`} />
              <Metric label="推荐候选" value={`${batch.recommendedCandidateCount} 个`} />
            </div>
            <Text style={{ color: '#64748b' }}>
              {batch.candidateCollectionMessage}
            </Text>
            <CollectionTimeMeta batch={batch} />
          </>
        ) : (
          <div style={emptyStateStyle}>
            <Text style={{ color: '#64748b' }}>{batch.candidateCollectionMessage}</Text>
            <CollectionTimeMeta batch={batch} />
          </div>
        )}
      </Space>
    </section>
  );
}

function CollectionTimeMeta({ batch }: { batch: ProcurementRequirementRecord }) {
  const timeText = batch.candidateCollectionFinishedAt
    ? `完成：${batch.candidateCollectionFinishedAt}`
    : batch.candidateCollectionStartedAt
      ? `开始：${batch.candidateCollectionStartedAt}`
      : undefined;
  return timeText ? <Text style={{ color: '#94a3b8', fontSize: 12 }}>{timeText}</Text> : null;
}

function PurchaseProgressColumn({
  batch,
  poolCount,
  maxPoolSize,
  finalists,
  topCandidate,
  onOpenExternalLink
}: {
  batch: ProcurementRequirementRecord;
  poolCount: number;
  maxPoolSize: number;
  finalists: number;
  topCandidate?: ProcurementCandidateRecord;
  onOpenExternalLink: (url: string, label: string) => void;
}) {
  const candidateReady = batch.candidateCollectionStatus === 'SUCCESS' || batch.candidateCollectionStatus === 'PARTIAL_SUCCESS';
  const summary = summarizePurchaseProgress(batch, poolCount, maxPoolSize, finalists);
  const inquirySummary = summarizeInquiry(batch.candidates);

  return (
    <section style={columnPanelStyle}>
      <ColumnTitle title="Top5 / 自动询价 / AI 总结状态" />
      {!candidateReady ? (
        <div style={emptyStateStyle}>
          <Tag color="default">等待 1688 采集完成</Tag>
          <Text style={{ color: '#64748b' }}>1688 候选完成前不展示 Top5、自动询价、最终候选或 AI 总结。</Text>
        </div>
      ) : (
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Space wrap size={[6, 6]}>
            <Tag color={summary.color}>{summary.label}</Tag>
            <Tag color={finalists === 2 ? 'success' : 'default'}>最终 2 个 {finalists} / 2</Tag>
          </Space>
          <div style={metricRowStyle}>
            <Metric label="Top5" value={`${poolCount} / ${maxPoolSize}`} />
            <Metric label="已回复" value={`${inquirySummary.replied} 个`} />
            <Metric label="待人工" value={`${inquirySummary.handoff} 个`} />
          </div>
          <Text style={{ color: '#64748b' }}>{summary.description}</Text>
          {topCandidate ? (
            <div style={topCandidateStyle}>
              <Text strong style={{ color: '#0f172a' }}>首位 Top 候选</Text>
              <Text style={singleLineTextStyle}>{topCandidate.title}</Text>
              <Text style={{ color: '#64748b' }}>{topCandidate.supplierName}</Text>
              <Button
                size="small"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenExternalLink(topCandidate.candidateUrl, topCandidate.title);
                }}
              >
                打开 1688
              </Button>
            </div>
          ) : null}
        </Space>
      )}
    </section>
  );
}

function ColumnTitle({ title }: { title: string }) {
  return <Text strong style={{ color: '#0f172a' }}>{title}</Text>;
}

function SourceVisual({
  imageUrl,
  title,
  status
}: {
  imageUrl: string;
  title: string;
  status: ProcurementCollectionStatus;
}) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={title}
        style={{
          width: 76,
          height: 76,
          objectFit: 'cover',
          borderRadius: 8,
          border: '1px solid #dbe4ea',
          background: '#f8fafc',
          flexShrink: 0
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: 76,
        height: 76,
        borderRadius: 8,
        border: '1px dashed #cbd5e1',
        background: '#f8fafc',
        color: '#64748b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontSize: 12,
        textAlign: 'center',
        padding: 8
      }}
    >
      {status === 'COLLECTING' ? '图片采集中' : '暂无图片'}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ minWidth: 82 }}>
      <Text style={{ color: '#94a3b8', fontSize: 12 }}>{label}</Text>
      <div style={{ color: '#0f172a', fontWeight: 800 }}>{value}</div>
    </div>
  );
}

function CollectionStatusTag({ status }: { status: ProcurementCollectionStatus }) {
  const meta: Record<ProcurementCollectionStatus, { label: string; color: string }> = {
    NOT_STARTED: { label: '未开始', color: 'default' },
    COLLECTING: { label: '采集中', color: 'processing' },
    SUCCESS: { label: '采集成功', color: 'success' },
    PARTIAL_SUCCESS: { label: '部分成功', color: 'warning' },
    FAILED: { label: '采集失败', color: 'error' }
  };
  return <Tag color={meta[status].color}>{meta[status].label}</Tag>;
}

function SourcePlatformTag({ platform }: { platform: string }) {
  const normalized = platform.toLowerCase();
  const color = normalized === 'amazon' ? 'orange' : normalized === 'noon' ? 'blue' : 'default';
  return <Tag color={color}>{platform || '来源待识别'}</Tag>;
}

function summarizePurchaseProgress(
  batch: ProcurementRequirementRecord,
  poolCount: number,
  maxPoolSize: number,
  finalists: number
) {
  if (batch.status === 'SUMMARY_READY') {
    return {
      label: 'AI 总结已生成',
      color: 'purple',
      description: batch.aiSummary || batchStatusMeta[batch.status].description
    };
  }
  if (batch.status === 'FINAL_TWO_CONFIRMED') {
    return {
      label: '最终 2 个已确认',
      color: 'success',
      description: '最终候选已确认，等待或读取 AI 总结。'
    };
  }
  if (batch.status === 'POOL_INQUIRY_FINISHED') {
    return {
      label: '询价已收口',
      color: 'success',
      description: '自动询价已收口，可确认最终 2 个候选。'
    };
  }
  if (batch.status === 'POOL_INQUIRY_RUNNING') {
    return {
      label: `自动询价中 ${Math.min(poolCount, maxPoolSize)} / ${maxPoolSize}`,
      color: 'processing',
      description: '系统正在推进 Top5 自动询价和回复监听。'
    };
  }
  if (batch.status === 'POOL_PARTIAL_HANDOFF') {
    return {
      label: '待人工介入',
      color: 'error',
      description: '自动询价存在无回复或解析失败，需要采购人工处理。'
    };
  }
  if (poolCount > 0) {
    return {
      label: `Top5 已生成 ${Math.min(poolCount, maxPoolSize)} / ${maxPoolSize}`,
      color: 'processing',
      description: 'Top5 已生成，等待自动询价推进。'
    };
  }
  return {
    label: finalists ? `最终候选 ${finalists} / 2` : 'Top5 待生成',
    color: 'default',
    description: '1688 候选已有结果，等待系统生成 Top5。'
  };
}

function summarizeInquiry(candidates: ProcurementCandidateRecord[]) {
  return candidates.reduce(
    (summary, candidate) => {
      if (candidate.inquiryStatus === 'REPLIED' || candidate.inquiryStatus === 'PARTIAL_REPLY' || candidate.inquiryStatus === 'CLOSED') {
        summary.replied += 1;
      }
      if (candidate.inquiryStatus === 'NO_REPLY_HANDOFF' || candidate.inquiryStatus === 'SEND_FAILED' || candidate.inquiryStatus === 'REPLY_PARSE_FAILED') {
        summary.handoff += 1;
      }
      return summary;
    },
    { replied: 0, handoff: 0 }
  );
}

function resolvePreviewCandidate(candidates: ProcurementCandidateRecord[]) {
  return [...candidates]
    .filter((candidate) => candidate.inPool || candidate.rankNo > 0)
    .sort((left, right) => {
      const leftRank = left.poolRankNo ?? left.rankNo ?? 99;
      const rightRank = right.poolRankNo ?? right.rankNo ?? 99;
      return leftRank - rightRank;
    })[0];
}

const columnPanelStyle: CSSProperties = {
  minHeight: '100%',
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  background: '#ffffff',
  padding: 12
};

const primaryTextStyle: CSSProperties = {
  color: '#0f172a',
  fontSize: 15,
  fontWeight: 800,
  lineHeight: 1.35,
  wordBreak: 'break-word'
};

const singleLineTextStyle: CSSProperties = {
  color: '#334155',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  maxWidth: '100%'
};

const metricRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(82px, 1fr))',
  gap: 8
};

const emptyStateStyle: CSSProperties = {
  minHeight: 90,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  justifyContent: 'center'
};

const topCandidateStyle: CSSProperties = {
  display: 'grid',
  gap: 4,
  borderRadius: 8,
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  padding: 10,
  minWidth: 0
};
