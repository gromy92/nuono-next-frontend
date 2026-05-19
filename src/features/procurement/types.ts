export type ProcurementCandidatePoolPayload = {
  mode: string;
  ready: boolean;
  message?: string;
  missingCoreTables: string[];
  selectedDemandItemId?: number;
  order?: {
    id: number;
    ownerUserId: number;
    orderNo: string;
    title?: string;
    status?: string;
    targetMarket?: string;
    priority?: string;
    sourceType?: string;
    itemCount?: number;
    selectedCandidateCount?: number;
    createdAt?: string;
    updatedAt?: string;
  };
  summary?: {
    totalItems: number;
    runningTasks: number;
    successTasks: number;
    failedTasks: number;
    recommendedCandidates: number;
    reviewCandidates: number;
    selectedCandidates: number;
  };
  demandItems: Array<{
    id: number;
    lineNo?: number;
    sourcePlatform?: string;
    sourceUrl?: string;
    sourceTitle?: string;
    sourceImageUrl?: string;
    sourceDetailImageUrl?: string;
    sourcePackageImageUrl?: string;
    targetPriceMin?: number;
    targetPriceMax?: number;
    targetQuantity?: number;
    targetSite?: string;
    specialRequirement?: string;
    targetMaterial?: string;
    targetPowerMode?: string;
    targetSizeText?: string;
    targetPackageType?: string;
    deliveryExpectation?: string;
    structuredFieldSource?: string;
    status?: string;
    selectedCandidateId?: number;
    createdAt?: string;
    updatedAt?: string;
    task?: {
      id: number;
      demandItemId: number;
      status?: string;
      progressPercent?: number;
      searchMode?: string;
      selectedImageCount?: number;
      searchPath?: string;
      resultCount?: number;
      recommendedCount?: number;
      message?: string;
      startedAt?: string;
      finishedAt?: string;
    };
    candidateGroups: Array<{
      groupKey: string;
      groupLabel?: string;
      groupType?: string;
      summary?: string;
      representativeTitle?: string;
      representativeSupplierName?: string;
      mainImageUrl?: string;
      candidateCount?: number;
      supplierCount?: number;
      bestScore?: number;
      bestCandidateId?: number;
      candidateIds: number[];
      tags: string[];
    }>;
    candidates: Array<{
      id: number;
      demandItemId: number;
      taskId?: number;
      rankNo?: number;
      level?: string;
      totalScore?: number;
      fitScore?: number;
      specScore?: number;
      priceScore?: number;
      supplierScore?: number;
      logisticsScore?: number;
      candidatePlatform?: string;
      candidateUrl?: string;
      title?: string;
      supplierName?: string;
      priceText?: string;
      moqText?: string;
      standardizedPriceText?: string;
      standardizedMoqText?: string;
      locationText?: string;
      materialText?: string;
      standardizedMaterialText?: string;
      powerModeText?: string;
      standardizedPowerModeText?: string;
      sizeText?: string;
      standardizedSizeText?: string;
      packageText?: string;
      standardizedPackageText?: string;
      deliveryTimelineText?: string;
      standardizedDeliveryText?: string;
      resultCardText?: string;
      detailHighlightText?: string;
      attributeSnapshotText?: string;
      shippingSnapshotText?: string;
      packageSnapshotText?: string;
      groupKey?: string;
      groupLabel?: string;
      groupType?: string;
      groupRank?: number;
      structuredFieldSource?: string;
      extractionEvidences?: Array<{
        fieldKey?: string;
        fieldLabel?: string;
        fieldValue?: string;
        sourceType?: string;
        sourceLabel?: string;
        evidenceText?: string;
      }>;
      mainImageUrl?: string;
      detailImageUrl?: string;
      deliveryImageUrl?: string;
      manualReviewNote?: string;
      inquirySummary?: string;
      nextAction?: string;
      badges: string[];
      reasons: string[];
      warnings: string[];
      pendingQuestions?: string[];
      inquiryOpeningLine?: string;
      inquirySummaryLine?: string;
      inquiryQuestions?: string[];
      quoteChecklist?: string[];
      sampleChecklist?: string[];
      selected?: boolean;
      decisionStatus?: string;
      createdAt?: string;
      updatedAt?: string;
    }>;
  }>;
};

export type ProcurementDemandItem = ProcurementCandidatePoolPayload['demandItems'][number];
export type ProcurementCandidate = ProcurementDemandItem['candidates'][number];
export type ProcurementCandidateGroup = ProcurementDemandItem['candidateGroups'][number];

export type ProcurementState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: ProcurementCandidatePoolPayload }
  | { status: 'error'; message: string };

export type ProcurementPreviewFrame = {
  key: string;
  label: string;
  title: string;
  subtitle?: string;
  note?: string;
  imageUrl?: string;
  imageMode?: 'real' | 'generated';
  highlights: string[];
};

export type ProcurementCheckResult = {
  label: string;
  sourceValue: string;
  candidateValue: string;
  status: 'match' | 'warning' | 'mismatch' | 'pending';
  judgement: string;
  positiveSignal?: string;
  pendingSignal?: string;
};

export type ProcurementBackfillCandidateInput = {
  candidateUrl: string;
  title: string;
  supplierName?: string;
  priceText?: string;
  moqText?: string;
  locationText?: string;
  resultCardText?: string;
  detailHighlightText?: string;
  attributeSnapshotText?: string;
  shippingSnapshotText?: string;
  packageSnapshotText?: string;
  mainImageUrl?: string;
};

export type ProcurementBackfillFormValues = {
  candidates: ProcurementBackfillCandidateInput[];
};

export type ProcurementSourcingProgress = {
  searchOpenedAt?: string;
  keywordCopiedAt?: string;
  backfillOpenedAt?: string;
  lastBackfillAt?: string;
  backfilledCount?: number;
};

export type ProcurementSearchPagePreviewPayload = {
  ready: boolean;
  message?: string;
  pageTitle?: string;
  detectedOfferCount?: number;
  extractedCount?: number;
  warnings: string[];
  candidates: Array<{
    candidateUrl?: string;
    title?: string;
    supplierName?: string;
    priceText?: string;
    moqText?: string;
    locationText?: string;
    materialText?: string;
    powerModeText?: string;
    sizeText?: string;
    packageText?: string;
    deliveryTimelineText?: string;
    structuredFieldSource?: string;
    mainImageUrl?: string;
    resultCardText?: string;
    detailHighlightText?: string;
    attributeSnapshotText?: string;
    shippingSnapshotText?: string;
    packageSnapshotText?: string;
    extractionEvidences?: Array<{
      fieldKey?: string;
      fieldLabel?: string;
      fieldValue?: string;
      sourceType?: string;
      sourceLabel?: string;
      evidenceText?: string;
    }>;
  }>;
};

export type ProcurementSearchPagePreviewState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: ProcurementSearchPagePreviewPayload }
  | { status: 'error'; message: string };

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
