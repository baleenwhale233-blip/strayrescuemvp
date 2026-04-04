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
  type RescueCreateDraft,
  type RescueCreateDraftStatus,
  type RescueCreateEntryTone,
  type RescueCreateTimelineEntry,
} from "./localDraftPersistence";
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

export function createSupportEntry(
  draft: RescueCreateDraft,
  input: Parameters<typeof createSupportEntryOnDraft>[1],
) {
  return createSupportEntryOnDraft(draft, input);
}

export function confirmSupportEntry(
  draft: RescueCreateDraft,
  input: Parameters<typeof confirmSupportEntryOnDraft>[1],
) {
  return confirmSupportEntryOnDraft(draft, input);
}

export function markSupportEntryUnmatched(
  draft: RescueCreateDraft,
  input: Parameters<typeof markSupportEntryUnmatchedOnDraft>[1],
) {
  return markSupportEntryUnmatchedOnDraft(draft, input);
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
