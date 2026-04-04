export type Id = string;
export type IsoDateTimeString = string;
export type CasePublicId = string;

export type VerificationStatus =
  | "pending"
  | "confirmed"
  | "rejected"
  | "manual";

export type Visibility = "draft" | "private" | "public" | "archived";

export type CurrencyCode = "CNY";
export type ExpenseCategory =
  | "medical"
  | "medication"
  | "food_supply"
  | "transport_other";
export type ExpenseEvidenceKind =
  | "receipt"
  | "order_screenshot"
  | "payment_screenshot"
  | "item_photo"
  | "treatment_photo"
  | "animal_photo"
  | "animal_item_photo";
export type EvidenceLevel = "complete" | "basic" | "needs_attention";
export type HomepageEligibilityStatus =
  | "eligible"
  | "missing_update"
  | "missing_evidence"
  | "public_but_not_eligible";
export type SupportEntryStatus = "pending" | "confirmed" | "unmatched";
export type SupportUnmatchedReason =
  | "no_transfer_found"
  | "amount_or_time_mismatch"
  | "insufficient_screenshot"
  | "duplicate_submission"
  | "unrelated_record"
  | "other";

export type RescuerVerifiedLevel = "none" | "wechat" | "realname";

export type CaseSpecies = "cat" | "dog" | "other";

export type CaseCurrentStatus =
  | "draft"
  | "newly_found"
  | "medical"
  | "recovery"
  | "rehoming"
  | "completed"
  | "closed";

export type CaseVisibility = "draft" | "published" | "archived";

export type EventType =
  | "case_created"
  | "progress_update"
  | "expense"
  | "support"
  | "budget_adjustment";

export type SupportSource =
  | "donor_claim"
  | "manual_entry"
  | "batch_import"
  | "platform_form";

export type AssetKind =
  | "animal_face"
  | "case_cover"
  | "receipt"
  | "medical_record"
  | "progress_photo"
  | "support_proof"
  | "payment_qr"
  | "avatar"
  | "other";

export type StatusTone = "urgent" | "active" | "progress" | "done" | "draft";
export type BundleSourceKind = "seed" | "local" | "remote";

export type CanonicalRescuerStats = {
  publishedCaseCount: number;
  verifiedReceiptCount: number;
};

export type CanonicalRescuer = {
  id: Id;
  name: string;
  avatarAssetId?: Id;
  avatarUrl?: string;
  verifiedLevel: RescuerVerifiedLevel;
  joinedAt: IsoDateTimeString;
  wechatId?: string;
  alipayAccount?: string;
  paymentQrAssetId?: Id;
  stats: CanonicalRescuerStats;
};

export type CanonicalCase = {
  id: Id;
  publicCaseId?: CasePublicId;
  rescuerId: Id;
  animalName: string;
  species: CaseSpecies;
  coverAssetId?: Id;
  faceIdAssetId?: Id;
  foundAt?: IsoDateTimeString;
  foundLocationText?: string;
  initialSummary: string;
  currentStatus: CaseCurrentStatus;
  currentStatusLabel: string;
  targetAmount: number;
  visibility: CaseVisibility;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
};

export type CanonicalBaseEvent = {
  id: Id;
  caseId: Id;
  type: EventType;
  occurredAt: IsoDateTimeString;
  assetIds: Id[];
  visibility: Visibility;
};

export type CanonicalCaseCreatedEvent = CanonicalBaseEvent & {
  type: "case_created";
  text: string;
  statusLabel?: string;
};

export type CanonicalProgressUpdateEvent = CanonicalBaseEvent & {
  type: "progress_update";
  text: string;
  statusLabel?: string;
};

export type CanonicalExpenseEvent = CanonicalBaseEvent & {
  type: "expense";
  amount: number;
  currency: CurrencyCode;
  merchantName?: string;
  expenseItemsText: string;
  verificationStatus: VerificationStatus;
};

export type CanonicalSupportEvent = CanonicalBaseEvent & {
  type: "support";
  supporterUserId?: Id;
  amount: number;
  currency: CurrencyCode;
  supportSource: SupportSource;
  supporterNameMasked?: string;
  message?: string;
  verificationStatus: VerificationStatus;
};

