import { Alert, Descriptions, Empty, Modal, Space, Tag, Typography } from 'antd'
import type { ProductSelectionSourceCollection } from '../../source-collection/types'
import type { ManualSelectionAiAnalysisResult } from '../types'

const { Text } = Typography

type ManualSelectionAiAnalysisModalProps = {
  loading: boolean
  open: boolean
  record: ProductSelectionSourceCollection | null
  result?: ManualSelectionAiAnalysisResult
  onCancel: () => void
}

function recommendationColor(level?: string) {
  if (level === 'recommend') return 'success'
  if (level === 'review') return 'warning'
  if (level === 'reject') return 'error'
  return 'default'
}

function recommendationText(level?: string) {
  if (level === 'recommend') return '推荐'
  if (level === 'review') return '复核'
  if (level === 'reject') return '不建议'
  return '未知'
}

function ResultSection({ title, items }: { title: string; items?: string[] }) {
  const values = (items || []).filter(Boolean)
  return (
    <div className="manual-selection-ai-section">
      <Text strong>{title}</Text>
      {values.length ? (
        <ul>
          {values.map((item, index) => (
            <li key={`${title}-${index}`}>{item}</li>
          ))}
        </ul>
      ) : (
        <Text type="secondary">暂无</Text>
      )}
    </div>
  )
}

export function ManualSelectionAiAnalysisModal(props: ManualSelectionAiAnalysisModalProps) {
  const { loading, open, record, result, onCancel } = props
  const success = result?.status === 'success'

  return (
    <Modal
      title="AI选品分析"
      open={open}
      width={860}
      footer={null}
      destroyOnClose
      confirmLoading={loading}
      onCancel={onCancel}
    >
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <Text strong ellipsis={{ tooltip: record?.sourceTitleCn || record?.selectedText || record?.sourceTitle }}>
          {record?.sourceTitleCn || record?.selectedText || record?.sourceTitle || '-'}
        </Text>

        {loading ? (
          <Alert type="info" showIcon message="AI 正在分析当前选品上下文" />
        ) : result ? (
          success ? (
            <>
              <div className="manual-selection-ai-summary">
                <div>
                  <span>结论</span>
                  <Tag color={recommendationColor(result.recommendationLevel)}>
                    {recommendationText(result.recommendationLevel)}
                  </Tag>
                </div>
                <div>
                  <span>评分</span>
                  <strong>{result.recommendationScore ?? 0}</strong>
                </div>
                <div>
                  <span>模型</span>
                  <Text ellipsis title={result.model}>{result.model || '-'}</Text>
                </div>
              </div>
              <Descriptions size="small" column={1} bordered>
                <Descriptions.Item label="判断">{result.conclusion || '-'}</Descriptions.Item>
                <Descriptions.Item label="摘要">{result.summary || '-'}</Descriptions.Item>
              </Descriptions>
              <div className="manual-selection-ai-grid">
                <ResultSection title="利润风险" items={result.profitRisks} />
                <ResultSection title="竞品风险" items={result.competitorRisks} />
                <ResultSection title="采购风险" items={result.procurementRisks} />
                <ResultSection title="物流/税费风险" items={result.logisticsRisks} />
                <ResultSection title="缺失信息" items={result.missingInformation} />
                <ResultSection title="下一步动作" items={result.nextActions} />
              </div>
              {result.warnings?.length ? (
                <Alert type="warning" showIcon message={result.warnings.join('；')} />
              ) : null}
            </>
          ) : (
            <Alert
              type="warning"
              showIcon
              message="AI 分析未完成"
              description={result.errorMessage || result.errorCode || 'AI 分析服务暂不可用。'}
            />
          )
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无 AI 分析结果" />
        )}
      </Space>
    </Modal>
  )
}
