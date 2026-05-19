import { Button, Col, Descriptions, Row, Space, Tag, Typography } from 'antd';
import type { ProfitQuickSignalsPayload } from '../profit-calculator/domain';
import {
  procurementAutoInquiryBusinessAction,
  procurementAutoInquiryBusinessKey,
  procurementAutoInquiryBusinessMeta
} from './autoInquiry';
import {
  procurementCandidateDisplayTitle,
  procurementCandidateLevelMeta,
  procurementCandidateMoqText,
  procurementCandidatePriceText,
  procurementDisplayArray,
  procurementImageModeMeta,
  procurementNextActionMeta,
  procurementPlatformLabel,
  procurementSourcePlatformColor,
  procurementStructuredFieldSourceMeta,
  sanitizeProcurementCopy
} from './domain';
import {
  buildProcurementCandidatePreviewFrames,
  ProcurementGeneratedThumb
} from './preview';
import { ProcurementCandidateProfitSignalPanel } from './ProcurementCandidateProfitSignalPanel';
import type { ProcurementAutoInquiryBusinessStateMap, ProcurementCandidate } from './types';

const { Paragraph: AntdParagraph, Text } = Typography;

type ProcurementCandidateResultCardProps = {
  candidate: ProcurementCandidate;
  demandItemId: number;
  comparingCandidateId?: number;
  selecting: boolean;
  profitSignal?: ProfitQuickSignalsPayload['signals'][number];
  profitLoading: boolean;
  autoInquiryBusinessStates: ProcurementAutoInquiryBusinessStateMap;
  onCompare: (candidateId: number) => void;
  onSelect: (candidateId: number) => void | Promise<void>;
  onStartAutoInquiry: (candidate: ProcurementCandidate) => void | Promise<void>;
  onOpenCandidateUrl: (url: string) => void;
};

