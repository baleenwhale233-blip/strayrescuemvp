import Taro from "@tarojs/taro";
import type { PublicDetailVM } from "../domain/canonical/types";
import type { OwnerDetailVM } from "../domain/canonical/repository/canonicalReadRepositoryCore";

export type LocalBudgetAdjustmentSubmission = {
  id: string;
  previousTargetAmount: number;
  currentTargetAmount: number;
  reason: string;
  timestampLabel: string;
  createdAt: string;
};

function getCaseBudgetAdjustmentKey(caseId?: string) {
  return `case-budget-adjustments:${caseId || "unknown-case"}`;
}

function getDraftBudgetRefreshKey(draftId?: string) {
  return `draft-budget-refresh:${draftId || "unknown-draft"}`;
}

function formatCurrency(amount: number) {
  return `¥${amount.toLocaleString("zh-CN")}`;
}

function getProgressPercent(supportedAmount: number, targetAmount: number) {
  if (targetAmount <= 0) {
    return 0;
  }

  return Math.min(Math.round((supportedAmount / targetAmount) * 100), 100);
}

export function saveCaseBudgetAdjustment(
  caseId: string | undefined,
  submission: LocalBudgetAdjustmentSubmission,
) {
  if (!caseId) {
    return;
  }

  const key = getCaseBudgetAdjustmentKey(caseId);
  const current = Taro.getStorageSync(key);
  const list = Array.isArray(current)
    ? (current as LocalBudgetAdjustmentSubmission[])
    : [];
  Taro.setStorageSync(key, [submission, ...list]);
}

export function getCaseBudgetAdjustments(caseId?: string) {
  if (!caseId) {
    return [];
  }

  const current = Taro.getStorageSync(getCaseBudgetAdjustmentKey(caseId));
  return Array.isArray(current)
    ? (current as LocalBudgetAdjustmentSubmission[])
    : [];
}

export function applyCaseBudgetAdjustmentsToPublicDetail(
  detail: PublicDetailVM,
  adjustments: LocalBudgetAdjustmentSubmission[],
) {
  if (!adjustments.length) {
    return detail;
  }

  const latest = adjustments[0];
  const timelineItems = adjustments.map((item) => ({
    id: item.id,
    type: "budget_adjustment" as const,
    label: "预算调整",
    tone: "active" as const,
    title: `预算从 ${formatCurrency(item.previousTargetAmount)} 调整到 ${formatCurrency(item.currentTargetAmount)}`,
    description: item.reason,
    timestampLabel: item.timestampLabel,
    assetUrls: [],
  }));

  return {
    ...detail,
    ledger: {
      ...detail.ledger,
      targetAmount: latest.currentTargetAmount,
      targetAmountLabel: formatCurrency(latest.currentTargetAmount),
      remainingTargetAmount: Math.max(
        latest.currentTargetAmount -
          Math.max(detail.ledger.confirmedExpenseAmount, detail.ledger.supportedAmount),
        0,
      ),
      remainingTargetAmountLabel: formatCurrency(
        Math.max(
          latest.currentTargetAmount -
            Math.max(detail.ledger.confirmedExpenseAmount, detail.ledger.supportedAmount),
          0,
        ),
      ),
      progressPercent: getProgressPercent(
        detail.ledger.supportedAmount,
        latest.currentTargetAmount,
      ),
    },
    timeline: [...timelineItems, ...detail.timeline],
  };
}

export function applyCaseBudgetAdjustmentsToOwnerDetail(
  detail: OwnerDetailVM,
  adjustments: LocalBudgetAdjustmentSubmission[],
) {
  if (!adjustments.length) {
    return detail;
  }

  const latest = adjustments[0];

  return {
    ...detail,
    goalAmountLabel: formatCurrency(latest.currentTargetAmount),
    progressPercent: getProgressPercent(
      detail.ledger.supportedAmount,
      latest.currentTargetAmount,
    ),
    ledger: {
      ...detail.ledger,
      targetAmount: latest.currentTargetAmount,
      targetAmountLabel: formatCurrency(latest.currentTargetAmount),
      remainingTargetAmount: Math.max(
        latest.currentTargetAmount -
          Math.max(detail.ledger.confirmedExpenseAmount, detail.ledger.supportedAmount),
        0,
      ),
      remainingTargetAmountLabel: formatCurrency(
        Math.max(
          latest.currentTargetAmount -
            Math.max(detail.ledger.confirmedExpenseAmount, detail.ledger.supportedAmount),
          0,
        ),
      ),
    },
  };
}

export function markDraftBudgetRefresh(draftId?: string) {
  if (!draftId) {
    return;
  }

  Taro.setStorageSync(getDraftBudgetRefreshKey(draftId), "1");
}

export function consumeDraftBudgetRefresh(draftId?: string) {
  if (!draftId) {
    return false;
  }

  const key = getDraftBudgetRefreshKey(draftId);
  const shouldRefresh = Taro.getStorageSync(key) === "1";

  if (shouldRefresh) {
    Taro.removeStorageSync(key);
  }

  return shouldRefresh;
}
