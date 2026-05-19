export type CandidateSummaryDto = {
  candidateId?: number;
  rankNo?: number;
  totalScore?: number;
  fitScore?: number;
  specScore?: number;
  priceScore?: number;
  supplierScore?: number;
  logisticsScore?: number;
  offerId?: string;
  title?: string;
  supplierName?: string;
  candidateUrl?: string;
  mainImageUrl?: string | null;
  detailImageUrl?: string | null;
  deliveryImageUrl?: string | null;
  priceText?: string;
  moqText?: string;
  locationText?: string;
  materialText?: string;
  powerModeText?: string;
  sizeText?: string;
  packageText?: string;
  deliveryTimelineText?: string;
  resultCardText?: string;
  detailHighlightText?: string;
  attributeSnapshotText?: string;
  shippingSnapshotText?: string;
  packageSnapshotText?: string;
  badgesText?: string;
  reasonsText?: string;
  warningsText?: string;
};

export type DemandListItemDto = {
  demandItemId: number;
  orderId?: number;
  ownerUserId?: number;
  orderNo?: string;
  orderTitle?: string;
  demandTitle?: string;
  demandStatus?: string;
  sourcePlatform?: string;
  sourceUrl?: string;
  sourceTitle?: string;
  sourceImageUrl?: string | null;
  sourceDetailImageUrl?: string | null;
  sourcePackageImageUrl?: string | null;
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
  assignedBuyerName?: string;
  poolId?: number | null;
  poolNo?: string | null;
  poolStatus?: string | null;
  poolCount?: number;
  maxPoolSize?: number;
  finalCandidateCount?: number;
  candidateCount?: number;
  candidateCollectionTask?: CandidateCollectionTaskDto | null;
  previewCandidate?: CandidateSummaryDto | null;
  updatedAt?: string;
};

export type CandidateCollectionTaskDto = {
  id?: number;
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

export type DemandDetailDto = {
  demandItemId: number;
  orderId?: number;
  ownerUserId?: number;
  orderNo?: string;
  orderTitle?: string;
  lineNo?: number;
  sourcePlatform?: string;
  sourceUrl?: string;
  sourceTitle?: string;
  sourceImageUrl?: string | null;
  sourceDetailImageUrl?: string | null;
  sourcePackageImageUrl?: string | null;
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
  status?: string;
  assignedBuyerName?: string;
  currentPoolId?: number | null;
  createdAt?: string;
  updatedAt?: string;
};

export type PoolItemDto = CandidateSummaryDto & {
  poolItemId: number;
  candidateId: number;
  sourceRankNo?: number;
  poolRankNo?: number;
  status?: string;
  joinSource?: string;
  inquiryTaskId?: number;
  joinedAt?: string;
  firstSentAt?: string | null;
  noReplyDeadlineAt?: string | null;
  lastFollowUpAt?: string | null;
  lastReplyAt?: string | null;
  closedAt?: string | null;
  removedAt?: string | null;
  removedBy?: number | null;
  removeReason?: string | null;
  quotePriceText?: string | null;
  quoteMoqText?: string | null;
  quoteDeliveryText?: string | null;
  replySummary?: string | null;
  riskNote?: string | null;
  inquiryTaskStatus?: string | null;
  inquiryExecutionStage?: string | null;
  plannedChannel?: string | null;
  activeChannel?: string | null;
  channelFallbackReason?: string | null;
  externalInquiryId?: string | null;
  externalInquiryUrl?: string | null;
  externalResultStatus?: string | null;
  replySource?: string | null;
  replyParseStatus?: string | null;
  replyParseError?: string | null;
  candidate?: CandidateSummaryDto;
};

export type PoolDto = {
  poolId?: number | null;
  poolNo?: string | null;
  status?: string;
  poolCount?: number;
  maxPoolSize?: number;
  candidateSourceLimit?: number;
  autoCreatedAt?: string | null;
  inquiryStartedAt?: string | null;
  inquiryFinishedAt?: string | null;
  finalConfirmedAt?: string | null;
  summaryReadyAt?: string | null;
  summaryText?: string | null;
  summaryInputSnapshotId?: number | null;
  items?: PoolItemDto[];
};

export type FinalCandidateDto = CandidateSummaryDto & {
  id?: number;
  poolItemId: number;
  candidateId: number;
  finalPickType: 'PRIMARY' | 'BACKUP';
  snapshotId?: number;
  decisionNote?: string | null;
  confirmedBy?: number;
  confirmedAt?: string;
  candidate?: CandidateSummaryDto;
};

export type SummaryDto = {
  summaryText?: string | null;
  snapshotId?: number | null;
};

export type RequirementConfirmationListResponse = {
  mode: string;
  ready: boolean;
  message?: string;
  page?: number;
  pageSize?: number;
  total?: number;
  items?: DemandListItemDto[];
};

export type RequirementConfirmationDetailResponse = {
  mode: string;
  ready: boolean;
  message?: string;
  demand?: DemandDetailDto;
  pool?: PoolDto;
  backupCandidates?: CandidateSummaryDto[];
  finalCandidates?: FinalCandidateDto[];
  summary?: SummaryDto;
};

export type ProcurementConfirmationCommand = {
  ownerUserId: number;
  operatorUserId?: number;
  operatorRole?: string;
};
