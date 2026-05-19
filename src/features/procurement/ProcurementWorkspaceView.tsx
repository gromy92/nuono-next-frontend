import { Alert, Button, Card, Col, Descriptions, Empty, Row, Space, Tag, Typography } from 'antd';
import { ProcurementAutoCheckPanel } from './ProcurementAutoCheckPanel';
import { ProcurementAutoInquiryResultCard } from './ProcurementAutoInquiryResultCard';
import { ProcurementBackfillModal } from './ProcurementBackfillModal';
import { ProcurementCandidateGroupFilterPanel } from './ProcurementCandidateGroupFilterPanel';
import { ProcurementCandidatePoolOverviewCard } from './ProcurementCandidatePoolOverviewCard';
import { ProcurementCandidateResultCard } from './ProcurementCandidateResultCard';
import { ProcurementCandidateReviewPanel } from './ProcurementCandidateReviewPanel';
import { ProcurementDemandListCard } from './ProcurementDemandListCard';
import { ProcurementInquirySheetPanel } from './ProcurementInquirySheetPanel';
import { ProcurementSelectedDemandSummary } from './ProcurementSelectedDemandSummary';
import { procurementBuildRoadmap } from './constants';
import {
  formatProcurementPriceRange,
  procurementAutoSelectionLabel,
  procurementCandidateDeliveryText,
  procurementCandidateDisplayTitle,
  procurementCandidateGroupTypeMeta,
  procurementCandidateLevelMeta,
  procurementCandidateMaterialText,
  procurementCandidateMoqText,
  procurementCandidatePackageText,
  procurementCandidatePendingQuestions,
  procurementCandidatePowerModeText,
  procurementCandidatePriceText,
  procurementCandidateSizeText,
  procurementDemandDisplayTitle,
  procurementDisplayText,
  procurementItemStatusMeta,
  procurementNextActionMeta,
  procurementPlatformLabel,
  procurementRequirementText,
  procurementSourcePlatformColor,
  procurementStructuredFieldSourceMeta
} from './domain';
import { ProcurementPreviewPanel } from './preview';
import { PROCUREMENT_REQUIREMENT_CONFIRMATION_BASE_PATH } from '../procurement-confirmation/constants';

const { Text } = Typography;

