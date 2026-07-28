export type ProcurementAutoInquiryWorkbenchPayload = {
  mode: string;
  ready: boolean;
  message?: string;
  demandItem?: {
    id: number;
    lineNo?: number;
    sourcePlatform?: string;
    sourceTitle?: string;
    sourceUrl?: string;
    targetSite?: string;
    status?: string;
  };
  candidate?: {
    id: number;
    demandItemId: number;
    candidatePlatform?: string;
    title?: string;
    supplierName?: string;
    candidateUrl?: string;
    level?: string;
    nextAction?: string;
    mainImageUrl?: string;
    inquiryOpeningLine?: string;
    inquirySummaryLine?: string;
    inquiryQuestions: string[];
  };
  latestTask?: {
    id: number;
    ownerUserId: number;
    demandItemId: number;
    candidateId: number;
    sessionId?: number;
    status?: string;
    statusLabel?: string;
    executionStage?: string;
    executionStageLabel?: string;
    targetSupplierIdentity?: string;
    inputPreviewText?: string;
    inputLocator?: string;
    sendChannel?: string;
    sendEvidence?: string;
    threadCheckpoint?: string;
    lastMessageDigest?: string;
    failureCode?: string;
    failureMessage?: string;
    handoffReason?: string;
    message?: string;
    sentAt?: string;
    confirmedAt?: string;
    events: Array<{
      id: number;
      eventType?: string;
      executionStage?: string;
      eventMessage?: string;
      createdAt?: string;
    }>;
  } | null;
  taskHistory: Array<{
    id: number;
    status?: string;
    executionStage?: string;
  }>;
  sessionPool: Array<{
    id: number;
    accountLabel?: string;
    status?: string;
    statusLabel?: string;
    riskCode?: string;
    browserEndpoint?: string;
    note?: string;
    leasedTaskId?: number | null;
  }>;
};

export type ProcurementAutoInquiryWorkbenchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: ProcurementAutoInquiryWorkbenchPayload }
  | { status: 'error'; message: string };

export type ProcurementAutoInquiryBusinessStateMap = Record<string, ProcurementAutoInquiryWorkbenchState>;
