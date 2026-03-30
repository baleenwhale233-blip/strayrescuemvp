export type Id = string;
export type IsoDateTimeString = string;

export type VerificationStatus =
  | "pending"
  | "confirmed"
  | "rejected"
  | "manual";

export type Visibility = "draft" | "private" | "public" | "archived";

export type CurrencyCode = "CNY";

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

export type CanonicalCaseBundle = {
  sourceKind: BundleSourceKind;
  rescuer: CanonicalRescuer;
  case: CanonicalCase;
  events: CanonicalEvent[];
  assets: CanonicalAsset[];
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
  timeline: PublicTimelineItemVM[];
  latestTimelineSummary?: string;
};

export type DiscoverCardVM = {
  caseId: Id;
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
  sourceKind: BundleSourceKind;
  title: string;
  statusLabel: string;
  statusTone: StatusTone;
  updatedAtLabel: string;
  visibility: CaseVisibility;
  currentStatus: CaseCurrentStatus;
  coverImageUrl?: string;
  targetAmountLabel: string;
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
