import { Descriptions, Space, Tag, Typography } from 'antd';
import type { ProfitQuickSignalsPayload } from '../profit-calculator/domain';
import {
  procurementCandidateMoqText,
  procurementCandidatePriceText,
  procurementDisplayArray,
  sanitizeProcurementCopy
} from './domain';
import { ProcurementCandidateProfitSignalPanel } from './ProcurementCandidateProfitSignalPanel';
import type { ProcurementCandidate } from './types';

const { Paragraph, Text } = Typography;

export function ProcurementCandidateEvidence({
  candidate,
  profitSignal,
  profitLoading
}: {
  candidate: ProcurementCandidate;
  profitSignal?: ProfitQuickSignalsPayload['signals'][number];
  profitLoading: boolean;
}) {
  const specificationTags = [
    (candidate.standardizedMaterialText || candidate.materialText)
      ? `材质 ${sanitizeProcurementCopy(candidate.standardizedMaterialText || candidate.materialText)}`
      : '',
    (candidate.standardizedPowerModeText || candidate.powerModeText)
      ? `供电 ${sanitizeProcurementCopy(candidate.standardizedPowerModeText || candidate.powerModeText)}`
      : '',
    (candidate.standardizedSizeText || candidate.sizeText)
      ? `尺寸 ${sanitizeProcurementCopy(candidate.standardizedSizeText || candidate.sizeText)}`
      : '',
    (candidate.standardizedPackageText || candidate.packageText)
      ? `包装 ${sanitizeProcurementCopy(candidate.standardizedPackageText || candidate.packageText)}`
      : '',
    (candidate.standardizedDeliveryText || candidate.deliveryTimelineText)
      ? `交期 ${sanitizeProcurementCopy(candidate.standardizedDeliveryText || candidate.deliveryTimelineText)}`
      : ''
  ].filter(Boolean);

  return (
    <>
      <Descriptions
        size="small"
        column={{ xs: 1, md: 2, xl: 3 }}
        style={{ marginTop: 12 }}
        items={[
          { key: 'price', label: '价格带', children: procurementCandidatePriceText(candidate) },
          { key: 'moq', label: '起订量', children: procurementCandidateMoqText(candidate) },
          { key: 'priceScore', label: '价格符合度', children: candidate.priceScore ?? '-' },
          { key: 'supplierScore', label: '供应商能力', children: candidate.supplierScore ?? '-' },
          { key: 'spec', label: '规格信息', children: candidate.specScore ?? '-' },
          { key: 'logisticsScore', label: '物流履约', children: candidate.logisticsScore ?? '-' }
        ]}
      />

      <ProcurementCandidateProfitSignalPanel signal={profitSignal} loading={profitLoading} />

      <Space wrap size={[8, 8]} style={{ marginTop: 12 }}>
        {specificationTags.map((item) => (
          <Tag key={`${candidate.id}-${item}`} color="default" style={{ marginInlineEnd: 0 }}>
            {item}
          </Tag>
        ))}
      </Space>

      {candidate.badges.length ? (
        <Space wrap size={[8, 8]} style={{ marginTop: 12 }}>
          {procurementDisplayArray(candidate.badges).map((badge) => (
            <Tag key={`${candidate.id}-${badge}`} color="default" style={{ marginInlineEnd: 0 }}>
              {badge}
            </Tag>
          ))}
        </Space>
      ) : null}

      {candidate.reasons.length ? (
        <div style={{ marginTop: 12 }}>
          <Text strong style={{ display: 'block', marginBottom: 6 }}>推荐理由</Text>
          <Space wrap size={[8, 8]}>
            {procurementDisplayArray(candidate.reasons).map((reason) => (
              <Tag key={`${candidate.id}-${reason}`} color="success" style={{ marginInlineEnd: 0 }}>
                {reason}
              </Tag>
            ))}
          </Space>
        </div>
      ) : null}

      {candidate.warnings.length ? (
        <div style={{ marginTop: 12 }}>
          <Text strong style={{ display: 'block', marginBottom: 6 }}>风险点</Text>
          <Space wrap size={[8, 8]}>
            {procurementDisplayArray(candidate.warnings).map((warning) => (
              <Tag key={`${candidate.id}-${warning}`} color="warning" style={{ marginInlineEnd: 0 }}>
                {warning}
              </Tag>
            ))}
          </Space>
        </div>
      ) : null}

      {candidate.manualReviewNote || candidate.inquirySummary ? (
        <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <Text strong style={{ display: 'block', marginBottom: 6 }}>已保存的人工判断</Text>
          {candidate.manualReviewNote ? (
            <Paragraph style={{ margin: 0, color: '#475569' }}>判断备注：{candidate.manualReviewNote}</Paragraph>
          ) : null}
          {candidate.inquirySummary ? (
            <Paragraph style={{ margin: candidate.manualReviewNote ? '8px 0 0' : 0, color: '#475569' }}>
              询价结论：{candidate.inquirySummary}
            </Paragraph>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