export type CanonicalBudgetAdjustmentEvent = CanonicalBaseEvent & {
  type: "budget_adjustment";
  previousTargetAmount: number;
  newTargetAmount: number;
  reason: string;
};

export type CanonicalEvent =
  | CanonicalCaseCreatedEvent
  | CanonicalProgressUpdateEvent
  | CanonicalExpenseEvent
  | CanonicalSupportEvent
  | CanonicalBudgetAdjustmentEvent;

export type CanonicalAsset = {
  id: Id;
  kind: AssetKind;
  originalUrl?: string;
  watermarkedUrl?: string;
  thumbnailUrl?: string;
};

export type CanonicalEvidenceItem = {
  id: Id;
  kind: ExpenseEvidenceKind;
  assetId?: Id;
  imageUrl?: string;
  hash?: string;
};

export type CanonicalSharedEvidenceGroup = {
  id: Id;
  caseId: Id;
  title?: string;
  items: CanonicalEvidenceItem[];
};

export type CanonicalExpenseRecord = {
  id: Id;
  caseId: Id;
  amount: number;
  currency: CurrencyCode;
  spentAt: IsoDateTimeString;
  category: ExpenseCategory;
  summary: string;
  note?: string;
  merchantName?: string;
  evidenceItems: CanonicalEvidenceItem[];
  sharedEvidenceGroupId?: Id;
  evidenceLevel: EvidenceLevel;
  verificationStatus: VerificationStatus;
  visibility: Visibility;
  projectedEventId?: Id;
};

export type CanonicalSupportThread = {
  id: Id;
  caseId: Id;
  supporterUserId: Id;
  supporterNameMasked?: string;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
  totalConfirmedAmount: number;
  totalPendingAmount: number;
  totalUnmatchedAmount: number;
  pendingCount: number;
  unmatchedCount: number;
  latestStatusSummary?: string;
};

export type CanonicalSupportEntry = {
  id: Id;
  supportThreadId: Id;
  caseId: Id;
  supporterUserId: Id;
  supporterNameMasked?: string;
  amount: number;
  currency: CurrencyCode;
  supportedAt: IsoDateTimeString;
  note?: string;
  screenshotItems: CanonicalEvidenceItem[];
  screenshotHashes: string[];
  status: SupportEntryStatus;
  unmatchedReason?: SupportUnmatchedReason;
  unmatchedNote?: string;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
  confirmedAt?: IsoDateTimeString;
  confirmedByUserId?: Id;
  visibility: Visibility;
  projectedEventId?: Id;
};

export type CanonicalCaseBundle = {
  sourceKind: BundleSourceKind;
  rescuer: CanonicalRescuer;
  case: CanonicalCase;
  events: CanonicalEvent[];
  assets: CanonicalAsset[];
  sharedEvidenceGroups?: CanonicalSharedEvidenceGroup[];
  expenseRecords?: CanonicalExpenseRecord[];
  supportThreads?: CanonicalSupportThread[];
  supportEntries?: CanonicalSupportEntry[];
};

export type CanonicalDataset = {
  rescuers: CanonicalRescuer[];
  cases: CanonicalCase[];
  events: CanonicalEvent[];
  assets: CanonicalAsset[];
};

export type LedgerSnapshot = {
  targetAmount: number;
  confirmedExpenseAmount: number;
  supportedAmount: number;
  pendingSupportAmount: number;
  verifiedGapAmount: number;
  remainingTargetAmount: number;
  progressPercent: number;
};

export type PublicTimelineItemVM = {
  id: Id;
  type: EventType;
  label: string;
  tone: StatusTone;
  title: string;
  description?: string;
  amountLabel?: string;
  timestampLabel: string;
  assetUrls: string[];
  verificationStatus?: VerificationStatus;
};