export function ProcurementCandidateResultCard({
  candidate,
  demandItemId,
  comparingCandidateId,
  selecting,
  profitSignal,
  profitLoading,
  autoInquiryBusinessStates,
  onCompare,
  onSelect,
  onStartAutoInquiry,
  onOpenCandidateUrl
}: ProcurementCandidateResultCardProps) {
  const candidateMeta = procurementCandidateLevelMeta(candidate.level);
  const candidateFieldMeta = procurementStructuredFieldSourceMeta(candidate.structuredFieldSource);
  const candidateMainFrame = buildProcurementCandidatePreviewFrames(candidate)[0];
  const candidateImageMeta = procurementImageModeMeta(candidateMainFrame?.imageMode);
  const candidateAutoInquiryState = autoInquiryBusinessStates[procurementAutoInquiryBusinessKey(demandItemId, candidate.id)];
  const candidateAutoInquiryMeta = procurementAutoInquiryBusinessMeta(candidateAutoInquiryState, candidate);
  const candidateAutoInquiryAction = procurementAutoInquiryBusinessAction(candidateAutoInquiryState, candidate);
  const isComparing = candidate.id === comparingCandidateId;
  const pendingQuestionCount = procurementDisplayArray(candidate.pendingQuestions).length;

  return (
    <div
      style={{
        padding: 16,
        borderRadius: 12,
        border: isComparing ? '1px solid #0f766e' : candidate.selected ? '1px solid #16a34a' : '1px solid #dbe4ea',
        background: isComparing ? '#f0fdfa' : candidate.selected ? '#f0fdf4' : '#ffffff'
      }}
    >
      <Row gutter={[16, 16]} justify="space-between" align="top">
        <Col flex="auto">
          <Space wrap size={[8, 8]} style={{ marginBottom: 8 }}>
            <Tag color={candidateMeta.color} style={{ marginInlineEnd: 0 }}>
              {candidateMeta.label}
            </Tag>
            <Tag color={procurementSourcePlatformColor(candidate.candidatePlatform)} style={{ marginInlineEnd: 0 }}>
              {procurementPlatformLabel(candidate.candidatePlatform)}
            </Tag>
            <Tag color="default" style={{ marginInlineEnd: 0 }}>
              排名 {candidate.rankNo || '-'}
            </Tag>
            <Tag color={candidateFieldMeta.color} style={{ marginInlineEnd: 0 }}>
              字段 {candidateFieldMeta.label}
            </Tag>
            {candidate.extractionEvidences?.length ? (
              <Tag color="processing" style={{ marginInlineEnd: 0 }}>
                抽取 {candidate.extractionEvidences.length} 项
              </Tag>
            ) : null}
            {isComparing ? (
              <Tag color="processing" style={{ marginInlineEnd: 0 }}>
                当前对比中
              </Tag>
            ) : null}
            {pendingQuestionCount ? (
              <Tag color="warning" style={{ marginInlineEnd: 0 }}>
                待确认 {pendingQuestionCount} 项
              </Tag>
            ) : null}
            {candidate.selected ? (
              <Tag color="success" style={{ marginInlineEnd: 0 }}>
                当前意向采购
              </Tag>
            ) : null}
            {procurementNextActionMeta(candidate.nextAction) ? (
              <Tag color={procurementNextActionMeta(candidate.nextAction)?.color} style={{ marginInlineEnd: 0 }}>
                {procurementNextActionMeta(candidate.nextAction)?.label}
              </Tag>
            ) : null}
            {candidateAutoInquiryState && candidateAutoInquiryState.status !== 'idle' ? (
              <Tag color={candidateAutoInquiryMeta.tagColor} style={{ marginInlineEnd: 0 }}>
                自动询价 · {candidateAutoInquiryMeta.businessStatus}
              </Tag>
            ) : null}
          </Space>
          <Text strong style={{ display: 'block', color: '#0f172a', marginBottom: 6 }}>
            {procurementCandidateDisplayTitle(candidate)}
          </Text>
          <Text style={{ color: '#475569' }}>
            {candidate.supplierName || '未识别供应商'} · {candidate.locationText || '地区待补'}
          </Text>
        </Col>

        {candidateMainFrame ? (
          <Col>
            {candidateMainFrame.imageMode === 'real' && candidateMainFrame.imageUrl ? (
              <div
                style={{
                  position: 'relative',
                  width: 88,
                  height: 88,
                  overflow: 'hidden',
                  borderRadius: 12,
                  border: '1px solid #dbe4ea',
                  background: '#f8fafc'
                }}
              >
                <Tag
                  color={candidateImageMeta.color}
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    zIndex: 1,
                    marginInlineEnd: 0,
                    transform: 'scale(0.88)',
                    transformOrigin: 'top right'
                  }}
                >
                  {candidateImageMeta.label}
                </Tag>
                <img
                  src={candidateMainFrame.imageUrl}
                  alt={procurementCandidateDisplayTitle(candidate)}
                  style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            ) : (
              <ProcurementGeneratedThumb frame={candidateMainFrame} sectionLabel="候选商品" width={88} height={88} />
            )}
            <Text style={{ display: 'block', marginTop: 6, color: '#64748b', fontSize: 12, textAlign: 'right' }}>
              {candidateImageMeta.note}
            </Text>
          </Col>
        ) : null}

        <Col>
          <div
            style={{
              minWidth: 96,
              padding: '10px 12px',
              borderRadius: 10,
              background: '#f8fafc',
              textAlign: 'center'
            }}
          >
            <div style={{ color: '#64748b', fontSize: 12 }}>综合评分</div>
            <div style={{ color: '#0f172a', fontSize: 28, fontWeight: 700 }}>{candidate.totalScore ?? '-'}</div>
          </div>
        </Col>
      </Row>

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
        {[
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
        ]
          .filter(Boolean)
          .map((item) => (
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
          <Text strong style={{ display: 'block', marginBottom: 6 }}>
            推荐理由
          </Text>
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
          <Text strong style={{ display: 'block', marginBottom: 6 }}>
            风险点
          </Text>
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
        <div
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 10,
            background: '#f8fafc',
            border: '1px solid #e2e8f0'
          }}
        >
          <Text strong style={{ display: 'block', marginBottom: 6 }}>
            已保存的人工判断
          </Text>
          {candidate.manualReviewNote ? (
            <AntdParagraph style={{ margin: 0, color: '#475569' }}>判断备注：{candidate.manualReviewNote}</AntdParagraph>
          ) : null}
          {candidate.inquirySummary ? (
            <AntdParagraph style={{ margin: candidate.manualReviewNote ? '8px 0 0' : 0, color: '#475569' }}>
              询价结论：{candidate.inquirySummary}
            </AntdParagraph>
          ) : null}
        </div>
      ) : null}

      {candidateAutoInquiryState && candidateAutoInquiryState.status !== 'idle' ? (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 10,
            background: '#f8fafc',
            border: '1px solid #e2e8f0'
          }}
        >
          <Space wrap size={[8, 8]} style={{ width: '100%', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text strong style={{ color: '#0f172a' }}>
              询价状态
            </Text>
            <Tag color={candidateAutoInquiryMeta.tagColor} style={{ marginInlineEnd: 0 }}>
              {candidateAutoInquiryMeta.businessStatus}
            </Tag>
          </Space>
          <Text style={{ display: 'block', color: '#475569' }}>{candidateAutoInquiryMeta.summary}</Text>
          {candidateAutoInquiryMeta.sentAt ? (
            <Text style={{ display: 'block', marginTop: 6, color: '#64748b', fontSize: 12 }}>
              最近发送时间：{candidateAutoInquiryMeta.sentAt}
            </Text>
          ) : null}
          {candidateAutoInquiryMeta.failureReason ? (
            <Text style={{ display: 'block', marginTop: 6, color: '#b45309', fontSize: 12 }}>
              失败原因：{candidateAutoInquiryMeta.failureReason}
            </Text>
          ) : null}
        </div>
      ) : null}

      <Space wrap size={[8, 8]} style={{ marginTop: 14 }}>
        {candidate.candidateUrl ? (
          <Button onClick={() => onOpenCandidateUrl(candidate.candidateUrl || '')}>打开候选页</Button>
        ) : null}
        <Button type={isComparing ? 'primary' : 'default'} ghost={isComparing} onClick={() => onCompare(candidate.id)}>
          {isComparing ? '正在对比' : '查看对比'}
        </Button>
        <Button type="primary" disabled={candidate.selected} loading={selecting} onClick={() => void onSelect(candidate.id)}>
          {candidate.selected ? '已是意向采购' : '选为意向采购'}
        </Button>
        <Button
          loading={candidateAutoInquiryState?.status === 'loading'}
          disabled={candidateAutoInquiryAction.disabled}
          onClick={() => void onStartAutoInquiry(candidate)}
        >
          {candidateAutoInquiryAction.label}
        </Button>
      </Space>
    </div>
  );
}
