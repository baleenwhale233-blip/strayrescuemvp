import type {
  LocalBudgetAdjustmentSubmission,
  LocalExpenseSubmission,
  LocalStatusSubmission,
} from "./localPresentationCore";

const CASE_TITLE_OVERRIDE_KEY = "case-title-overrides:v1";
const CASE_STATUS_SUBMISSION_KEY = "case-status-submissions";
const CASE_EXPENSE_SUBMISSION_KEY = "case-expense-submissions";
const CASE_BUDGET_ADJUSTMENT_KEY = "case-budget-adjustments";

type SyncStorageAPI = {
  getStorageSync(key: string): unknown;
  setStorageSync(key: string, value: unknown): void;
  removeStorageSync(key: string): void;
};

export type CaseTitleOverrideStore = {
  byCaseId: Record<string, string>;
  byDraftId: Record<string, string>;
  coverByCaseId: Record<string, string>;
  coverByDraftId: Record<string, string>;
};

const memoryStorage = new Map<string, unknown>();

function getStorage(): SyncStorageAPI {
  const wxStorage = (globalThis as { wx?: SyncStorageAPI }).wx;

  if (
    wxStorage &&
    typeof wxStorage.getStorageSync === "function" &&
    typeof wxStorage.setStorageSync === "function" &&
    typeof wxStorage.removeStorageSync === "function"
  ) {
    return wxStorage;
  }

  return {
    getStorageSync(key: string) {
      return memoryStorage.get(key);
    },
    setStorageSync(key: string, value: unknown) {
      memoryStorage.set(key, value);
    },
    removeStorageSync(key: string) {
      memoryStorage.delete(key);
    },
  };
}

function getEmptyStore(): CaseTitleOverrideStore {
  return {
    byCaseId: {},
    byDraftId: {},
    coverByCaseId: {},
    coverByDraftId: {},
  };
}

function getStorageKey(prefix: string, value?: string) {
  return `${prefix}:${value || "unknown-case"}`;
}

function readArrayStorage<T>(key: string) {
  const stored = getStorage().getStorageSync(key);
  return Array.isArray(stored) ? (stored as T[]) : [];
}

export function readCaseTitleOverrideStore(): CaseTitleOverrideStore {
  const stored = getStorage().getStorageSync(CASE_TITLE_OVERRIDE_KEY);
  if (!stored || typeof stored !== "object") {
    return getEmptyStore();
  }

  const candidate = stored as Partial<CaseTitleOverrideStore>;

  return {
    byCaseId:
      candidate.byCaseId && typeof candidate.byCaseId === "object"
        ? candidate.byCaseId
        : {},
    byDraftId:
      candidate.byDraftId && typeof candidate.byDraftId === "object"
        ? candidate.byDraftId
        : {},
    coverByCaseId:
      candidate.coverByCaseId && typeof candidate.coverByCaseId === "object"
        ? candidate.coverByCaseId
        : {},
    coverByDraftId:
      candidate.coverByDraftId && typeof candidate.coverByDraftId === "object"
        ? candidate.coverByDraftId
        : {},
  };
}

export function writeCaseTitleOverrideStore(store: CaseTitleOverrideStore) {
  getStorage().setStorageSync(CASE_TITLE_OVERRIDE_KEY, store);
}

export function getCaseStatusSubmissions(caseId?: string) {
  if (!caseId) {
    return [];
  }

  return readArrayStorage<LocalStatusSubmission>(
    getStorageKey(CASE_STATUS_SUBMISSION_KEY, caseId),
  );
}

export function getCaseExpenseSubmissions(caseId?: string) {
  if (!caseId) {
    return [];
  }

  return readArrayStorage<LocalExpenseSubmission>(
    getStorageKey(CASE_EXPENSE_SUBMISSION_KEY, caseId),
  );
}

export function getCaseBudgetAdjustments(caseId?: string) {
  if (!caseId) {
    return [];
  }

  return readArrayStorage<LocalBudgetAdjustmentSubmission>(
    getStorageKey(CASE_BUDGET_ADJUSTMENT_KEY, caseId),
  );
}

export function prependCaseStatusSubmission(
  caseId: string,
  submission: LocalStatusSubmission,
) {
  const key = getStorageKey(CASE_STATUS_SUBMISSION_KEY, caseId);
  const list = readArrayStorage<LocalStatusSubmission>(key);
  getStorage().setStorageSync(key, [submission, ...list]);
}

export function prependCaseExpenseSubmission(
  caseId: string,
  submission: LocalExpenseSubmission,
) {
  const key = getStorageKey(CASE_EXPENSE_SUBMISSION_KEY, caseId);
  const list = readArrayStorage<LocalExpenseSubmission>(key);
  getStorage().setStorageSync(key, [submission, ...list]);
}

export function prependCaseBudgetAdjustment(
  caseId: string,
  submission: LocalBudgetAdjustmentSubmission,
) {
  const key = getStorageKey(CASE_BUDGET_ADJUSTMENT_KEY, caseId);
  const list = readArrayStorage<LocalBudgetAdjustmentSubmission>(key);
  getStorage().setStorageSync(key, [submission, ...list]);
}

export function clearCaseStatusSubmissionStorage(caseId: string) {
  getStorage().removeStorageSync(getStorageKey(CASE_STATUS_SUBMISSION_KEY, caseId));
}

export function clearCaseExpenseSubmissionStorage(caseId: string) {
  getStorage().removeStorageSync(getStorageKey(CASE_EXPENSE_SUBMISSION_KEY, caseId));
}

export function clearCaseBudgetAdjustmentStorage(caseId: string) {
  getStorage().removeStorageSync(getStorageKey(CASE_BUDGET_ADJUSTMENT_KEY, caseId));
}

export function resetLocalPresentationStorageForTests(caseId?: string) {
  getStorage().removeStorageSync(CASE_TITLE_OVERRIDE_KEY);

  if (caseId) {
    clearCaseStatusSubmissionStorage(caseId);
    clearCaseExpenseSubmissionStorage(caseId);
    clearCaseBudgetAdjustmentStorage(caseId);
  }
}
