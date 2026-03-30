/**
 * @deprecated
 * Legacy compatibility layer. New code should use
 * `src/domain/canonical/repository/localRepository.ts` or
 * `src/domain/canonical/repository/localDraftPersistence.ts`.
 */

export type {
  RescueCreateDraft,
  RescueCreateDraftStatus,
  RescueCreateEntryTone,
  RescueCreateTimelineEntry,
} from "../domain/canonical/repository/localDraftPersistence";

export {
  appendEntryToDraft,
  calculateDraftLedger,
  clearCurrentDraftSession,
  createInitialDraft,
  formatTimelineTimestamp,
  getCurrentDraftSession,
  getSavedDraftById,
  getSavedDrafts,
  patchCurrentDraftSession,
  replaceDraftById,
  saveCurrentDraft,
  setCurrentDraftSession,
  startNewDraftSession,
  upsertSavedDraft,
} from "../domain/canonical/repository/localDraftPersistence";