export function ProcurementWorkspaceView({ model }: { model: any }) {
  const { procurementState, procurementSummaryCards, showProcurementAutoInquiryDevValidation, procurementBuildProgress, selectedProcurementItem, selectedProcurementSourcingProgress, session, procurementAutoInquiryStarting, procurementAutoInquiryValidationMeta, procurementAutoInquiryFeedback, procurementAutoInquiryState, procurementAutoInquiryRealSession, procurementAutoInquiryLatestTask, openProcurementAutoInquiryValidationSample, loadProcurementAutoInquiryWorkbench, startProcurementAutoInquiryValidation, activeOwnerId, loadProcurementCandidatePool, openProcurement1688Search, copyProcurement1688Keyword, openProcurementBackfillModal, selectedProcurementItemId, procurementRunningDemandItemId, setSelectedProcurementItemId, runProcurementAutoSelection, comparingProcurementCandidate, selectedProcurementSignalByCandidateId, onOpenProfitCalculatorPrefilled, procurementCompareSummary, selectedProcurementSourceMainFrame, procurementSourcePreviewFrames, procurementSourcePreviewKey, setProcurementSourcePreviewKey, procurementCandidatePreviewFrames, procurementCandidatePreviewKey, setProcurementCandidatePreviewKey, activeProcurementSourceFrame, activeProcurementCandidateFrame, procurementInquirySheet, procurementCandidateGroupFilterKey, setProcurementCandidateGroupFilterKey, copyCurrentProcurementInquiry, currentProcurementAutoInquiryBusinessState, currentProcurementAutoInquiryBusinessMeta, currentProcurementAutoInquiryBusinessAction, nextProcurementAutoInquiryCandidate, startProcurementCandidateAutoInquiry, loadProcurementCandidateAutoInquiry, setProcurementComparingCandidateId, procurementReviewForm, procurementSavingReview, saveProcurementCandidateReview, selectedProcurementCandidateGroups, procurementCandidateFilter, setProcurementCandidateFilter, procurementProfitSignalsState, filteredProcurementCandidates, procurementComparingCandidateId, procurementSelectingCandidateId, procurementAutoInquiryBusinessStates, selectProcurementCandidate, procurementBackfillModalOpen, procurementBackfillSubmitting, procurementBackfillForm, setProcurementBackfillModalOpen, submitProcurementManualBackfill } = model;

  const procurementBoard = (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <ProcurementCandidatePoolOverviewCard
        procurementState={procurementState}
        procurementSummaryCards={procurementSummaryCards}
        showDevValidation={showProcurementAutoInquiryDevValidation}
        buildProgress={procurementBuildProgress}
        buildRoadmap={procurementBuildRoadmap}
        selectedProcurementItem={selectedProcurementItem}
        selectedProcurementSourcingProgress={selectedProcurementSourcingProgress}
        autoInquiryValidationProps={{
          canUseValidation: Boolean(session),
          starting: procurementAutoInquiryStarting,
          validationMeta: procurementAutoInquiryValidationMeta,
          feedback: procurementAutoInquiryFeedback,
          state: procurementAutoInquiryState,
          realSession: procurementAutoInquiryRealSession,
          latestTask: procurementAutoInquiryLatestTask,
          onOpenValidationSample: openProcurementAutoInquiryValidationSample,
          onLoadWorkbench: loadProcurementAutoInquiryWorkbench,
          onStartValidation: startProcurementAutoInquiryValidation
        }}
        refreshDisabled={!session}
        onOpenRequirementConfirmation={() => {
          if (typeof window === 'undefined') {
            return;
          }
          window.history.pushState({}, '', `${PROCUREMENT_REQUIREMENT_CONFIRMATION_BASE_PATH}/list`);
          window.dispatchEvent(new PopStateEvent('popstate'));
        }}
        onRefresh={() => loadProcurementCandidatePool(activeOwnerId ?? session?.defaultOwnerUserId)}
        onOpen1688Search={openProcurement1688Search}
        onCopy1688Keyword={copyProcurement1688Keyword}
        onOpenBackfillModal={openProcurementBackfillModal}
      />

      <Row gutter={[16, 16]} align="top">
        <Col xs={24} xl={8}>
          <ProcurementDemandListCard
            procurementState={procurementState}
            selectedProcurementItemId={selectedProcurementItemId}
            procurementRunningDemandItemId={procurementRunningDemandItemId}
            onSelectDemandItem={setSelectedProcurementItemId}
            onRunAutoSelection={runProcurementAutoSelection}
            onOpen1688Search={openProcurement1688Search}
            onOpenBackfillModal={openProcurementBackfillModal}
          />
        </Col>

        <Col xs={24} xl={16}>
          <Card
            title={
              <Space wrap size={[8, 8]}>
                <Text strong style={{ fontSize: 16, color: '#0f172a' }}>
                  候选池决策台
                </Text>
                {selectedProcurementItem?.sourcePlatform ? (
                  <Tag color={procurementSourcePlatformColor(selectedProcurementItem.sourcePlatform)} style={{ marginInlineEnd: 0 }}>
                    {procurementPlatformLabel(selectedProcurementItem.sourcePlatform)}
                  </Tag>
                ) : null}
                {selectedProcurementItem?.status ? (
                  <Tag color={procurementItemStatusMeta(selectedProcurementItem.status).color} style={{ marginInlineEnd: 0 }}>
                    {procurementItemStatusMeta(selectedProcurementItem.status).label}
                  </Tag>
                ) : null}
              </Space>
            }
            variant="borderless"
            style={{ boxShadow: '0 12px 32px rgba(15, 23, 42, 0.06)' }}
	            extra={
		              selectedProcurementItem ? (
		                <Space wrap size={[8, 8]}>
                    <Button type="primary" onClick={() => openProcurement1688Search(selectedProcurementItem)}>
                      打开 1688 找货页
                    </Button>
                    <Button onClick={() => void copyProcurement1688Keyword(selectedProcurementItem)}>
                      复制搜索词
                    </Button>
                    <Button onClick={() => openProcurementBackfillModal(selectedProcurementItem)}>
                      回填候选池
                    </Button>
		                  <Button
		                    loading={procurementRunningDemandItemId === selectedProcurementItem.id}
		                    onClick={() => void runProcurementAutoSelection(selectedProcurementItem.id)}
	                  >
                    {procurementAutoSelectionLabel(selectedProcurementItem)}
                  </Button>
                  <Button onClick={() => onOpenProfitCalculatorPrefilled(
                      selectedProcurementItem,
                      comparingProcurementCandidate,
                      comparingProcurementCandidate?.id
                        ? selectedProcurementSignalByCandidateId[comparingProcurementCandidate.id]
                        : undefined
                    )}>
                    带入利润计算
                  </Button>
                  {selectedProcurementItem.sourceUrl ? (
                    <Button
                      type="link"
                      style={{ paddingInline: 0 }}
                      onClick={() => window.open(selectedProcurementItem.sourceUrl, '_blank', 'noopener,noreferrer')}
                    >
                      打开原商品页
                    </Button>
                  ) : null}
                </Space>
              ) : null
            }
          >
            {selectedProcurementItem ? (
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <ProcurementSelectedDemandSummary
                  item={selectedProcurementItem}
                  sourceMainFrame={selectedProcurementSourceMainFrame}
                />

                {comparingProcurementCandidate && procurementCompareSummary ? (
                  <div
                    style={{
                      padding: 16,
                      borderRadius: 12,
                      background: '#ffffff',
                      border: '1px solid #e2e8f0'
                    }}
	                  >
	                    <Space wrap size={[8, 8]} style={{ width: '100%', justifyContent: 'space-between', marginBottom: 12 }}>
	                      <Space wrap size={[8, 8]}>
	                        <Text strong style={{ fontSize: 15 }}>
	                          原商品与候选商品对比
                        </Text>
                        <Tag color={procurementCompareSummary.overallColor} style={{ marginInlineEnd: 0 }}>
                          {procurementCompareSummary.overallLabel}
                        </Tag>
                        {procurementNextActionMeta(comparingProcurementCandidate.nextAction) ? (
                          <Tag color={procurementNextActionMeta(comparingProcurementCandidate.nextAction)?.color} style={{ marginInlineEnd: 0 }}>
	                            {procurementNextActionMeta(comparingProcurementCandidate.nextAction)?.label}
	                          </Tag>
	                        ) : null}
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
                          extraTag={
                            comparingProcurementCandidate.selected ? (
                              <Tag color="success" style={{ marginInlineEnd: 0 }}>
                                当前意向采购
                              </Tag>
                            ) : undefined
                          }
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
	                            <Text strong style={{ color: '#0f172a' }}>
	                              当前比对焦点
	                            </Text>
	                            <Tag color="default" style={{ marginInlineEnd: 0 }}>
	                              原商品：{activeProcurementSourceFrame.label}
	                            </Tag>
	                            <Tag color="processing" style={{ marginInlineEnd: 0 }}>
	                              候选商品：{activeProcurementCandidateFrame.label}
	                            </Tag>
	                          </Space>

	                          <Text style={{ color: '#475569' }}>
	                            先看这一组图片和要点是否接近，再决定要不要继续询价或直接保留在候选池。
	                          </Text>

	                          <Row gutter={[12, 12]}>
	                            <Col xs={24} xl={10}>
	                              <div
	                                style={{
	                                  padding: 12,
	                                  borderRadius: 10,
	                                  background: '#ffffff',
	                                  border: '1px solid #e2e8f0'
	                                }}
	                              >
	                                <Text strong style={{ display: 'block', color: '#0f172a', marginBottom: 8 }}>
	                                  原商品判断重点
	                                </Text>
	                                <Space wrap size={[8, 8]}>
                                  {activeProcurementSourceFrame.highlights.slice(0, 3).map((item: any) => (
	                                    <Tag key={`source-focus-${item}`} color="default" style={{ marginInlineEnd: 0 }}>
	                                      {item}
	                                    </Tag>
	                                  ))}
	                                </Space>
	                              </div>
	                            </Col>
	                            <Col xs={24} xl={10}>
	                              <div
	                                style={{
	                                  padding: 12,
	                                  borderRadius: 10,
	                                  background: '#ffffff',
	                                  border: '1px solid #e2e8f0'
	                                }}
	                              >
	                                <Text strong style={{ display: 'block', color: '#0f172a', marginBottom: 8 }}>
	                                  候选商品判断重点
	                                </Text>
	                                <Space wrap size={[8, 8]}>
                                  {activeProcurementCandidateFrame.highlights.slice(0, 3).map((item: any) => (
	                                    <Tag key={`candidate-focus-${item}`} color="processing" style={{ marginInlineEnd: 0 }}>
	                                      {item}
	                                    </Tag>
	                                  ))}
	                                </Space>
	                              </div>
	                            </Col>
	                            <Col xs={24} xl={4}>
	                              <div
	                                style={{
	                                  padding: 12,
	                                  borderRadius: 10,
	                                  background: '#ffffff',
	                                  border: '1px solid #e2e8f0',
	                                  height: '100%'
	                                }}
	                              >
	                                <Text strong style={{ display: 'block', color: '#0f172a', marginBottom: 8 }}>
	                                  当前结论
	                                </Text>
	                                <Tag color={procurementCompareSummary.overallColor} style={{ marginInlineEnd: 0, marginBottom: 8 }}>
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

	                    <Row gutter={[16, 16]}>
	                      <Col xs={24} xl={12}>
	                        {(() => {
	                          const sourceFieldMeta = procurementStructuredFieldSourceMeta(selectedProcurementItem.structuredFieldSource);
                          return (
                        <div
                          style={{
                            padding: 14,
                            borderRadius: 10,
                            border: '1px solid #dbe4ea',
                            background: '#f8fafc',
                            height: '100%'
                          }}
                        >
                          <Space wrap size={[8, 8]} style={{ marginBottom: 8 }}>
                            <Tag color={procurementSourcePlatformColor(selectedProcurementItem.sourcePlatform)} style={{ marginInlineEnd: 0 }}>
                              {procurementPlatformLabel(selectedProcurementItem.sourcePlatform)}
                            </Tag>
                            <Tag color="default" style={{ marginInlineEnd: 0 }}>
                              原商品
                            </Tag>
                            <Tag color={sourceFieldMeta.color} style={{ marginInlineEnd: 0 }}>
                              字段 {sourceFieldMeta.label}
                            </Tag>
                          </Space>
                          <Text strong style={{ display: 'block', color: '#0f172a', marginBottom: 8 }}>
                            {procurementDemandDisplayTitle(selectedProcurementItem)}
                          </Text>
                          <Descriptions
                            size="small"
                            column={1}
                            colon={false}
                            items={[
                              {
                                key: 'sourcePrice',
                                label: '目标价格',
                                children: formatProcurementPriceRange(
                                  selectedProcurementItem.targetPriceMin,
                                  selectedProcurementItem.targetPriceMax
                                )
                              },
                              {
                                key: 'sourceQty',
                                label: '目标采购量',
                                children: `${selectedProcurementItem.targetQuantity || '-'} 件`
                              },
                              {
                                key: 'sourceSite',
                                label: '目标站点',
                                children: selectedProcurementItem.targetSite || '-'
                              },
                              {
                                key: 'sourceRequirement',
                                label: '采购要求',
                                children: procurementRequirementText(selectedProcurementItem.specialRequirement)
                              },
                              {
                                key: 'sourceMaterial',
                                label: '目标材质',
                                children: procurementDisplayText(selectedProcurementItem.targetMaterial)
                              },
                              {
                                key: 'sourcePowerMode',
                                label: '供电方式',
                                children: procurementDisplayText(selectedProcurementItem.targetPowerMode)
                              },
                              {
                                key: 'sourceSizeText',
                                label: '尺寸重点',
                                children: procurementDisplayText(selectedProcurementItem.targetSizeText)
                              },
                              {
                                key: 'sourcePackageType',
                                label: '包装要求',
                                children: procurementDisplayText(selectedProcurementItem.targetPackageType)
                              },
                              {
                                key: 'deliveryExpectation',
	                                label: '交期要求',
	                                children: procurementDisplayText(selectedProcurementItem.deliveryExpectation)
	                              }
	                            ]}
	                          />
	                        </div>
	                          );
	                        })()}
	                      </Col>

                      <Col xs={24} xl={12}>
                        {(() => {
                          const candidateFieldMeta = procurementStructuredFieldSourceMeta(comparingProcurementCandidate.structuredFieldSource);
                          return (
                        <div
                          style={{
                            padding: 14,
                            borderRadius: 10,
                            border: '1px solid #dbe4ea',
                            background: '#f8fafc',
                            height: '100%'
                          }}
                        >
                          <Space wrap size={[8, 8]} style={{ marginBottom: 8 }}>
                            <Tag color={procurementSourcePlatformColor(comparingProcurementCandidate.candidatePlatform)} style={{ marginInlineEnd: 0 }}>
                              {procurementPlatformLabel(comparingProcurementCandidate.candidatePlatform)}
                            </Tag>
                            <Tag color={procurementCandidateLevelMeta(comparingProcurementCandidate.level).color} style={{ marginInlineEnd: 0 }}>
                              {procurementCandidateLevelMeta(comparingProcurementCandidate.level).label}
                            </Tag>
                            <Tag color={candidateFieldMeta.color} style={{ marginInlineEnd: 0 }}>
                              字段 {candidateFieldMeta.label}
                            </Tag>
	                            {comparingProcurementCandidate.selected ? (
	                              <Tag color="success" style={{ marginInlineEnd: 0 }}>
	                                当前意向采购
	                              </Tag>
	                            ) : null}
                            {comparingProcurementCandidate.groupLabel ? (
                              <Tag color={procurementCandidateGroupTypeMeta(comparingProcurementCandidate.groupType).color} style={{ marginInlineEnd: 0 }}>
                                {comparingProcurementCandidate.groupLabel}
                              </Tag>
                            ) : null}
	                          </Space>
                          <Text strong style={{ display: 'block', color: '#0f172a', marginBottom: 8 }}>
                            {procurementCandidateDisplayTitle(comparingProcurementCandidate)}
                          </Text>
                          <Descriptions
                            size="small"
                            column={1}
                            colon={false}
                            items={[
                              {
                                key: 'candidatePrice',
                                label: '标准价格带',
                                children: procurementCandidatePriceText(comparingProcurementCandidate)
                              },
                              {
                                key: 'candidateMoq',
                                label: '标准起订量',
                                children: procurementCandidateMoqText(comparingProcurementCandidate)
                              },
                              {
                                key: 'candidateSupplier',
                                label: '供应商',
                                children: comparingProcurementCandidate.supplierName || '-'
                              },
                              {
                                key: 'candidateLocation',
                                label: '发货地',
                                children: comparingProcurementCandidate.locationText || '-'
                              },
                              {
                                key: 'candidateMaterial',
                                label: '材质',
                                children: procurementCandidateMaterialText(comparingProcurementCandidate)
                              },
                              {
                                key: 'candidatePowerMode',
                                label: '供电方式',
                                children: procurementCandidatePowerModeText(comparingProcurementCandidate)
                              },
                              {
                                key: 'candidateSizeText',
                                label: '尺寸',
                                children: procurementCandidateSizeText(comparingProcurementCandidate)
                              },
                              {
                                key: 'candidatePackageText',
                                label: '包装',
                                children: procurementCandidatePackageText(comparingProcurementCandidate)
                              },
                              {
                                key: 'candidateDelivery',
	                                label: '标准交期',
	                                children: procurementCandidateDeliveryText(comparingProcurementCandidate)
	                              }
	                            ]}
	                          />
	                        </div>
	                          );
	                        })()}
	                      </Col>
                    </Row>

                    <Alert
                      style={{ marginTop: 14 }}
                      type={procurementCompareSummary.overallColor === 'success' ? 'success' : procurementCompareSummary.overallColor === 'processing' ? 'info' : 'warning'}
                      showIcon
                      message={`拟合判断：${procurementCompareSummary.overallLabel}`}
                      description={procurementCompareSummary.overallDescription}
                    />

                    <Row gutter={[12, 12]} style={{ marginTop: 14 }}>
                      <Col xs={24} xl={12}>
                        <div
                          style={{
                            padding: 12,
                            borderRadius: 10,
                            border: '1px solid #d1fae5',
                            background: '#f0fdf4',
                            height: '100%'
                          }}
                        >
                          <Text strong style={{ display: 'block', marginBottom: 8, color: '#166534' }}>
                            当前相似点
                          </Text>
                          <Space wrap size={[8, 8]}>
                            {procurementCompareSummary.positiveSignals.length ? (
                              procurementCompareSummary.positiveSignals.map((item: string) => (
                                <Tag key={`positive-${item}`} color="success" style={{ marginInlineEnd: 0 }}>
                                  {item}
                                </Tag>
                              ))
                            ) : (
                              <Text style={{ color: '#64748b' }}>当前还没有足够明确的相似点结论。</Text>
                            )}
                          </Space>
                        </div>
                      </Col>
                      <Col xs={24} xl={12}>
                        <div
                          style={{
                            padding: 12,
                            borderRadius: 10,
                            border: '1px solid #fde68a',
                            background: '#fffbeb',
                            height: '100%'
                          }}
                        >
                          <Text strong style={{ display: 'block', marginBottom: 8, color: '#92400e' }}>
                            待确认点
                          </Text>
                          <Space wrap size={[8, 8]}>
                            {procurementCompareSummary.pendingSignals.length ? (
                              procurementCompareSummary.pendingSignals.map((item: string) => (
                                <Tag key={`pending-${item}`} color="warning" style={{ marginInlineEnd: 0 }}>
                                  {item}
                                </Tag>
                              ))
                            ) : (
                              <Text style={{ color: '#64748b' }}>当前没有明显待确认点，可以优先推进。</Text>
                            )}
	                          </Space>
	                        </div>
	                      </Col>
	                    </Row>

	                    <Row gutter={[12, 12]} style={{ marginTop: 14 }}>
	                      <Col xs={24} xl={10}>
	                        <div
	                          style={{
	                            padding: 12,
	                            borderRadius: 10,
	                            border: '1px solid #dbe4ea',
	                            background: '#ffffff',
	                            height: '100%'
	                          }}
	                        >
	                          <Text strong style={{ display: 'block', marginBottom: 8, color: '#0f172a' }}>
	                            候选标准化口径
	                          </Text>
	                          <Space wrap size={[8, 8]}>
	                            {[
	                              `价格 ${procurementCandidatePriceText(comparingProcurementCandidate)}`,
	                              `起订量 ${procurementCandidateMoqText(comparingProcurementCandidate)}`,
	                              `材质 ${procurementCandidateMaterialText(comparingProcurementCandidate)}`,
	                              `供电 ${procurementCandidatePowerModeText(comparingProcurementCandidate)}`,
	                              `尺寸 ${procurementCandidateSizeText(comparingProcurementCandidate)}`,
	                              `包装 ${procurementCandidatePackageText(comparingProcurementCandidate)}`,
	                              `交期 ${procurementCandidateDeliveryText(comparingProcurementCandidate)}`
	                            ].map((item) => (
	                              <Tag key={item} color="default" style={{ marginInlineEnd: 0 }}>
	                                {item}
	                              </Tag>
	                            ))}
	                          </Space>
	                        </div>
	                      </Col>
	                      <Col xs={24} xl={14}>
	                        <div
	                          style={{
	                            padding: 12,
	                            borderRadius: 10,
	                            border: '1px solid #fed7aa',
	                            background: '#fff7ed',
	                            height: '100%'
	                          }}
	                        >
	                          <Text strong style={{ display: 'block', marginBottom: 8, color: '#9a3412' }}>
	                            采购待确认问题清单
	                          </Text>
	                          <Space direction="vertical" size={8} style={{ width: '100%' }}>
	                            {procurementCandidatePendingQuestions(comparingProcurementCandidate).map((item, index) => (
	                              <div
	                                key={`question-${index}-${item}`}
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
	                                <Tag color="warning" style={{ marginInlineEnd: 0 }}>
	                                  {index + 1}
	                                </Tag>
	                                <Text style={{ color: '#7c2d12' }}>{item}</Text>
	                              </div>
	                            ))}
	                          </Space>
	                        </div>
		                      </Col>
		                    </Row>

                    {procurementInquirySheet ? (
                      <ProcurementInquirySheetPanel
                        sheet={procurementInquirySheet}
                        activeGroupFilterKey={procurementCandidateGroupFilterKey}
                        onGroupFilterChange={setProcurementCandidateGroupFilterKey}
                        onCopyInquiry={copyCurrentProcurementInquiry}
                      />
                    ) : null}

                    <ProcurementAutoInquiryResultCard
                      starting={currentProcurementAutoInquiryBusinessState?.status === 'loading'}
                      businessMeta={currentProcurementAutoInquiryBusinessMeta}
                      businessAction={currentProcurementAutoInquiryBusinessAction}
                      nextCandidate={nextProcurementAutoInquiryCandidate}
                      onStart={() => startProcurementCandidateAutoInquiry(selectedProcurementItem, comparingProcurementCandidate)}
                      onRefresh={() => loadProcurementCandidateAutoInquiry(selectedProcurementItem, comparingProcurementCandidate)}
                      onSwitchCandidate={setProcurementComparingCandidateId}
                    />

                    <ProcurementAutoCheckPanel
                      structuredChecks={procurementCompareSummary.structuredChecks}
                      candidate={comparingProcurementCandidate}
                    />

                    <ProcurementCandidateReviewPanel
                      form={procurementReviewForm}
                      candidate={comparingProcurementCandidate}
                      scoreCards={procurementCompareSummary.scoreCards}
                      rows={procurementCompareSummary.rows}
                      saving={procurementSavingReview}
                      onSave={saveProcurementCandidateReview}
                    />
                  </div>
                ) : null}

                  <ProcurementCandidateGroupFilterPanel
                    groups={selectedProcurementCandidateGroups}
                    activeKey={procurementCandidateGroupFilterKey}
                    onChange={setProcurementCandidateGroupFilterKey}
                  />

	                <Space wrap size={[8, 8]}>
	                  {[
	                    { key: 'recommended', label: '高推荐' },
	                    { key: 'review', label: '待复核' },
                    { key: 'reject', label: '淘汰' },
                    { key: 'all', label: '全部' }
                  ].map((option) => (
                    <Button
                      key={option.key}
                      type={procurementCandidateFilter === option.key ? 'primary' : 'default'}
                      onClick={() =>
                        setProcurementCandidateFilter(option.key as 'recommended' | 'review' | 'reject' | 'all')
                      }
                    >
                      {option.label}
                    </Button>
                  ))}
                </Space>

	                {procurementProfitSignalsState.status === 'error' &&
                procurementProfitSignalsState.demandItemId === selectedProcurementItem?.id ? (
                    <Alert
                      type="warning"
                      showIcon
                      message="快速利润信号暂时不可用"
                      description={procurementProfitSignalsState.message}
                    />
                  ) : null}

	                {filteredProcurementCandidates.length ? (
	                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    {filteredProcurementCandidates.map((candidate: any) => (
                      <ProcurementCandidateResultCard
                        key={candidate.id}
                        candidate={candidate}
                        demandItemId={selectedProcurementItem.id}
                        comparingCandidateId={procurementComparingCandidateId}
                        selecting={procurementSelectingCandidateId === candidate.id}
                        profitSignal={selectedProcurementSignalByCandidateId[candidate.id]}
                        profitLoading={
                          procurementProfitSignalsState.status === 'loading' &&
                          procurementProfitSignalsState.demandItemId === selectedProcurementItem.id
                        }
                        autoInquiryBusinessStates={procurementAutoInquiryBusinessStates}
                        onCompare={setProcurementComparingCandidateId}
                        onSelect={(candidateId) => selectProcurementCandidate(selectedProcurementItem.id, candidateId)}
                        onStartAutoInquiry={(candidateItem) => startProcurementCandidateAutoInquiry(selectedProcurementItem, candidateItem)}
                        onOpenCandidateUrl={(url) => window.open(url, '_blank', 'noopener,noreferrer')}
                      />
                    ))}
                  </Space>
                ) : selectedProcurementItem.candidates.length ? (
                  <Empty description="当前筛选条件下没有候选结果" />
                ) : selectedProcurementItem.task?.status === 'RUNNING' ? (
                  <Alert
                    type="info"
                    showIcon
                    message="候选结果还在生成中"
                    description="当前这条需求还在跑图搜和筛选，等异步任务完成后，候选池会自动补齐。"
                  />
                ) : (
                  <Empty description="当前还没有候选结果" />
                )}
              </Space>
            ) : (
              <Empty description="左侧选择一条采购需求后，这里会展示异步结果和候选池" />
            )}
          </Card>
        </Col>
      </Row>
    </Space>
  );


  return (
    <>
      {procurementBoard}
      <ProcurementBackfillModal
        open={procurementBackfillModalOpen}
        submitting={procurementBackfillSubmitting}
        selectedProcurementItem={selectedProcurementItem}
        form={procurementBackfillForm}
        onCancel={() => {
          setProcurementBackfillModalOpen(false);
          procurementBackfillForm.resetFields();
        }}
        onSubmit={submitProcurementManualBackfill}
      />
    </>
  );
}
