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
