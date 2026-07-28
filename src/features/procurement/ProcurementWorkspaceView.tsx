import { Alert, Button, Card, Col, Empty, Row, Space, Tag, Typography } from 'antd';
import { ProcurementBackfillModal } from './ProcurementBackfillModal';
import { ProcurementCandidateGroupFilterPanel } from './ProcurementCandidateGroupFilterPanel';
import { ProcurementComparisonPanel } from './ProcurementComparisonPanel';
import { ProcurementCandidatePoolOverviewCard } from './ProcurementCandidatePoolOverviewCard';
import { ProcurementCandidateResultCard } from './ProcurementCandidateResultCard';
import { ProcurementDemandListCard } from './ProcurementDemandListCard';
import { ProcurementSelectedDemandSummary } from './ProcurementSelectedDemandSummary';
import { procurementBuildRoadmap } from './constants';
import {
  procurementAutoSelectionLabel,
  procurementItemStatusMeta,
  procurementPlatformLabel,
  procurementSourcePlatformColor
} from './domain';
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
                  <Button onClick={onOpenProfitCalculatorPrefilled}>
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

                <ProcurementComparisonPanel model={model} />

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
