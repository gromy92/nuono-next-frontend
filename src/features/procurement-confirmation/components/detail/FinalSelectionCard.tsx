import { Alert, Button, Card, Descriptions, Divider, Space } from 'antd';
import { canEditFinalSelection, canOpenFinalSelection, formatFinalPick } from '../../domain';
import type { ProcurementCandidateRecord, ProcurementRequirementRecord } from '../../types';
import type { FinalCandidateToggleHandler } from './types';

type FinalSelectionCardProps = {
  batch: ProcurementRequirementRecord;
  poolCandidates: ProcurementCandidateRecord[];
  finalCandidates: ProcurementCandidateRecord[];
  onToggleFinalPick: FinalCandidateToggleHandler;
};

export function FinalSelectionCard({
  batch,
  poolCandidates,
  finalCandidates,
  onToggleFinalPick
}: FinalSelectionCardProps) {
  return (
    <Card
      title="最终 2 个与 AI 总结"
      bordered={false}
      style={{ borderRadius: 22, border: '1px solid #e2e8f0' }}
    >
      <Space direction="vertical" size={14} style={{ width: '100%' }}>
        <Alert
          type={canOpenFinalSelection(batch.status) ? 'success' : 'info'}
          showIcon
          message={
            canEditFinalSelection(batch.status)
              ? '最终候选可确认'
              : canOpenFinalSelection(batch.status)
                ? '最终 2 个已确认'
                : '最终候选待开放'
          }
          description={
            canEditFinalSelection(batch.status)
              ? '当前可以从待选池里选最终 2 个；确认后系统会自动生成 AI 总结。'
              : canOpenFinalSelection(batch.status)
                ? '最终 2 个已锁定，AI 总结会随确认结果自动生成。'
                : '只有在自动询价收口后，才允许进入“最终 2 个”。'
          }
        />
        <Space wrap size={[8, 8]}>
          {poolCandidates.map((candidate) => (
            <Button
              key={`${candidate.id}-final-pick`}
              data-testid={`procurement-final-pick-${candidate.poolItemId ?? candidate.candidateId}`}
              type={candidate.finalPick ? 'primary' : 'default'}
              disabled={!canEditFinalSelection(batch.status)}
              onClick={() => onToggleFinalPick(batch.id, candidate.id)}
            >
              {candidate.finalPick ? `${candidate.title} · ${formatFinalPick(candidate.finalPick)}` : `选择 ${candidate.title}`}
            </Button>
          ))}
        </Space>
        <Divider style={{ marginBlock: 0 }} />
        <Descriptions bordered column={1} size="small">
          <Descriptions.Item label="当前最终 2 个">
            {finalCandidates.length
              ? finalCandidates
                  .sort((left, right) => (left.finalPick === 'PRIMARY' ? -1 : 1) - (right.finalPick === 'PRIMARY' ? -1 : 1))
                  .map((candidate) => `${formatFinalPick(candidate.finalPick)}：${candidate.title}`)
                  .join('；')
              : '尚未确认'}
          </Descriptions.Item>
          <Descriptions.Item label="AI 总结">
            {batch.aiSummary || '确认最终 2 个后系统自动生成。'}
          </Descriptions.Item>
          <Descriptions.Item label="采购备注">
            {batch.finalDecisionNote || '暂无备注'}
          </Descriptions.Item>
        </Descriptions>
      </Space>
    </Card>
  );
}
