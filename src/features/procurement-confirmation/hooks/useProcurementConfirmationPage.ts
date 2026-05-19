import { useCallback, useMemo } from 'react';
import type { AuthSession } from '../../auth/session';
import { type ProcurementConfirmationCommand } from '../api';
import { resolveOperatorRole, resolveProcurementRole } from '../domain';
import { navigateRequirementRoute } from '../route';
import { roleMeta } from '../statusMeta';
import { useProcurementFeedback } from './useProcurementFeedback';
import { useProcurementRequirementActions } from './useProcurementRequirementActions';
import { useProcurementRequirementData } from './useProcurementRequirementData';

type UseProcurementConfirmationPageOptions = {
  session?: AuthSession | null;
};

export function useProcurementConfirmationPage({
  session = null
}: UseProcurementConfirmationPageOptions) {
  const role = useMemo(() => resolveProcurementRole(session), [session]);
  const roleState = roleMeta[role];
  const ownerUserId = session?.defaultOwnerUserId ?? session?.userId ?? 10002;
  const operatorUserId = session?.userId ?? ownerUserId;
  const operatorRole = resolveOperatorRole(role);
  const buildOperatorCommand = useCallback(
    (): ProcurementConfirmationCommand => ({
      ownerUserId,
      operatorUserId,
      operatorRole
    }),
    [operatorRole, operatorUserId, ownerUserId]
  );

  const {
    appendFeedback,
    feedbackEntries,
    latestFeedback
  } = useProcurementFeedback();

  const requirementData = useProcurementRequirementData({ ownerUserId });

  const actions = useProcurementRequirementActions({
    appendFeedback,
    applyDetailResponse: requirementData.applyDetailResponse,
    buildOperatorCommand,
    demandBatches: requirementData.demandBatches,
    roleState,
    updateDemandBatch: requirementData.updateDemandBatch
  });

  const handleOpenExternalLink = useCallback(
    (url: string, label: string) => {
      if (typeof window !== 'undefined') {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
      appendFeedback('info', '已打开 1688 链接', `${label}：${url}`);
    },
    [appendFeedback]
  );

  const handleViewDetail = useCallback(
    (demandId: string) => {
      navigateRequirementRoute({ page: 'detail', demandId });
      appendFeedback('info', '已进入详情页', '当前正在查看采购确认详情。');
    },
    [appendFeedback]
  );

  return {
    ...actions,
    demandBatches: requirementData.demandBatches,
    feedbackEntries,
    filteredDemandBatches: requirementData.filteredDemandBatches,
    handleOpenExternalLink,
    handleViewDetail,
    lastErrorMessage: requirementData.lastErrorMessage,
    latestFeedback,
    listKeyword: requirementData.listKeyword,
    loadRequirementDetail: requirementData.loadRequirementDetail,
    loadRequirementList: requirementData.loadRequirementList,
    route: requirementData.route,
    scenario: requirementData.scenario,
    selectedBatch: requirementData.selectedBatch,
    setListKeyword: requirementData.setListKeyword
  };
}
