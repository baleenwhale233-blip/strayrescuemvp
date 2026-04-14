import {
  addExpenseRecordToDraft,
  addExpenseRecordsBatchToDraft,
  calculateDraftLedger,
  confirmSupportEntryOnDraft,
  createOrGetSupportThreadOnDraft,
  createSupportEntryOnDraft,
  formatTimelineTimestamp,
  getCurrentDraftSession,
  getSavedDraftById,
  getSavedDrafts,
  markSupportEntryUnmatchedOnDraft,
  patchCurrentDraftSession,
  replaceDraftById,
  saveCurrentDraft,
  setCurrentDraftSession,
  startNewDraftSession,
  upsertSavedDraft,
  type RescueCreateDraft,
  type RescueCreateDraftStatus,
  type RescueCreateEntryTone,
  type RescueCreateTimelineEntry,
} from "./localDraftPersistence";
import { adaptRescueProjectDetailMockToCanonical } from "../adapters/mockToCanonical";
import { sampleCaseBundle } from "../fixtures/sampleCaseBundle";
import { legacyRescueProjectDetails } from "../fixtures/legacyRescueProjectDetails";
import type { CanonicalCaseBundle } from "../types";
import {
  caseIdToDraftId,
  draftIdToCaseId,
  toOwnerActionTimelineEntry,
  type OwnerDetailActionKey,
} from "./localRepositoryCore";

export type {
  RescueCreateDraft,
  RescueCreateDraftStatus,
  RescueCreateEntryTone,
  RescueCreateTimelineEntry,
};

export { calculateDraftLedger, formatTimelineTimestamp, draftIdToCaseId, caseIdToDraftId };
export { toOwnerActionTimelineEntry, type OwnerDetailActionKey } from "./localRepositoryCore";

function getSeedBundles(): CanonicalCaseBundle[] {
  const legacyBundles = legacyRescueProjectDetails.map((detail, index) =>
    adaptRescueProjectDetailMockToCanonical(detail, index),
  );

  return [sampleCaseBundle, ...legacyBundles];
}

function resolveAssetUrl(
  bundle: CanonicalCaseBundle,
  assetId?: string,
) {
  if (!assetId) {
    return undefined;
  }

  const asset = bundle.assets.find((item) => item.id === assetId);
  return asset?.watermarkedUrl || asset?.thumbnailUrl || asset?.originalUrl;
}

function buildStatusTimelineEntry(
  bundle: CanonicalCaseBundle,
): RescueCreateTimelineEntry[] {
  return bundle.events
    .filter(
      (event) =>
        event.type === "case_created" ||
        event.type === "progress_update" ||
        event.type === "budget_adjustment",
    )
    .map((event) => {
      if (event.type === "budget_adjustment") {
        return {
          id: `timeline-${event.id}`,
          tone: "budget" as const,
          label: "预算调整",
          title: event.reason,
          description: event.reason,
          timestamp: formatTimelineTimestamp(new Date(event.occurredAt)),
          budgetPrevious: event.previousTargetAmount,
          budgetCurrent: event.newTargetAmount,
        };
      }

      return {
        id: `timeline-${event.id}`,
        tone: "status" as const,
        label: event.statusLabel || "状态更新",
        title: event.text,
        description: event.text,
        timestamp: formatTimelineTimestamp(new Date(event.occurredAt)),
        images: event.assetIds
          .map((assetId) => resolveAssetUrl(bundle, assetId))
          .filter((value): value is string => Boolean(value)),
      };
    });
}

function buildDraftFromBundle(bundle: CanonicalCaseBundle): RescueCreateDraft {
  return {
    id: caseIdToDraftId(bundle.case.id),
    publicCaseId: bundle.case.publicCaseId,
    name: bundle.case.animalName,
    summary: bundle.case.initialSummary,
    coverPath:
      resolveAssetUrl(bundle, bundle.case.coverAssetId) ||
      resolveAssetUrl(bundle, bundle.case.faceIdAssetId) ||
      "",
    budget: bundle.case.targetAmount,
    budgetNote: bundle.events.find((event) => event.type === "budget_adjustment")?.type === "budget_adjustment"
      ? bundle.events.find((event) => event.type === "budget_adjustment")?.reason || ""
      : "",
    species: bundle.case.species,
    currentStatus: bundle.case.currentStatus,
    currentStatusLabel: bundle.case.currentStatusLabel,
    foundLocationText: bundle.case.foundLocationText,
    rescuerName: bundle.rescuer.name,
    rescuerAvatarUrl: bundle.rescuer.avatarUrl,
    rescuerWechatId: bundle.rescuer.wechatId,
    rescuerVerifiedLevel: bundle.rescuer.verifiedLevel,
    rescuerJoinedAt: bundle.rescuer.joinedAt,
    rescuerStats: bundle.rescuer.stats,
    paymentQrUrl: resolveAssetUrl(bundle, bundle.rescuer.paymentQrAssetId),
    status: bundle.case.visibility === "published" ? "published" : "draft",
    timeline: buildStatusTimelineEntry(bundle),
    sharedEvidenceGroups: bundle.sharedEvidenceGroups ?? [],
    expenseRecords: [...(bundle.expenseRecords ?? [])],
    supportThreads: [...(bundle.supportThreads ?? [])],
    supportEntries: [...(bundle.supportEntries ?? [])],
    homepageEligibility: {
      status: "public_but_not_eligible",
      reason: "待计算首页资格",
    },
    createdAt: bundle.case.createdAt,
    updatedAt: bundle.case.updatedAt,
  };
}

