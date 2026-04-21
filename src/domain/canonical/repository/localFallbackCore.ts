import type {
  LocalBudgetAdjustmentSubmission,
  LocalExpenseSubmission,
  LocalStatusSubmission,
} from "./localPresentationCore";

export type ProfileFallbackDeps = {
  saveCaseTitleOverride(input: {
    title: string;
    caseId?: string;
    draftId?: string;
  }): void;
  saveCaseCoverOverride(input: {
    coverPath: string;
    caseId?: string;
    draftId?: string;
  }): void;
  clearCaseTitleOverride(caseId?: string, draftId?: string): void;
  clearCaseCoverOverride(caseId?: string, draftId?: string): void;
};

export type ContentFallbackDeps = {
  saveCaseBudgetAdjustment(caseId: string | undefined, submission: LocalBudgetAdjustmentSubmission): void;
  saveCaseExpenseSubmission(caseId: string | undefined, submission: LocalExpenseSubmission): void;
  saveCaseStatusSubmission(caseId: string | undefined, submission: LocalStatusSubmission): void;
  clearCaseBudgetAdjustments(caseId?: string): void;
  clearCaseExpenseSubmissions(caseId?: string): void;
  clearCaseStatusSubmissions(caseId?: string): void;
};

export function recordCaseProfileLocalFallback(
  input: {
    caseId?: string;
    draftId?: string;
    title?: string;
    coverPath?: string;
  },
  deps: ProfileFallbackDeps,
) {
  if (input.title) {
    deps.saveCaseTitleOverride({
      title: input.title,
      caseId: input.caseId,
      draftId: input.draftId,
    });
  }

  if (input.coverPath) {
    deps.saveCaseCoverOverride({
      coverPath: input.coverPath,
      caseId: input.caseId,
      draftId: input.draftId,
    });
  }
}

export function clearCaseProfileLocalFallback(
  input: {
    caseId?: string;
    draftId?: string;
    clearTitle?: boolean;
    clearCover?: boolean;
  },
  deps: ProfileFallbackDeps,
) {
  if (input.clearTitle) {
    deps.clearCaseTitleOverride(input.caseId, input.draftId);
  }

  if (input.clearCover) {
    deps.clearCaseCoverOverride(input.caseId, input.draftId);
  }
}

type ContentFallbackInput =
  | {
      caseId?: string;
      kind: "budget";
      submission: LocalBudgetAdjustmentSubmission;
    }
  | {
      caseId?: string;
      kind: "expense";
      submission: LocalExpenseSubmission;
    }
  | {
      caseId?: string;
      kind: "status";
      submission: LocalStatusSubmission;
    };

export function recordCaseContentWriteLocalFallback(
  input: ContentFallbackInput,
  deps: ContentFallbackDeps,
) {
  if (input.kind === "budget") {
    deps.saveCaseBudgetAdjustment(input.caseId, input.submission);
    return;
  }

  if (input.kind === "expense") {
    deps.saveCaseExpenseSubmission(input.caseId, input.submission);
    return;
  }

  deps.saveCaseStatusSubmission(input.caseId, input.submission);
}

export function clearCaseContentWriteLocalFallback(
  input: {
    caseId?: string;
    kind: "budget" | "expense" | "status";
  },
  deps: ContentFallbackDeps,
) {
  if (input.kind === "budget") {
    deps.clearCaseBudgetAdjustments(input.caseId);
    return;
  }

  if (input.kind === "expense") {
    deps.clearCaseExpenseSubmissions(input.caseId);
    return;
  }

  deps.clearCaseStatusSubmissions(input.caseId);
}
