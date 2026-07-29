import { Button, Col, Row, Space, Tag, Typography } from 'antd'
import {
  procurementCandidateDisplayTitle,
  procurementNextActionMeta
} from './domain'
import { ProcurementPreviewPanel } from './preview'
import type {
  ProcurementComparisonContext,
  ProcurementComparisonModel
} from './ProcurementComparisonPanel'

const { Text } = Typography

type Props = {
  context: ProcurementComparisonContext
  model: ProcurementComparisonModel['header']
}

export function ProcurementComparisonHeader({ context, model }: Props) {
  const {
    selectedProcurementItem,
    comparingProcurementCandidate,
    procurementCompareSummary
  } = context
  const {
    procurementSourcePreviewFrames,
    procurementSourcePreviewKey,
    setProcurementSourcePreviewKey,
    procurementCandidatePreviewFrames,
    procurementCandidatePreviewKey,
    setProcurementCandidatePreviewKey,
    activeProcurementSourceFrame,
    activeProcurementCandidateFrame
  } = model
  const nextAction = procurementNextActionMeta(comparingProcurementCandidate.nextAction)

  return (
    <>
      <Space wrap size={[8, 8]} style={{ width: '100%', justifyContent: 'space-between', marginBottom: 12 }}>
        <Space wrap size={[8, 8]}>
          <Text strong style={{ fontSize: 15 }}>原商品与候选商品对比</Text>
          <Tag color={procurementCompareSummary.overallColor} style={{ marginInlineEnd: 0 }}>
            {procurementCompareSummary.overallLabel}
          </Tag>
          {nextAction ? <Tag color={nextAction.color} style={{ marginInlineEnd: 0 }}>{nextAction.label}</Tag> : null}
        </Space>
        <Space wrap size={[8, 8]} style={{ justifyContent: 'flex-end' }}>
          <Text style={{ color: '#64748b' }}>
            当前对比候选：{procurementCandidateDisplayTitle(comparingProcurementCandidate)}
          </Text>
          {selectedProcurementItem.sourceUrl ? (
            <Button
              type="link"
              style={{ paddingInline: 0 }}
              onClick={() => window.open(selectedProcurementItem.sourceUrl, '_blank', 'noopener,noreferrer')}
            >
              打开原商品页
            </Button>
          ) : null}
          {comparingProcurementCandidate.candidateUrl ? (
            <Button
              type="link"
              style={{ paddingInline: 0 }}
              onClick={() => window.open(comparingProcurementCandidate.candidateUrl, '_blank', 'noopener,noreferrer')}
            >
              打开候选商品页
            </Button>
          ) : null}
        </Space>
      </Space>

      <Row gutter={[16, 16]} style={{ marginBottom: 14 }}>
        <Col xs={24} xl={12}>
          <ProcurementPreviewPanel
            sectionLabel="原商品图"
            roleLabel="原商品"
            platform={selectedProcurementItem.sourcePlatform}
            frames={procurementSourcePreviewFrames}
            activeKey={procurementSourcePreviewKey}
            onChange={setProcurementSourcePreviewKey}
          />
        </Col>
        <Col xs={24} xl={12}>
          <ProcurementPreviewPanel
            sectionLabel="候选商品图"
            roleLabel="候选商品"
            platform={comparingProcurementCandidate.candidatePlatform}
            frames={procurementCandidatePreviewFrames}
            activeKey={procurementCandidatePreviewKey}
            onChange={setProcurementCandidatePreviewKey}
            extraTag={comparingProcurementCandidate.selected ? <Tag color="success">当前意向采购</Tag> : undefined}
          />
        </Col>
      </Row>

      {activeProcurementSourceFrame && activeProcurementCandidateFrame ? (
        <div
          style={{
            marginBottom: 14,
            padding: 14,
            borderRadius: 12,
            border: '1px solid #dbe4ea',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f0fdfa 100%)'
          }}
        >
          <Space direction="vertical" size={10} style={{ width: '100%' }}>
            <Space wrap size={[8, 8]}>
              <Text strong style={{ color: '#0f172a' }}>当前比对焦点</Text>
              <Tag>原商品：{activeProcurementSourceFrame.label}</Tag>
              <Tag color="processing">候选商品：{activeProcurementCandidateFrame.label}</Tag>
            </Space>
            <Text style={{ color: '#475569' }}>
              先看这一组图片和要点是否接近，再决定要不要继续询价或直接保留在候选池。
            </Text>
            <Row gutter={[12, 12]}>
              <FocusSignals
                title="原商品判断重点"
                color="default"
                signals={activeProcurementSourceFrame.highlights}
                span={10}
              />
              <FocusSignals
                title="候选商品判断重点"
                color="processing"
                signals={activeProcurementCandidateFrame.highlights}
                span={10}
              />
              <Col xs={24} xl={4}>
                <div style={focusCardStyle}>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>当前结论</Text>
                  <Tag color={procurementCompareSummary.overallColor} style={{ marginBottom: 8 }}>
                    {procurementCompareSummary.overallLabel}
                  </Tag>
                  <Text style={{ display: 'block', color: '#64748b', fontSize: 12 }}>
                    {procurementCompareSummary.overallDescription}
                  </Text>
                </div>
              </Col>
            </Row>
          </Space>
        </div>
      ) : null}
    </>
  )
}

const focusCardStyle = {
  padding: 12,
  borderRadius: 10,
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  height: '100%'
}

function FocusSignals({
  title,
  color,
  signals,
  span
}: {
  title: string
  color: 'default' | 'processing'
  signals: string[]
  span: number
}) {
  return (
    <Col xs={24} xl={span}>
      <div style={focusCardStyle}>
        <Text strong style={{ display: 'block', color: '#0f172a', marginBottom: 8 }}>{title}</Text>
        <Space wrap size={[8, 8]}>
          {signals.slice(0, 3).map((item) => <Tag key={item} color={color}>{item}</Tag>)}
        </Space>
      </div>
    </Col>
  )
}
