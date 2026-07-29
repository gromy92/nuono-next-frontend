import type {
  ProcurementConfirmationCommand,
  RequirementConfirmationDetailResponse,
  RequirementConfirmationListResponse
} from './dto';
import { apiRequestJson } from '../../shared/api';

function searchParamsFrom(params: Record<string, string | number | undefined | null>) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

async function sendJson<TResponse>(url: string, body: unknown): Promise<TResponse> {
  return apiRequestJson<TResponse>(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body || {})
  });
}

export async function fetchProcurementConfirmationList(params: {
  ownerUserId?: number;
  keyword?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  return apiRequestJson<RequirementConfirmationListResponse>(
    `/api/procurement/requirement-confirmation/demands${searchParamsFrom(params)}`
  );
}

export async function fetchProcurementConfirmationDetail(demandItemId: string, ownerUserId?: number) {
  return apiRequestJson<RequirementConfirmationDetailResponse>(
    `/api/procurement/requirement-confirmation/demands/${encodeURIComponent(demandItemId)}${searchParamsFrom({
      ownerUserId
    })}`
  );
}

export function initializeProcurementPool(demandItemId: string, command: ProcurementConfirmationCommand & { triggerInquiry?: boolean }) {
  return sendJson<RequirementConfirmationDetailResponse>(
    `/api/procurement/requirement-confirmation/demands/${encodeURIComponent(demandItemId)}/pool/initialize`,
    command
  );
}

export function removeProcurementPoolItem(
  demandItemId: string,
  poolItemId: string,
  command: ProcurementConfirmationCommand & { reason?: string }
) {
  return sendJson<RequirementConfirmationDetailResponse>(
    `/api/procurement/requirement-confirmation/demands/${encodeURIComponent(demandItemId)}/pool/items/${encodeURIComponent(poolItemId)}/remove`,
    command
  );
}

export function addProcurementCandidateToPool(
  demandItemId: string,
  candidateId: string,
  command: ProcurementConfirmationCommand & { reason?: string; triggerInquiry?: boolean }
) {
  return sendJson<RequirementConfirmationDetailResponse>(
    `/api/procurement/requirement-confirmation/demands/${encodeURIComponent(demandItemId)}/pool/candidates/${encodeURIComponent(candidateId)}/add`,
    command
  );
}

export function finishProcurementInquiry(
  demandItemId: string,
  command: ProcurementConfirmationCommand & { finishMode?: string; note?: string; force?: boolean }
) {
  return sendJson<RequirementConfirmationDetailResponse>(
    `/api/procurement/requirement-confirmation/demands/${encodeURIComponent(demandItemId)}/pool/inquiry/finish`,
    command
  );
}

export function recordProcurementPoolItemReply(
  demandItemId: string,
  poolItemId: string,
  command: ProcurementConfirmationCommand & {
    quotePriceText?: string;
    quoteMoqText?: string;
    quoteDeliveryText?: string;
    replySummary?: string;
    riskNote?: string;
  }
) {
  return sendJson<RequirementConfirmationDetailResponse>(
    `/api/procurement/requirement-confirmation/demands/${encodeURIComponent(demandItemId)}/pool/items/${encodeURIComponent(poolItemId)}/reply`,
    command
  );
}

export function advanceProcurementPoolItemFollowUp(
  demandItemId: string,
  poolItemId: string,
  command: ProcurementConfirmationCommand & { note?: string }
) {
  return sendJson<RequirementConfirmationDetailResponse>(
    `/api/procurement/requirement-confirmation/demands/${encodeURIComponent(demandItemId)}/pool/items/${encodeURIComponent(poolItemId)}/follow-up/advance`,
    command
  );
}

export function markProcurementPoolItemNoReplyHandoff(
  demandItemId: string,
  poolItemId: string,
  command: ProcurementConfirmationCommand & { reason?: string; replySummary?: string; riskNote?: string }
) {
  return sendJson<RequirementConfirmationDetailResponse>(
    `/api/procurement/requirement-confirmation/demands/${encodeURIComponent(demandItemId)}/pool/items/${encodeURIComponent(poolItemId)}/no-reply-handoff`,
    command
  );
}

export function markProcurementPoolItemReplyParseFailed(
  demandItemId: string,
  poolItemId: string,
  command: ProcurementConfirmationCommand & { reason?: string; replySummary?: string; riskNote?: string }
) {
  return sendJson<RequirementConfirmationDetailResponse>(
    `/api/procurement/requirement-confirmation/demands/${encodeURIComponent(demandItemId)}/pool/items/${encodeURIComponent(poolItemId)}/reply-parse-failed`,
    command
  );
}

export function confirmProcurementFinalCandidates(
  demandItemId: string,
  command: ProcurementConfirmationCommand & {
    primaryPoolItemId: string;
    backupPoolItemId: string;
    decisionNote?: string;
  }
) {
  return sendJson<RequirementConfirmationDetailResponse>(
    `/api/procurement/requirement-confirmation/demands/${encodeURIComponent(demandItemId)}/final-candidates/confirm`,
    command
  );
}

export function generateProcurementSummary(
  demandItemId: string,
  command: ProcurementConfirmationCommand & { regenerate?: boolean }
) {
  return sendJson<RequirementConfirmationDetailResponse>(
    `/api/procurement/requirement-confirmation/demands/${encodeURIComponent(demandItemId)}/summary/generate`,
    command
  );
}
