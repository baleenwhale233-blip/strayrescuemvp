import type { CanonicalEvidenceItem } from "../types";
import {
  clearCasePresentationOverrides,
  type LocalBudgetAdjustmentSubmission,
  type LocalExpenseSubmission,
  type LocalStatusSubmission,
} from "./localPresentationCore";
import {
  clearCaseBudgetAdjustmentStorage,
  clearCaseExpenseSubmissionStorage,
  clearCaseStatusSubmissionStorage,
  prependCaseBudgetAdjustment,
  prependCaseExpenseSubmission,
  prependCaseStatusSubmission,
  readCaseTitleOverrideStore,
  resetLocalPresentationStorageForTests as resetLocalPresentationStorage,
  writeCaseTitleOverrideStore,
} from "./localPresentationStorage";

export {
  finalizeHomepageCaseCardPresentation,
  finalizeOwnerDetailPresentation,
  finalizePublicDetailPresentation,
  finalizeWorkbenchCaseCardPresentation,
  resolveBundlePresentation,
  resolvePresentedCover,
  resolvePresentedDraft,
  resolvePresentedTitle,
} from "./localPresentationResolver";

export type {
  LocalBudgetAdjustmentSubmission,
  LocalExpenseSubmission,
  LocalStatusSubmission,
} from "./localPresentationCore";

export function saveCaseTitleOverride(input: {
  title: string;
  caseId?: string;
  draftId?: string;
}) {
  const title = input.title.trim();
  if (!title) {
    return;
  }

  const store = readCaseTitleOverrideStore();

  if (input.caseId) {
    store.byCaseId[input.caseId] = title;
  }

  if (input.draftId) {
    store.byDraftId[input.draftId] = title;
  }

  writeCaseTitleOverrideStore(store);
}

export function saveCaseCoverOverride(input: {
  coverPath: string;
  caseId?: string;
  draftId?: string;
}) {
  const coverPath = input.coverPath.trim();
  if (!coverPath) {
    return;
  }

  const store = readCaseTitleOverrideStore();

  if (input.caseId) {
    store.coverByCaseId[input.caseId] = coverPath;
  }

  if (input.draftId) {
    store.coverByDraftId[input.draftId] = coverPath;
  }

  writeCaseTitleOverrideStore(store);
}

export function clearCaseTitleOverride(caseId?: string, draftId?: string) {
  if (!caseId && !draftId) {
    return;
  }

  const store = readCaseTitleOverrideStore();
  writeCaseTitleOverrideStore(
    clearCasePresentationOverrides({
      ...store,
      caseId: caseId || "",
      draftId,
    }, {
      clearTitle: true,
    }),
  );
}

export function clearCaseCoverOverride(caseId?: string, draftId?: string) {
  if (!caseId && !draftId) {
    return;
  }

  const store = readCaseTitleOverrideStore();
  writeCaseTitleOverrideStore(
    clearCasePresentationOverrides({
      ...store,
      caseId: caseId || "",
      draftId,
    }, {
      clearCover: true,
    }),
  );
}

export function saveCaseStatusSubmission(
  caseId: string | undefined,
  submission: LocalStatusSubmission,
) {
  if (!caseId) {
    return;
  }

  prependCaseStatusSubmission(caseId, submission);
}

export function clearCaseStatusSubmissions(caseId?: string) {
  if (!caseId) {
    return;
  }

  clearCaseStatusSubmissionStorage(caseId);
}

export function saveCaseExpenseSubmission(
  caseId: string | undefined,
  submission: LocalExpenseSubmission,
) {
  if (!caseId) {
    return;
  }

  prependCaseExpenseSubmission(caseId, submission);
}

export function clearCaseExpenseSubmissions(caseId?: string) {
  if (!caseId) {
    return;
  }

  clearCaseExpenseSubmissionStorage(caseId);
}

export function saveCaseBudgetAdjustment(
  caseId: string | undefined,
  submission: LocalBudgetAdjustmentSubmission,
) {
  if (!caseId) {
    return;
  }

  prependCaseBudgetAdjustment(caseId, submission);
}

export function clearCaseBudgetAdjustments(caseId?: string) {
  if (!caseId) {
    return;
  }

  clearCaseBudgetAdjustmentStorage(caseId);
}

export function resetLocalPresentationStorageForTests(caseId?: string) {
  resetLocalPresentationStorage(caseId);
}

export function buildExpenseEvidenceItems(imageUrls: string[]): CanonicalEvidenceItem[] {
  return imageUrls.map((imageUrl, index) => ({
    id: `expense-evidence-${Date.now()}-${index}`,
    kind: index === 0 ? "receipt" : "animal_photo",
    imageUrl,
    hash: imageUrl,
  }));
}