export type PublicDetailVM = {
  caseId: Id;
  publicCaseId: CasePublicId;
  rescuerId: Id;
  title: string;
  species: CaseSpecies;
  statusLabel: string;
  statusTone: StatusTone;
  heroImageUrl?: string;
  locationText?: string;
  summary: string;
  updatedAtLabel: string;
  ledger: LedgerSnapshot & {
    targetAmountLabel: string;
    confirmedExpenseAmountLabel: string;
    supportedAmountLabel: string;
    pendingSupportAmountLabel: string;
    verifiedGapAmountLabel: string;
    remainingTargetAmountLabel: string;
  };
  rescuer: {
    id: Id;
    name: string;
    avatarUrl?: string;
    verifiedLevel: RescuerVerifiedLevel;
    verifiedLabel: string;
    joinedAtLabel: string;
    stats: CanonicalRescuerStats;
    wechatId?: string;
    paymentQrUrl?: string;
  };
  supportSummary: {
    confirmedSupportAmount: number;
    confirmedSupportAmountLabel: string;
    pendingSupportEntryCount: number;
    unmatchedSupportEntryCount: number;
    threads: SupportThreadSummaryVM[];
  };
  timeline: PublicTimelineItemVM[];
  latestTimelineSummary?: string;
};

export type HomepageCaseCardVM = {
  caseId: Id;
  publicCaseId: CasePublicId;
  rescuerId: Id;
  sourceKind: BundleSourceKind;
  title: string;
  statusLabel: string;
  statusTone: StatusTone;
  coverImageUrl?: string;
  updatedAtLabel: string;
  latestStatusSummary: string;
  fundingStatusSummary: string;
  recommendationReason?: string;
  evidenceLevel: EvidenceLevel;
  homepageEligibilityStatus: HomepageEligibilityStatus;
  homepageEligibilityReason: string;
  progressPercent: number;
  amountLabel: string;
};

export type DiscoverCardVM = {
  caseId: Id;
  publicCaseId?: CasePublicId;
  rescuerId: Id;
  sourceKind: BundleSourceKind;
  title: string;
  statusLabel: string;
  statusTone: StatusTone;
  coverImageUrl?: string;
  updatedAtLabel: string;
  subtitle: string;
  latestTimelineSummary?: string;
  progressPercent: number;
  amountLabel: string;
};

export type WorkbenchCaseCardVM = {
  caseId: Id;
  publicCaseId?: CasePublicId;
  sourceKind: BundleSourceKind;
  title: string;
  statusLabel: string;
  statusTone: StatusTone;
  updatedAtLabel: string;
  visibility: CaseVisibility;
  currentStatus: CaseCurrentStatus;
  coverImageUrl?: string;
  targetAmountLabel: string;
  homepageEligibilityStatus?: HomepageEligibilityStatus;
  homepageEligibilityReason?: string;
  pendingSupportEntryCount?: number;
  unmatchedSupportEntryCount?: number;
  draftId?: Id;
};

export type WorkbenchVM = {
  rescuer: {
    id: Id;
    name: string;
    avatarUrl?: string;
    verifiedLevel: RescuerVerifiedLevel;
  };
  counts: {
    active: number;
    draft: number;
    archived: number;
  };
  activeCases: WorkbenchCaseCardVM[];
  draftCases: WorkbenchCaseCardVM[];
  archivedCases: WorkbenchCaseCardVM[];
};

export type SupportSheetData = {
  wechatId?: string;
  contactHint: string;
  directHint: string;
  contactTip: string;
  directTip: string;
  paymentQrUrl?: string;
};

export type SupportEntrySummaryVM = {
  id: Id;
  amount: number;
  amountLabel: string;
  status: SupportEntryStatus;
  statusLabel: string;
  supportedAtLabel: string;
  note?: string;
  hasScreenshot: boolean;
  unmatchedReasonLabel?: string;
};

export type SupportThreadSummaryVM = {
  id: Id;
  supporterUserId: Id;
  supporterNameMasked?: string;
  confirmedAmount: number;
  confirmedAmountLabel: string;
  pendingCount: number;
  unmatchedCount: number;
  latestEntryAtLabel: string;
  entries: SupportEntrySummaryVM[];
};
