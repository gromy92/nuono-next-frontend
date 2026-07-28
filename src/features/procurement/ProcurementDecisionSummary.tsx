import { Alert, Col, Row, Space, Tag, Typography } from 'antd'
import {
  procurementCandidateDeliveryText,
  procurementCandidateMaterialText,
  procurementCandidateMoqText,
  procurementCandidatePackageText,
  procurementCandidatePendingQuestions,
  procurementCandidatePowerModeText,
  procurementCandidatePriceText,
  procurementCandidateSizeText
} from './domain'

const { Text } = Typography

export function ProcurementDecisionSummary({ model }: { model: any }) {
  const { procurementCompareSummary: summary, comparingProcurementCandidate: candidate } = model
  return (
    <>
      <Alert
        style={{ marginTop: 14 }}
        type={summary.overallColor === 'success' ? 'success' : summary.overallColor === 'processing' ? 'info' : 'warning'}
        showIcon
        message={`拟合判断：${summary.overallLabel}`}
        description={summary.overallDescription}
      />
      <Row gutter={[12, 12]} style={{ marginTop: 14 }}>
        <SignalCard
          title="当前相似点"
          titleColor="#166534"
          border="#d1fae5"
          background="#f0fdf4"
          tagColor="success"
          signals={summary.positiveSignals}
          emptyText="当前还没有足够明确的相似点结论。"
        />
        <SignalCard
          title="待确认点"
          titleColor="#92400e"
          border="#fde68a"
          background="#fffbeb"
          tagColor="warning"
          signals={summary.pendingSignals}
          emptyText="当前没有明显待确认点，可以优先推进。"
        />
      </Row>
      <Row gutter={[12, 12]} style={{ marginTop: 14 }}>
        <Col xs={24} xl={10}>
          <div style={{ ...decisionCardStyle, border: '1px solid #dbe4ea', background: '#ffffff' }}>
            <Text strong style={{ display: 'block', marginBottom: 8, color: '#0f172a' }}>候选标准化口径</Text>
            <Space wrap size={[8, 8]}>
              {[
                `价格 ${procurementCandidatePriceText(candidate)}`,
                `起订量 ${procurementCandidateMoqText(candidate)}`,
                `材质 ${procurementCandidateMaterialText(candidate)}`,
                `供电 ${procurementCandidatePowerModeText(candidate)}`,
                `尺寸 ${procurementCandidateSizeText(candidate)}`,
                `包装 ${procurementCandidatePackageText(candidate)}`,
                `交期 ${procurementCandidateDeliveryText(candidate)}`
              ].map((item) => <Tag key={item}>{item}</Tag>)}
            </Space>
          </div>
        </Col>
        <Col xs={24} xl={14}>
          <div style={{ ...decisionCardStyle, border: '1px solid #fed7aa', background: '#fff7ed' }}>
            <Text strong style={{ display: 'block', marginBottom: 8, color: '#9a3412' }}>采购待确认问题清单</Text>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              {procurementCandidatePendingQuestions(candidate).map((item, index) => (
                <div
                  key={`${index}-${item}`}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: '#ffffff',
                    border: '1px solid #fed7aa'
                  }}
                >
                  <Tag color="warning">{index + 1}</Tag>
                  <Text style={{ color: '#7c2d12' }}>{item}</Text>
                </div>
              ))}
            </Space>
          </div>
        </Col>
      </Row>
    </>
  )
}

const decisionCardStyle = {
  padding: 12,
  borderRadius: 10,
  height: '100%'
}

function SignalCard({
  title,
  titleColor,
  border,
  background,
  tagColor,
  signals,
  emptyText
}: {
  title: string
  titleColor: string
  border: string
  background: string
  tagColor: 'success' | 'warning'
  signals: string[]
  emptyText: string
}) {
  return (
    <Col xs={24} xl={12}>
      <div style={{ ...decisionCardStyle, border: `1px solid ${border}`, background }}>
        <Text strong style={{ display: 'block', marginBottom: 8, color: titleColor }}>{title}</Text>
        <Space wrap size={[8, 8]}>
          {signals.length
            ? signals.map((item) => <Tag key={item} color={tagColor}>{item}</Tag>)
            : <Text style={{ color: '#64748b' }}>{emptyText}</Text>}
        </Space>
      </div>
    </Col>
  )
}
