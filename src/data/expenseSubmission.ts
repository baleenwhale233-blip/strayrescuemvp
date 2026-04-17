import Taro from "@tarojs/taro";
import type { CanonicalEvidenceItem, PublicDetailVM, PublicTimelineItemVM } from "../domain/canonical/types";

export type LocalExpenseSubmission = {
  id: string;
  title: string;
  amount: number;
  timestampLabel: string;
  assetUrls: string[];
  createdAt: string;
};

function getCaseExpenseSubmissionKey(caseId?: string) {
  return `case-expense-submissions:${caseId || "unknown-case"}`;
}

function getDraftExpenseRefreshKey(draftId?: string) {
  return `draft-expense-refresh:${draftId || "unknown-draft"}`;
}

function formatCurrency(amount: number) {
  return `¥${amount.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function saveCaseExpenseSubmission(
  caseId: string | undefined,
  submission: LocalExpenseSubmission,
) {
  if (!caseId) {
    return;
  }

  const key = getCaseExpenseSubmissionKey(caseId);
  const current = Taro.getStorageSync(key);
  const list = Array.isArray(current) ? (current as LocalExpenseSubmission[]) : [];
  Taro.setStorageSync(key, [submission, ...list]);
}

export function getCaseExpenseSubmissions(caseId?: string) {
  if (!caseId) {
    return [];
  }

  const current = Taro.getStorageSync(getCaseExpenseSubmissionKey(caseId));
  return Array.isArray(current) ? (current as LocalExpenseSubmission[]) : [];
}

export function mergeCaseExpenseSubmissionsIntoDetail(
  detail: PublicDetailVM,
  submissions: LocalExpenseSubmission[],
) {
  if (!submissions.length) {
    return detail;
  }

  const localItems: PublicTimelineItemVM[] = submissions.map((submission) => ({
    id: submission.id,
    type: "expense",
    label: "支出记录",
    tone: "urgent",
    title: submission.title,
    amountLabel: `-${formatCurrency(submission.amount)}`,
    timestampLabel: submission.timestampLabel,
    assetUrls: submission.assetUrls.slice(0, 9),
    verificationStatus: "manual",
  }));

  return {
    ...detail,
    timeline: [...localItems, ...detail.timeline],
  };
}

export function buildExpenseEvidenceItems(imageUrls: string[]): CanonicalEvidenceItem[] {
  return imageUrls.map((imageUrl, index) => ({
    id: `expense-evidence-${Date.now()}-${index}`,
    kind: index === 0 ? "receipt" : "animal_photo",
    imageUrl,
    hash: imageUrl,
  }));
}

export function markDraftExpenseRefresh(draftId?: string) {
  if (!draftId) {
    return;
  }

  Taro.setStorageSync(getDraftExpenseRefreshKey(draftId), "1");
}

export function consumeDraftExpenseRefresh(draftId?: string) {
  if (!draftId) {
    return false;
  }

  const key = getDraftExpenseRefreshKey(draftId);
  const shouldRefresh = Taro.getStorageSync(key) === "1";

  if (shouldRefresh) {
    Taro.removeStorageSync(key);
  }

  return shouldRefresh;
}
