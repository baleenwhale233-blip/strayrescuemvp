import {
  calculateDraftLedger,
  formatTimelineTimestamp,
  getCurrentDraftSession,
  getSavedDraftById,
  getSavedDrafts,
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
