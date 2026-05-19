import { Alert, Button, Card, Input, Space, Typography } from 'antd'
import type { Dispatch, SetStateAction } from 'react'
import type { AsyncActionState } from '../state'
import type { LogisticsQuoteBundleDetailDto } from '../types'

const { Paragraph, Text } = Typography
const { TextArea } = Input

type AnalysisSummaryCardProps = {
  bundle: LogisticsQuoteBundleDetailDto
  workbenchMode: string
  analysisSummaryDraft: string
  analysisSummaryState: AsyncActionState
  setAnalysisSummaryDraft: Dispatch<SetStateAction<string>>
  onSaveAnalysisSummary: () => void
}

export function AnalysisSummaryCard({
  bundle,
  workbenchMode,
  analysisSummaryDraft,
  analysisSummaryState,
  setAnalysisSummaryDraft,
  onSaveAnalysisSummary
}: AnalysisSummaryCardProps) {
  return (
    <Card title="来源分析摘要" bordered={false} style={{ boxShadow: '0 12px 32px rgba(15, 23, 42, 0.06)' }}>
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <Text type="secondary">
          当前只补一个来源层 `analysis_summary` 的保存与回读，不扩到上传、OCR 或运输方案。
        </Text>
        {workbenchMode === 'local-db' ? (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Alert
              type="success"
              showIcon
              message="已保存来源包的小编辑"
              description="本轮新增的是来源摘要 persisted edit/readback，用来确认 bundle 级分析说明能从本地库保存并真回读。"
            />
            {analysisSummaryState.status === 'error' && analysisSummaryState.message ? (
              <Alert type="warning" showIcon message="来源摘要更新失败" description={analysisSummaryState.message} />
            ) : null}
            <TextArea
              value={analysisSummaryDraft}
              onChange={(event) => setAnalysisSummaryDraft(event.target.value)}
              autoSize={{ minRows: 3, maxRows: 6 }}
              placeholder="更新来源分析摘要"
            />
            <Space>
              <Button
                type="primary"
                loading={analysisSummaryState.status === 'loading'}
                onClick={onSaveAnalysisSummary}
                disabled={!analysisSummaryDraft.trim()}
              >
                保存来源摘要
              </Button>
              <Button onClick={() => setAnalysisSummaryDraft(bundle.analysisSummary ?? '')}>
                回到当前已保存内容
              </Button>
            </Space>
          </Space>
        ) : (
          <Paragraph style={{ marginBottom: 0 }}>{bundle.analysisSummary || '当前仍是样本态摘要。'}</Paragraph>
        )}
      </Space>
    </Card>
  )
}