function getSeedBundleByCaseId(caseId?: string) {
  if (!caseId) {
    return undefined;
  }

  return getSeedBundles().find((bundle) => bundle.case.id === caseId);
}

function persistAndSyncDraft(draft: RescueCreateDraft) {
  const saved = upsertSavedDraft(draft);
  setCurrentDraftSession(saved);
  return saved;
}

export function ensureDraftByCaseId(caseId?: string) {
  if (!caseId) {
    return undefined;
  }

  const existingDraft = getSavedDraftById(caseIdToDraftId(caseId));
  if (existingDraft) {
    return existingDraft;
  }

  const seedBundle = getSeedBundleByCaseId(caseId);
  if (!seedBundle) {
    return undefined;
  }

  return persistAndSyncDraft(buildDraftFromBundle(seedBundle));
}

export function listSavedDrafts() {
  return getSavedDrafts();
}

export function startDraftSession() {
  return startNewDraftSession();
}

export function getCurrentDraft() {
  return getCurrentDraftSession();
}

export function getDraftById(draftId?: string) {
  return getSavedDraftById(draftId);
}

export function getDraftByCaseId(caseId?: string) {
  if (!caseId) {
    return undefined;
  }

  return getSavedDraftById(caseIdToDraftId(caseId));
}

export function updateCurrentDraft(patch: Partial<RescueCreateDraft>) {
  return patchCurrentDraftSession(patch);
}

export function persistDraft(status: RescueCreateDraftStatus) {
  return saveCurrentDraft(status);
}

export function appendDraftEntry(
  draft: RescueCreateDraft,
  entry: RescueCreateTimelineEntry,
) {
  const nextDraft = {
    ...draft,
    timeline: [entry, ...draft.timeline],
  };

  return setCurrentDraftSession(nextDraft);
}

export function replaceDraft(draft: RescueCreateDraft) {
  return replaceDraftById(draft);
}

export function syncCurrentDraft(draft: RescueCreateDraft) {
  return setCurrentDraftSession(draft);
}

export function createOrGetSupportThread(
  draft: RescueCreateDraft,
  input: Parameters<typeof createOrGetSupportThreadOnDraft>[1],
) {
  return createOrGetSupportThreadOnDraft(draft, input);
}

export function createOrGetSupportThreadByCaseId(
  caseId: string | undefined,
  input: Parameters<typeof createOrGetSupportThreadOnDraft>[1],
) {
  const draft = ensureDraftByCaseId(caseId);
  if (!draft) {
    throw new Error("CASE_NOT_FOUND");
  }

  const result = createOrGetSupportThreadOnDraft(draft, input);

  return {
    ...result,
    draft: persistAndSyncDraft(result.draft),
  };
}

export function createSupportEntry(
  draft: RescueCreateDraft,
  input: Parameters<typeof createSupportEntryOnDraft>[1],
) {
  return createSupportEntryOnDraft(draft, input);
}

export function createSupportEntryByCaseId(
  caseId: string | undefined,
  input: Parameters<typeof createSupportEntryOnDraft>[1],
) {
  const draft = ensureDraftByCaseId(caseId);
  if (!draft) {
    throw new Error("CASE_NOT_FOUND");
  }

  const result = createSupportEntryOnDraft(draft, input);

  return {
    ...result,
    draft: persistAndSyncDraft(result.draft),
  };
}

export function confirmSupportEntry(
  draft: RescueCreateDraft,
  input: Parameters<typeof confirmSupportEntryOnDraft>[1],
) {
  return confirmSupportEntryOnDraft(draft, input);
}

export function confirmSupportEntryByCaseId(
  caseId: string | undefined,
  input: Parameters<typeof confirmSupportEntryOnDraft>[1],
) {
  const draft = ensureDraftByCaseId(caseId);
  if (!draft) {
    throw new Error("CASE_NOT_FOUND");
  }

  return persistAndSyncDraft(confirmSupportEntryOnDraft(draft, input));
}

export function markSupportEntryUnmatched(
  draft: RescueCreateDraft,
  input: Parameters<typeof markSupportEntryUnmatchedOnDraft>[1],
) {
  return markSupportEntryUnmatchedOnDraft(draft, input);
}

export function markSupportEntryUnmatchedByCaseId(
  caseId: string | undefined,
  input: Parameters<typeof markSupportEntryUnmatchedOnDraft>[1],
) {
  const draft = ensureDraftByCaseId(caseId);
  if (!draft) {
    throw new Error("CASE_NOT_FOUND");
  }

  return persistAndSyncDraft(markSupportEntryUnmatchedOnDraft(draft, input));
}

export function addExpenseRecord(
  draft: RescueCreateDraft,
  input: Parameters<typeof addExpenseRecordToDraft>[1],
) {
  return addExpenseRecordToDraft(draft, input);
}

export function addExpenseRecordsBatch(
  draft: RescueCreateDraft,
  input: Parameters<typeof addExpenseRecordsBatchToDraft>[1],
) {
  return addExpenseRecordsBatchToDraft(draft, input);
}
