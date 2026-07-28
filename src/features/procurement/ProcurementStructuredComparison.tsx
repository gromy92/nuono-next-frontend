import { Col, Descriptions, Row, Space, Tag, Typography } from 'antd'
import {
  formatProcurementPriceRange,
  procurementCandidateDeliveryText,
  procurementCandidateDisplayTitle,
  procurementCandidateGroupTypeMeta,
  procurementCandidateLevelMeta,
  procurementCandidateMaterialText,
  procurementCandidateMoqText,
  procurementCandidatePackageText,
  procurementCandidatePowerModeText,
  procurementCandidatePriceText,
  procurementCandidateSizeText,
  procurementDemandDisplayTitle,
  procurementDisplayText,
  procurementPlatformLabel,
  procurementRequirementText,
  procurementSourcePlatformColor,
  procurementStructuredFieldSourceMeta
} from './domain'

const { Text } = Typography

export function ProcurementStructuredComparison({ model }: { model: any }) {
  const { selectedProcurementItem: item, comparingProcurementCandidate: candidate } = model
  const sourceFieldMeta = procurementStructuredFieldSourceMeta(item.structuredFieldSource)
  const candidateFieldMeta = procurementStructuredFieldSourceMeta(candidate.structuredFieldSource)
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} xl={12}>
        <div style={comparisonCardStyle}>
          <Space wrap size={[8, 8]} style={{ marginBottom: 8 }}>
            <Tag color={procurementSourcePlatformColor(item.sourcePlatform)}>
              {procurementPlatformLabel(item.sourcePlatform)}
            </Tag>
            <Tag>原商品</Tag>
            <Tag color={sourceFieldMeta.color}>字段 {sourceFieldMeta.label}</Tag>
          </Space>
          <Text strong style={{ display: 'block', color: '#0f172a', marginBottom: 8 }}>
            {procurementDemandDisplayTitle(item)}
          </Text>
          <Descriptions
            size="small"
            column={1}
            colon={false}
            items={[
              {
                key: 'sourcePrice',
                label: '目标价格',
                children: formatProcurementPriceRange(item.targetPriceMin, item.targetPriceMax)
              },
              { key: 'sourceQty', label: '目标采购量', children: `${item.targetQuantity || '-'} 件` },
              { key: 'sourceSite', label: '目标站点', children: item.targetSite || '-' },
              {
                key: 'sourceRequirement',
                label: '采购要求',
                children: procurementRequirementText(item.specialRequirement)
              },
              { key: 'sourceMaterial', label: '目标材质', children: procurementDisplayText(item.targetMaterial) },
              { key: 'sourcePowerMode', label: '供电方式', children: procurementDisplayText(item.targetPowerMode) },
              { key: 'sourceSizeText', label: '尺寸重点', children: procurementDisplayText(item.targetSizeText) },
              { key: 'sourcePackageType', label: '包装要求', children: procurementDisplayText(item.targetPackageType) },
              { key: 'deliveryExpectation', label: '交期要求', children: procurementDisplayText(item.deliveryExpectation) }
            ]}
          />
        </div>
      </Col>
      <Col xs={24} xl={12}>
        <div style={comparisonCardStyle}>
          <Space wrap size={[8, 8]} style={{ marginBottom: 8 }}>
            <Tag color={procurementSourcePlatformColor(candidate.candidatePlatform)}>
              {procurementPlatformLabel(candidate.candidatePlatform)}
            </Tag>
            <Tag color={procurementCandidateLevelMeta(candidate.level).color}>
              {procurementCandidateLevelMeta(candidate.level).label}
            </Tag>
            <Tag color={candidateFieldMeta.color}>字段 {candidateFieldMeta.label}</Tag>
            {candidate.selected ? <Tag color="success">当前意向采购</Tag> : null}
            {candidate.groupLabel ? (
              <Tag color={procurementCandidateGroupTypeMeta(candidate.groupType).color}>{candidate.groupLabel}</Tag>
            ) : null}
          </Space>
          <Text strong style={{ display: 'block', color: '#0f172a', marginBottom: 8 }}>
            {procurementCandidateDisplayTitle(candidate)}
          </Text>
          <Descriptions
            size="small"
            column={1}
            colon={false}
            items={[
              { key: 'candidatePrice', label: '标准价格带', children: procurementCandidatePriceText(candidate) },
              { key: 'candidateMoq', label: '标准起订量', children: procurementCandidateMoqText(candidate) },
              { key: 'candidateSupplier', label: '供应商', children: candidate.supplierName || '-' },
              { key: 'candidateLocation', label: '发货地', children: candidate.locationText || '-' },
              { key: 'candidateMaterial', label: '材质', children: procurementCandidateMaterialText(candidate) },
              { key: 'candidatePowerMode', label: '供电方式', children: procurementCandidatePowerModeText(candidate) },
              { key: 'candidateSizeText', label: '尺寸', children: procurementCandidateSizeText(candidate) },
              { key: 'candidatePackageText', label: '包装', children: procurementCandidatePackageText(candidate) },
              { key: 'candidateDelivery', label: '标准交期', children: procurementCandidateDeliveryText(candidate) }
            ]}
          />
        </div>
      </Col>
    </Row>
  )
}

const comparisonCardStyle = {
  padding: 14,
  borderRadius: 10,
  border: '1px solid #dbe4ea',
  background: '#f8fafc',
  height: '100%'
}
