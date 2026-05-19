import { Progress, Typography } from 'antd'
import type { ProductSelectionSourceCollection } from '../../source-collection/types'
import { buildLogisticsAssessment } from './ManualSelectionLogisticsAssessment.utils'

const { Text } = Typography

type ManualSelectionLogisticsAssessmentProps = {
  record: ProductSelectionSourceCollection
}

export function ManualSelectionLogisticsAssessment({ record }: ManualSelectionLogisticsAssessmentProps) {
  const assessment = buildLogisticsAssessment(record)
  const percent = Math.round((assessment.completenessCount / assessment.completenessTotal) * 100)

  return (
    <div className="manual-selection-logistics" data-testid="manual-selection-logistics-assessment">
      <div className="manual-selection-logistics-summary">
        <div className="manual-selection-logistics-summary-main">
          <div className="manual-selection-logistics-tags">
            <span className={`manual-selection-logistics-risk is-${assessment.riskLevel}`}>
              {assessment.riskText}
            </span>
            <span className="manual-selection-logistics-tag">{assessment.statusTag}</span>
            <span className="manual-selection-logistics-tag">{assessment.routeSuggestion}</span>
          </div>
          <Text className="manual-selection-logistics-recommendation">
            {assessment.recommendation}
          </Text>
        </div>
        <div className="manual-selection-logistics-progress">
          <div className="manual-selection-logistics-progress-head">
            <span>物流信息完整度</span>
            <strong>{assessment.completenessCount}/{assessment.completenessTotal}</strong>
          </div>
          <Progress percent={percent} showInfo={false} size="small" />
        </div>
      </div>

      <div className="manual-selection-logistics-field-grid">
        {assessment.fields.map((field) => (
          <div
            key={field.label}
            className={`manual-selection-logistics-field${field.missing ? ' is-missing' : ''}`}
          >
            <span className="manual-selection-logistics-field-label">{field.label}</span>
            <strong>{field.value}</strong>
            <span className="manual-selection-logistics-field-source">{field.source}</span>
          </div>
        ))}
      </div>

      <div className="manual-selection-logistics-panel-grid">
        <div className="manual-selection-logistics-panel">
          <div className="manual-selection-logistics-panel-title">风险标签</div>
          <div className="manual-selection-logistics-chip-list">
            {assessment.riskTags.length ? (
              assessment.riskTags.map((tag) => (
                <span key={tag} className="manual-selection-logistics-chip">{tag}</span>
              ))
            ) : (
              <Text type="secondary">暂无明显物流敏感风险</Text>
            )}
          </div>
        </div>

        <div className="manual-selection-logistics-panel">
          <div className="manual-selection-logistics-panel-title">来源与缺失</div>
          <div className="manual-selection-logistics-source-list">
            {assessment.sources.map((source) => (
              <div key={source}>{source}</div>
            ))}
            <div>
              缺失：
              {assessment.missingFields.length ? assessment.missingFields.join('、') : '暂无关键缺失'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
