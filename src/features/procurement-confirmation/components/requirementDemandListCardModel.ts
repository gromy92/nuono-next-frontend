import type { CSSProperties } from 'react';
import { batchStatusMeta } from '../statusMeta';
import type {
  ProcurementCandidateRecord,
  ProcurementRequirementRecord
} from '../types';

export function summarizePurchaseProgress(
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

export function summarizeInquiry(candidates: ProcurementCandidateRecord[]) {
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

export function resolvePreviewCandidate(candidates: ProcurementCandidateRecord[]) {
  return [...candidates]
    .filter((candidate) => candidate.inPool || candidate.rankNo > 0)
    .sort((left, right) => {
      const leftRank = left.poolRankNo ?? left.rankNo ?? 99;
      const rightRank = right.poolRankNo ?? right.rankNo ?? 99;
      return leftRank - rightRank;
    })[0];
}

export const columnPanelStyle: CSSProperties = {
  minHeight: '100%',
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  background: '#ffffff',
  padding: 12
};

export const primaryTextStyle: CSSProperties = {
  color: '#0f172a',
  fontSize: 15,
  fontWeight: 800,
  lineHeight: 1.35,
  wordBreak: 'break-word'
};

export const singleLineTextStyle: CSSProperties = {
  color: '#334155',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  maxWidth: '100%'
};

export const metricRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(82px, 1fr))',
  gap: 8
};

export const emptyStateStyle: CSSProperties = {
  minHeight: 90,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  justifyContent: 'center'
};

export const topCandidateStyle: CSSProperties = {
  display: 'grid',
  gap: 4,
  borderRadius: 8,
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  padding: 10,
  minWidth: 0
};
