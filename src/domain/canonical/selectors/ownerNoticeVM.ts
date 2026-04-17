import type {
  CanonicalCaseBundle,
  HomepageEligibilityStatus,
  IsoDateTimeString,
} from "../types";
import { getHomepageEligibility, getStructuredSupportEntries } from "../modeling";

const DAY_MS = 24 * 60 * 60 * 1000;

export type OwnerAlertVM = {
  id: string;
  label: string;
  tone: "support" | "warning" | "info";
};

function getLastPublicActivityAt(bundle: CanonicalCaseBundle): IsoDateTimeString {
  return (
    [...bundle.events]
      .filter((event) => event.visibility === "public")
      .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))[0]
      ?.occurredAt ||
    bundle.case.updatedAt ||
    bundle.case.createdAt
  );
}

export function getLastUpdateAgeHint(bundle: CanonicalCaseBundle) {
  const lastActivityAt = getLastPublicActivityAt(bundle);
  const elapsedDays = Math.floor((Date.now() - Date.parse(lastActivityAt)) / DAY_MS);

  if (!Number.isFinite(elapsedDays) || elapsedDays < 3) {
    return undefined;
  }

  return `最近 ${elapsedDays} 天未更新`;
}

function getHomepageNotice(input: {
  status: HomepageEligibilityStatus;
  reason: string;
}) {
  if (input.status === "eligible") {
    return "已满足首页展示条件";
  }

  return input.reason;
}

export function getOwnerAlerts(bundle: CanonicalCaseBundle): OwnerAlertVM[] {
  const supportEntries = getStructuredSupportEntries(bundle);
  const pendingCount = supportEntries.filter((entry) => entry.status === "pending").length;
  const unmatchedCount = supportEntries.filter((entry) => entry.status === "unmatched").length;
  const homepageEligibility = getHomepageEligibility(bundle);
  const lastUpdateAgeHint = getLastUpdateAgeHint(bundle);
  const alerts: OwnerAlertVM[] = [];

  if (pendingCount > 0) {
    alerts.push({
      id: "pending-support",
      label: `${pendingCount} 条支持待确认`,
      tone: "support",
    });
  }

  if (unmatchedCount > 0) {
    alerts.push({
      id: "unmatched-support",
      label: `${unmatchedCount} 条支持待核对`,
      tone: "warning",
    });
  }

  if (lastUpdateAgeHint) {
    alerts.push({
      id: "stale-update",
      label: lastUpdateAgeHint,
      tone: "warning",
    });
  }

  const homepageNotice = getHomepageNotice(homepageEligibility);
  if (homepageNotice) {
    alerts.push({
      id: "homepage-eligibility",
      label: homepageNotice,
      tone: homepageEligibility.status === "eligible" ? "info" : "warning",
    });
  }

  return alerts;
}

export function getPrimaryNoticeLabel(bundle: CanonicalCaseBundle) {
  return getOwnerAlerts(bundle)[0]?.label;
}
