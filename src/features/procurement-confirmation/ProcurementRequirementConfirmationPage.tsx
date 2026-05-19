import { Button, ConfigProvider, Layout, Result } from 'antd';
import type { AuthSession } from '../auth/session';
import { RequirementDetailPage } from './components/detail/RequirementDetailPage';
import { RequirementListPage } from './components/RequirementListPage';
import { ScenarioState } from './components/ScenarioState';
import { PROCUREMENT_REQUIREMENT_CONFIRMATION_BASE_PATH } from './constants';
import { useProcurementConfirmationPage } from './hooks/useProcurementConfirmationPage';
import { navigateRequirementRoute } from './route';

const { Content } = Layout;

export { PROCUREMENT_REQUIREMENT_CONFIRMATION_BASE_PATH } from './constants';
export { isProcurementRequirementConfirmationPath } from './route';

type ProcurementRequirementConfirmationPageProps = {
  embedded?: boolean;
  session?: AuthSession | null;
};

export function ProcurementRequirementConfirmationPage({
  embedded = false,
  session = null
}: ProcurementRequirementConfirmationPageProps) {
  const {
    actionLoadingKey,
    demandBatches,
    filteredDemandBatches,
    handleAddToPool,
    handleAdvanceFollowUp,
    handleConfirmFinalTwo,
    handleFinishInquiry,
    handleInitializePool,
    handleMarkNoReplyHandoff,
    handleMarkParseFailure,
    handleOpenExternalLink,
    handleRecordReply,
    handleRemoveFromPool,
    handleToggleFinalPick,
    handleViewDetail,
    lastErrorMessage,
    latestFeedback,
    listKeyword,
    loadRequirementDetail,
    loadRequirementList,
    route,
    scenario,
    selectedBatch,
    setListKeyword
  } = useProcurementConfirmationPage({ session });

  const normalContent =
    route.page === 'list'
      ? (
        <RequirementListPage
          demandBatches={demandBatches}
          filteredDemandBatches={filteredDemandBatches}
          listKeyword={listKeyword}
          latestFeedback={latestFeedback}
          onKeywordChange={setListKeyword}
          onViewDetail={handleViewDetail}
          onOpenExternalLink={handleOpenExternalLink}
        />
      )
      : selectedBatch
        ? (
          <RequirementDetailPage
            batch={selectedBatch}
            actionLoadingKey={actionLoadingKey}
            latestFeedback={latestFeedback}
            onInitializePool={handleInitializePool}
            onRemoveFromPool={handleRemoveFromPool}
            onToggleFinalPick={handleToggleFinalPick}
            onAddToPool={handleAddToPool}
            onOpenExternalLink={handleOpenExternalLink}
            onFinishInquiry={handleFinishInquiry}
            onConfirmFinalTwo={handleConfirmFinalTwo}
            onRecordReply={handleRecordReply}
            onAdvanceFollowUp={handleAdvanceFollowUp}
            onMarkNoReplyHandoff={handleMarkNoReplyHandoff}
            onMarkParseFailure={handleMarkParseFailure}
          />
        )
        : (
          <Result
            status="404"
            title="当前采购需求不存在"
            subTitle="请返回列表重新选择。"
            extra={<Button type="primary" onClick={() => navigateRequirementRoute({ page: 'list' })}>回到列表页</Button>}
          />
        );

  const scenarioContent = (
    scenario === 'normal' ? normalContent : (
      <ScenarioState
        scenario={scenario}
        lastErrorMessage={lastErrorMessage}
        route={route}
        onReloadList={() => void loadRequirementList()}
        onReloadDetail={(demandId) => void loadRequirementDetail(demandId)}
      />
    )
  );

  const pageContent = embedded ? scenarioContent : (
    <Layout style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f4faf7 0%, #fff8f0 100%)' }}>
      <Content style={{ padding: '24px' }}>
        {scenarioContent}
      </Content>
    </Layout>
  );

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#0f766e',
          colorBgLayout: '#f3f7f4',
          colorBgContainer: '#ffffff',
          borderRadius: 16,
          fontSize: 14
        }
      }}
    >
      {pageContent}
    </ConfigProvider>
  );
}
