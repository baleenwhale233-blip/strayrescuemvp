import Taro from "@tarojs/taro";
import type { PublicDetailVM } from "../domain/canonical/types";
import type { OwnerDetailVM } from "../domain/canonical/repository/canonicalReadRepositoryCore";

export type LocalStatusSubmission = {
  id: string;
  statusLabel: string;
  description: string;
  timestampLabel: string;
  assetUrls: string[];
  createdAt: string;
};

function getCaseStatusSubmissionKey(caseId?: string) {
  return `case-status-submissions:${caseId || "unknown-case"}`;
}

function getDraftStatusRefreshKey(draftId?: string) {
  return `draft-status-refresh:${draftId || "unknown-draft"}`;
}

export function saveCaseStatusSubmission(
  caseId: string | undefined,
  submission: LocalStatusSubmission,
) {
  if (!caseId) {
    return;
  }

  const key = getCaseStatusSubmissionKey(caseId);
  const current = Taro.getStorageSync(key);
  const list = Array.isArray(current) ? (current as LocalStatusSubmission[]) : [];
  Taro.setStorageSync(key, [submission, ...list]);
}

export function getCaseStatusSubmissions(caseId?: string) {
  if (!caseId) {
    return [];
  }

  const current = Taro.getStorageSync(getCaseStatusSubmissionKey(caseId));
  return Array.isArray(current) ? (current as LocalStatusSubmission[]) : [];
}

export function mergeCaseStatusSubmissionsIntoDetail(
  detail: PublicDetailVM,
  submissions: LocalStatusSubmission[],
) {
  if (!submissions.length) {
    return detail;
  }

  const latest = submissions[0];
  const localItems = submissions.map((submission) => ({
    id: submission.id,
    type: "progress_update" as const,
    label: "状态更新",
    tone: "progress" as const,
    title: submission.description,
    timestampLabel: submission.timestampLabel,
    assetUrls: submission.assetUrls.slice(0, 9),
  }));

  return {
    ...detail,
    statusLabel: latest.statusLabel,
    updatedAtLabel: latest.timestampLabel,
    timeline: [...localItems, ...detail.timeline],
    latestTimelineSummary: latest.description,
  };
}

export function applyCaseStatusSubmissionsToOwnerDetail(
  detail: OwnerDetailVM,
  submissions: LocalStatusSubmission[],
) {
  if (!submissions.length) {
    return detail;
  }

  return {
    ...detail,
    statusLabel: submissions[0].statusLabel,
  };
}

export function markDraftStatusRefresh(draftId?: string) {
  if (!draftId) {
    return;
  }

  Taro.setStorageSync(getDraftStatusRefreshKey(draftId), "1");
}

export function consumeDraftStatusRefresh(draftId?: string) {
  if (!draftId) {
    return false;
  }

  const key = getDraftStatusRefreshKey(draftId);
  const shouldRefresh = Taro.getStorageSync(key) === "1";

  if (shouldRefresh) {
    Taro.removeStorageSync(key);
  }

  return shouldRefresh;
}
