export type ProcurementMockRole = 'buyer' | 'operations' | 'ops-manager';

export type PreviewScenario = 'normal' | 'loading' | 'empty' | 'error' | 'forbidden';

export type ProcurementPoolStatus =
  | 'SOURCE_COLLECTING'
  | 'POOL_CREATED'
  | 'POOL_INQUIRY_RUNNING'
  | 'POOL_PARTIAL_HANDOFF'
  | 'POOL_EMPTY_REQUIRES_ACTION'
  | 'POOL_INQUIRY_FINISHED'
  | 'FINAL_TWO_CONFIRMED'
  | 'SUMMARY_READY';

export type ProcurementInquiryStatus =
  | 'BACKUP_POOL'
  | 'IN_POOL_WAITING_SEND'
  | 'IN_POOL_WAITING_REPLY'
  | 'FOLLOW_UP_1_SENT'
  | 'FOLLOW_UP_2_SENT'
  | 'FOLLOW_UP_3_SENT'
  | 'REPLIED'
  | 'PARTIAL_REPLY'
  | 'NO_REPLY_HANDOFF'
  | 'SEND_FAILED'
  | 'REPLY_PARSE_FAILED'
  | 'REMOVED_TERMINATED'
  | 'CLOSED';

export type FinalPickFlag = 'PRIMARY' | 'BACKUP' | null;

export type ProcurementCollectionStatus =
  | 'NOT_STARTED'
  | 'COLLECTING'
  | 'SUCCESS'
  | 'PARTIAL_SUCCESS'
  | 'FAILED';

export type CandidateScoreBreakdown = {
  matchScore: number;
  specScore: number;
  priceScore: number;
  moqScore: number;
  supplierScore: number;
  deliveryScore: number;
};

export type ProcurementCandidateRecord = {
  id: string;
  candidateId: string;
  poolItemId?: string;
  offerId: string;
  rankNo: number;
  title: string;
  supplierName: string;
  candidateUrl: string;
  mainImageUrl: string;
  priceText: string;
  moqText: string;
  locationText: string;
  deliveryText: string;
  resultCardText: string;
  detailHighlightText?: string;
  attributeSnapshotText?: string;
  shippingSnapshotText?: string;
  packageSnapshotText?: string;
  materialText?: string;
  powerModeText?: string;
  sizeText?: string;
  packageText?: string;
  detailImageUrl?: string;
  deliveryImageUrl?: string;
  tags: string[];
  reasons: string[];
  warnings: string[];
  totalScore: number;
  scores: CandidateScoreBreakdown;
  inPool: boolean;
  poolRankNo: number | null;
  inquiryStatus: ProcurementInquiryStatus;
  replySummary: string;
  latestReplyAt?: string;
  quotePrice?: string;
  quoteMoq?: string;
  quoteDelivery?: string;
  nextFollowUpAt?: string;
  plannedChannel?: string;
  activeChannel?: string;
  channelFallbackReason?: string;
  externalInquiryId?: string;
  externalInquiryUrl?: string;
  externalResultStatus?: string;
  replySource?: string;
  replyParseStatus?: string;
  replyParseError?: string;
  finalPick: FinalPickFlag;
};

export type ProcurementRequirementRecord = {
  id: string;
  poolId?: string;
  hasPool: boolean;
  demandNo: string;
  orderNo: string;
  poolVersion: number;
  demandTitle: string;
  searchKeyword: string;
  sourcePlatform: string;
  sourceUrl: string;
  sourceTitle?: string;
  sourceImageUrl: string;
  sourceDetailImageUrl?: string;
  sourcePackageImageUrl?: string;
  sourceCollectionStatus: ProcurementCollectionStatus;
  sourceCollectedAt?: string;
  sourceCollectionMessage?: string;
  referenceImageUrl: string;
  packageImageUrl: string;
  candidateCollectionStatus: ProcurementCollectionStatus;
  candidateCount: number;
  recommendedCandidateCount: number;
  candidateCollectionMethod?: string;
  candidateCollectedAt?: string;
  candidateCollectionStartedAt?: string;
  candidateCollectionFinishedAt?: string;
  candidateCollectionProgressPercent?: number;
  candidateCollectionMessage?: string;
  targetPriceMin: number;
  targetPriceMax: number;
  targetQuantity: number;
  expectedDelivery: string;
  targetSite: string;
  specialRequirement: string;
  targetMaterial?: string;
  targetPowerMode?: string;
  targetSizeText?: string;
  targetPackageType?: string;
  ownerName: string;
  status: ProcurementPoolStatus;
  top10Count: number;
  poolCount?: number;
  maxPoolSize?: number;
  finalCandidateCount?: number;
  poolStartedAt?: string;
  poolStartedBy?: string;
  createdAt: string;
  updatedAt: string;
  pendingConfirmations: string[];
  resultNotice: string;
  aiSummary?: string;
  finalDecisionNote?: string;
  candidates: ProcurementCandidateRecord[];
};

export type FeedbackTone = 'success' | 'info' | 'warning' | 'error';

export type ProcurementFeedbackEntry = {
  id: string;
  tone: FeedbackTone;
  title: string;
  description: string;
  createdAt: string;
};
