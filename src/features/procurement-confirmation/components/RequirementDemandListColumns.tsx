import { Button, Space, Tag, Typography } from 'antd';
import type {
  ProcurementCandidateRecord,
  ProcurementCollectionStatus,
  ProcurementRequirementRecord
} from '../types';
import {
  columnPanelStyle,
  emptyStateStyle,
  metricRowStyle,
  primaryTextStyle,
  singleLineTextStyle,
  summarizeInquiry,
  summarizePurchaseProgress,
  topCandidateStyle
} from './requirementDemandListCardModel';

const { Text } = Typography;

export function SourceCollectionColumn({
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

export function AliCandidateCollectionColumn({ batch }: { batch: ProcurementRequirementRecord }) {
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

export function PurchaseProgressColumn({
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

function CollectionTimeMeta({ batch }: { batch: ProcurementRequirementRecord }) {
  const timeText = batch.candidateCollectionFinishedAt
    ? `完成：${batch.candidateCollectionFinishedAt}`
    : batch.candidateCollectionStartedAt
      ? `开始：${batch.candidateCollectionStartedAt}`
      : undefined;
  return timeText ? <Text style={{ color: '#94a3b8', fontSize: 12 }}>{timeText}</Text> : null;
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
