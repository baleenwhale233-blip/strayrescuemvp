import type { CanonicalRescuer, HomepageCaseCardVM } from "../../types";

export type MyProfileVM = {
  openid?: string;
  displayName: string;
  avatarAssetId?: string;
  avatarUrl: string;
  wechatId: string;
  contactNote: string;
  paymentQrAssetId?: string;
  paymentQrUrl: string;
  hasContactProfile: boolean;
};

export type SupportHistoryItemVM = {
  caseId: string;
  publicCaseId?: string;
  animalName: string;
  animalCoverImageUrl: string;
  myTotalSupportedAmount: number;
  myTotalSupportedAmountLabel: string;
  latestSupportedAt?: string;
  latestSupportedAtLabel: string;
};

export type MySupportHistoryVM = {
  totalSupportedAmount: number;
  totalSupportedAmountLabel: string;
  supportCases: SupportHistoryItemVM[];
};

export type RescuerHomepageVM = {
  rescuer: Pick<CanonicalRescuer, "id" | "name" | "avatarUrl" | "stats">;
  cards: HomepageCaseCardVM[];
  profileEntryEnabled: boolean;
};

export type CaseRecordDetailVM = {
  id: string;
  caseId: string;
  recordType: "expense" | "progress_update" | "budget_adjustment" | "support";
  title: string;
  description?: string;
  occurredAt: string;
  occurredAtLabel: string;
  amount?: number;
  amountLabel?: string;
  immutable: true;
  expenseItems?: Array<{
    description: string;
    amount?: number;
  }>;
  images: Array<{
    assetId?: string;
    fileID?: string;
    url: string;
    thumbnailUrl?: string;
    watermarkedUrl?: string;
    kind:
      | "receipt"
      | "payment_screenshot"
      | "animal_photo"
      | "progress_photo"
      | "medical_record"
      | "other";
  }>;
  budgetPreviousLabel?: string;
  budgetCurrentLabel?: string;
};

export type UpdateMyProfileInput = {
  displayName?: string;
  avatarUrl?: string;
  avatarFileID?: string;
  wechatId?: string;
  contactNote?: string;
  paymentQrFileID?: string;
};

export type UpdateCaseProfileInput = {
  animalName?: string;
  coverFileID?: string;
};

export type CreateSupportEntryInput = {
  supporterNameMasked?: string;
  amount: number;
  supportedAt: string;
  note?: string;
  screenshotFileIds?: string[];
  localScreenshotPaths?: string[];
};

export type ReviewSupportEntryInput = {
  entryId: string;
  status: "confirmed" | "unmatched";
  reason?: import("../../types").SupportUnmatchedReason;
  note?: string;
};

export type CreateManualSupportEntryInput = {
  supporterNameMasked?: string;
  amount: number;
  supportedAt: string;
  note?: string;
};

export type CreateProgressUpdateInput = {
  status: import("../../types").CaseCurrentStatus;
  statusLabel: string;
  text: string;
  occurredAt: string;
  assetFileIds?: string[];
};

export type CreateExpenseRecordInput = {
  amount: number;
  spentAt: string;
  summary: string;
  note?: string;
  category?: "medical" | "medication" | "food_supply" | "transport_other";
  evidenceFileIds?: string[];
  expenseItems?: Array<{
    description: string;
    amount: number;
  }>;
};

export type CreateBudgetAdjustmentInput = {
  previousTargetAmount: number;
  newTargetAmount: number;
  reason: string;
  occurredAt: string;
};
