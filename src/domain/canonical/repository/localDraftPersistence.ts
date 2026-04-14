import {
  computeEvidenceLevelFromEvidenceItems,
  createCasePublicId,
  recomputeSupportThreads,
} from "../modeling";
import type {
  CanonicalEvidenceItem,
  CanonicalExpenseRecord,
  CanonicalRescuerStats,
  CanonicalSharedEvidenceGroup,
  CanonicalSupportEntry,
  CanonicalSupportThread,
  CaseCurrentStatus,
  CurrencyCode,
  ExpenseCategory,
  HomepageEligibilityStatus,
  RescuerVerifiedLevel,
  SupportEntryStatus,
  SupportUnmatchedReason,
} from "../types";
import { draftStorage } from "./draftStorage";

export type RescueCreateEntryTone = "expense" | "status" | "income" | "budget";

export type RescueCreateTimelineEntry = {
  id: string;
  tone: RescueCreateEntryTone;
  label: string;
  title: string;
  description?: string;
  timestamp: string;
  amount?: number;
  images?: string[];
  budgetPrevious?: number;
  budgetCurrent?: number;
};

export type RescueCreateDraftStatus = "draft" | "published";

export type RescueHomepageEligibility = {
  status: HomepageEligibilityStatus;
  reason: string;
};

export type RescueCreateDraft = {
  id: string;
  publicCaseId?: string;
  name: string;
  summary: string;
  coverPath: string;
  budget: number;
  budgetNote: string;
  species?: "cat" | "dog" | "other";
  currentStatus?: CaseCurrentStatus;
  currentStatusLabel?: string;
  foundLocationText?: string;
  rescuerName?: string;
  rescuerAvatarUrl?: string;
  rescuerWechatId?: string;
  rescuerVerifiedLevel?: RescuerVerifiedLevel;
  rescuerJoinedAt?: string;
  rescuerStats?: CanonicalRescuerStats;
  paymentQrUrl?: string;
  status: RescueCreateDraftStatus;
  timeline: RescueCreateTimelineEntry[];
  sharedEvidenceGroups: CanonicalSharedEvidenceGroup[];
  expenseRecords: CanonicalExpenseRecord[];
  supportThreads: CanonicalSupportThread[];
  supportEntries: CanonicalSupportEntry[];
  homepageEligibility: RescueHomepageEligibility;
  createdAt: string;
  updatedAt: string;
};

type CreateSupportThreadInput = {
  supporterUserId: string;
  supporterNameMasked?: string;
};

type CreateSupportEntryInput = {
  supporterUserId: string;
  supporterNameMasked?: string;
  amount: number;
  supportedAt: string;
  note?: string;
  screenshotImages?: string[];
  status?: SupportEntryStatus;
};

type ConfirmSupportEntryInput = {
  entryId: string;
  confirmedByUserId: string;
};

type MarkSupportEntryUnmatchedInput = {
  entryId: string;
  reason: SupportUnmatchedReason;
  note?: string;
};

type AddExpenseRecordInput = {
  amount: number;
  spentAt: string;
  category: ExpenseCategory;
  summary: string;
  note?: string;
  evidenceItems?: CanonicalEvidenceItem[];
  sharedEvidenceGroupId?: string;
  verificationStatus?: CanonicalExpenseRecord["verificationStatus"];
};

type AddExpenseRecordsBatchInput = {
  records: AddExpenseRecordInput[];
};

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getDraftCaseId(draftId: string) {
  return draftId.replace("custom-project", "case");
}

function getDraftPublicCaseId(draftId: string) {
  return createCasePublicId(getDraftCaseId(draftId));
}

function buildSupportThreadId(caseId: string, supporterUserId: string) {
  return `thread:${caseId}:${supporterUserId}`;
}

function formatLocalTimestamp(isoDateTime: string) {
  const date = new Date(isoDateTime);

  if (Number.isNaN(date.getTime())) {
    return isoDateTime;
  }

  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");

  return `${month}-${day} ${hours}:${minutes}`;
}

export function formatTimelineTimestamp(date = new Date()) {
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");

  return `今天 ${hours}:${minutes}`;
}

function buildDraftHomepageEligibility(
  draft: RescueCreateDraft,
): RescueHomepageEligibility {
  if (draft.status !== "published") {
    return {
      status: "public_but_not_eligible",
      reason: "未公开，暂不进入首页",
    };
  }

  if (!draft.summary.trim()) {
    return {
      status: "missing_update",
      reason: "还缺一条最近更新",
    };
  }

  if (
    !draft.expenseRecords.length ||
    draft.expenseRecords.every((record) => record.evidenceLevel === "needs_attention")
  ) {
    return {
      status: "missing_evidence",
      reason: "基础支出证据待补充",
    };
  }

  return {
    status: "eligible",
    reason: "已满足首页条件",
  };
}

function createLegacyEvidenceItems(images?: string[]) {
  return (images ?? []).map((imageUrl, index) => ({
    id: createId(`evidence-${index}`),
    kind: "receipt" as const,
    imageUrl,
    hash: imageUrl,
  }));
}

function migrateExpenseRecordsFromTimeline(
  draft: Pick<RescueCreateDraft, "id" | "status" | "timeline" | "updatedAt">,
) {
  const caseId = getDraftCaseId(draft.id);

  return draft.timeline
    .filter((entry) => entry.tone === "expense")
    .map((entry, index) => {
      const evidenceItems = createLegacyEvidenceItems(entry.images);

      return {
        id: `expense-record:${caseId}:${index}`,
        caseId,
        amount: Math.max(entry.amount ?? 0, 0),
        currency: "CNY" as CurrencyCode,
        spentAt: draft.updatedAt,
        category: "medical" as ExpenseCategory,
        summary: entry.title,
        note: entry.description,
        evidenceItems,
        evidenceLevel: computeEvidenceLevelFromEvidenceItems(evidenceItems),
        verificationStatus: "manual",
        visibility: draft.status === "published" ? "public" : "draft",
      } satisfies CanonicalExpenseRecord;
    });
}

function migrateSupportEntriesFromTimeline(
  draft: Pick<RescueCreateDraft, "id" | "status" | "timeline" | "updatedAt">,
) {
  const caseId = getDraftCaseId(draft.id);

  return draft.timeline
    .filter((entry) => entry.tone === "income")
    .map((entry, index) => {
      const supporterUserId = `manual-supporter:${index}`;
      const screenshotItems = createLegacyEvidenceItems(entry.images);

      return {
        id: `support-entry:${caseId}:${index}`,
        supportThreadId: buildSupportThreadId(caseId, supporterUserId),
        caseId,
        supporterUserId,
        supporterNameMasked: entry.title || "已登记支持",
        amount: Math.max(entry.amount ?? 0, 0),
        currency: "CNY" as CurrencyCode,
        supportedAt: draft.updatedAt,
        note: entry.description,
        screenshotItems,
        screenshotHashes: screenshotItems.map((item) => item.hash || item.id),
        status: "confirmed" as SupportEntryStatus,
        createdAt: draft.updatedAt,
        updatedAt: draft.updatedAt,
        confirmedAt: draft.updatedAt,
        visibility: draft.status === "published" ? "public" : "draft",
      } satisfies CanonicalSupportEntry;
    });
}

function projectExpenseRecordToTimelineEntry(
  record: CanonicalExpenseRecord,
): RescueCreateTimelineEntry {
  return {
    id: `timeline-${record.id}`,
    tone: "expense",
    label: "支出记录",
    title: record.summary,
    description: record.note || record.merchantName,
    timestamp: formatLocalTimestamp(record.spentAt),
    amount: record.amount,
    images: record.evidenceItems
      .map((item) => item.imageUrl)
      .filter((value): value is string => Boolean(value)),
  };
}

function projectSupportEntryToTimelineEntry(
  entry: CanonicalSupportEntry,
): RescueCreateTimelineEntry {
  const statusLabel =
    entry.status === "confirmed"
      ? "已确认支持"
      : entry.status === "pending"
        ? "待处理支持"
        : "未匹配支持";

  return {
    id: `timeline-${entry.id}`,
    tone: "income",
    label: "场外收入",
    title: entry.supporterNameMasked || statusLabel,
    description: entry.note || statusLabel,
    timestamp: formatLocalTimestamp(entry.supportedAt),
    amount: entry.amount,
    images: entry.screenshotItems
      .map((item) => item.imageUrl)
      .filter((value): value is string => Boolean(value)),
  };
}

function rebuildCompatibilityTimeline(
  draft: RescueCreateDraft,
): RescueCreateTimelineEntry[] {
  const preservedEntries = draft.timeline.filter(
    (entry) => entry.tone !== "expense" && entry.tone !== "income",
  );
  const projectedExpenseEntries = draft.expenseRecords.map(
    projectExpenseRecordToTimelineEntry,
  );
  const projectedSupportEntries = draft.supportEntries.map(
    projectSupportEntryToTimelineEntry,
  );

  return [...projectedExpenseEntries, ...projectedSupportEntries, ...preservedEntries];
}

function applyDraftDefaults(draft: RescueCreateDraft): RescueCreateDraft {
  const expenseRecords =
    draft.expenseRecords?.length > 0
      ? draft.expenseRecords
      : migrateExpenseRecordsFromTimeline(draft);
  const supportEntries =
    draft.supportEntries?.length > 0
      ? draft.supportEntries
      : migrateSupportEntriesFromTimeline(draft);
  const nextDraft: RescueCreateDraft = {
    ...draft,
    publicCaseId: draft.publicCaseId || getDraftPublicCaseId(draft.id),
    sharedEvidenceGroups: draft.sharedEvidenceGroups ?? [],
    expenseRecords,
    supportEntries,
    supportThreads:
      draft.supportThreads?.length > 0
        ? recomputeSupportThreads(supportEntries)
        : recomputeSupportThreads(supportEntries),
    homepageEligibility: draft.homepageEligibility || {
      status: "public_but_not_eligible",
      reason: "未公开，暂不进入首页",
    },
  };

  nextDraft.homepageEligibility = buildDraftHomepageEligibility(nextDraft);
  nextDraft.timeline = rebuildCompatibilityTimeline(nextDraft);

  return nextDraft;
}

function setDraftAndRefreshCaches(draft: RescueCreateDraft) {
  const nextDraft = applyDraftDefaults({
    ...draft,
    updatedAt: nowIso(),
  });

  draftStorage.setCurrent(nextDraft);
  return nextDraft;
}

function getSupportThreadOrThrow(
  draft: RescueCreateDraft,
  supporterUserId: string,
  supporterNameMasked?: string,
) {
  const caseId = getDraftCaseId(draft.id);
  const threadId = buildSupportThreadId(caseId, supporterUserId);
  const existingThread = draft.supportThreads.find((thread) => thread.id === threadId);

  if (existingThread) {
    return existingThread;
  }

  return {
    id: threadId,
    caseId,
    supporterUserId,
    supporterNameMasked,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    totalConfirmedAmount: 0,
    totalPendingAmount: 0,
    totalUnmatchedAmount: 0,
    pendingCount: 0,
    unmatchedCount: 0,
  } satisfies CanonicalSupportThread;
}

function hasDuplicateScreenshotInThread(
  draft: RescueCreateDraft,
  supportThreadId: string,
  screenshotHashes: string[],
) {
  if (!screenshotHashes.length) {
    return false;
  }

  const existingHashes = new Set(
    draft.supportEntries
      .filter((entry) => entry.supportThreadId === supportThreadId)
      .flatMap((entry) => entry.screenshotHashes),
  );

  return screenshotHashes.some((hash) => existingHashes.has(hash));
}

function getEntryCountForWindow(
  draft: RescueCreateDraft,
  supportThreadId: string,
  sinceMs: number,
) {
  const now = Date.now();

  return draft.supportEntries.filter((entry) => {
    if (entry.supportThreadId !== supportThreadId) {
      return false;
    }

    const supportedAt = Date.parse(entry.supportedAt);

    return Number.isFinite(supportedAt) && now - supportedAt <= sinceMs;
  }).length;
}

export function createInitialDraft(): RescueCreateDraft {
  const timestamp = nowIso();
  const id = createId("custom-project");

  return applyDraftDefaults({
    id,
    publicCaseId: getDraftPublicCaseId(id),
    name: "",
    summary: "",
    coverPath: "",
    budget: 0,
    budgetNote: "",
    status: "draft",
    timeline: [
      {
        id: createId("entry"),
        tone: "status",
        label: "状态更新",
        title: "已创建基础档案，等待补充第一条进展",
        description:
          "完成封面、代号和事件简述后，就可以继续设定预算并进入救助页预览。",
        timestamp: formatTimelineTimestamp(),
      },
    ],
    sharedEvidenceGroups: [],
    expenseRecords: [],
    supportThreads: [],
    supportEntries: [],
    homepageEligibility: {
      status: "public_but_not_eligible",
      reason: "未公开，暂不进入首页",
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

export function startNewDraftSession() {
  const draft = createInitialDraft();
  draftStorage.setCurrent(draft);
  return draft;
}

export function getCurrentDraftSession() {
  const draft = draftStorage.getCurrent();
  return draft ? applyDraftDefaults(draft) : undefined;
}

export function setCurrentDraftSession(draft: RescueCreateDraft) {
  return setDraftAndRefreshCaches(draft);
}

export function patchCurrentDraftSession(
  patch: Partial<RescueCreateDraft>,
) {
  const current = getCurrentDraftSession() ?? startNewDraftSession();

  return setCurrentDraftSession({
    ...current,
    ...patch,
  });
}

export function clearCurrentDraftSession() {
  draftStorage.clearCurrent();
}

export function getSavedDrafts() {
  return draftStorage.getSavedList().map(applyDraftDefaults);
}

export function getSavedDraftById(id?: string) {
  if (!id) {
    return undefined;
  }

  return getSavedDrafts().find((draft) => draft.id === id);
}

export function upsertSavedDraft(draft: RescueCreateDraft) {
  const drafts = [...getSavedDrafts()];
  const nextDraft = applyDraftDefaults({
    ...draft,
    updatedAt: nowIso(),
  });
  const index = drafts.findIndex((item) => item.id === draft.id);

  if (index >= 0) {
    drafts[index] = nextDraft;
  } else {
    drafts.unshift(nextDraft);
  }

  draftStorage.setSavedList(drafts);
  return nextDraft;
}

export function saveCurrentDraft(status: RescueCreateDraftStatus) {
  const current = getCurrentDraftSession() ?? startNewDraftSession();
  const saved = upsertSavedDraft({
    ...current,
    status,
  });

  setCurrentDraftSession(saved);
  return saved;
}

export function appendEntryToDraft(
  draft: RescueCreateDraft,
  entry: RescueCreateTimelineEntry,
) {
  const normalizedDraft = applyDraftDefaults(draft);

  if (entry.tone === "expense") {
    return addExpenseRecordToDraft(normalizedDraft, {
      amount: entry.amount ?? 0,
      spentAt: nowIso(),
      category: "medical",
      summary: entry.title,
      note: entry.description,
      evidenceItems: createLegacyEvidenceItems(entry.images),
      verificationStatus: "manual",
    });
  }

  if (entry.tone === "income") {
    return createSupportEntryOnDraft(normalizedDraft, {
      supporterUserId: `manual-supporter:${Date.now()}`,
      supporterNameMasked: entry.title || "救助人手动补录",
      amount: entry.amount ?? 0,
      supportedAt: nowIso(),
      note: entry.description,
      screenshotImages: entry.images,
      status: "confirmed",
    }).draft;
  }

  return setCurrentDraftSession({
    ...normalizedDraft,
    timeline: [entry, ...normalizedDraft.timeline],
  });
}

export function replaceDraftById(draft: RescueCreateDraft) {
  return setCurrentDraftSession(draft);
}

export function createOrGetSupportThreadOnDraft(
  draft: RescueCreateDraft,
  input: CreateSupportThreadInput,
) {
  const normalizedDraft = applyDraftDefaults(draft);
  const existing = normalizedDraft.supportThreads.find(
    (thread) => thread.supporterUserId === input.supporterUserId,
  );

  if (existing) {
    return {
      draft: normalizedDraft,
      thread: existing,
    };
  }

  const thread = getSupportThreadOrThrow(
    normalizedDraft,
    input.supporterUserId,
    input.supporterNameMasked,
  );
  const nextDraft = setCurrentDraftSession({
    ...normalizedDraft,
    supportThreads: [...normalizedDraft.supportThreads, thread],
  });

  return {
    draft: nextDraft,
    thread,
  };
}

export function createSupportEntryOnDraft(
  draft: RescueCreateDraft,
  input: CreateSupportEntryInput,
) {
  const normalizedDraft = applyDraftDefaults(draft);
  const { thread } = createOrGetSupportThreadOnDraft(normalizedDraft, {
    supporterUserId: input.supporterUserId,
    supporterNameMasked: input.supporterNameMasked,
  });
  const screenshotItems = (input.screenshotImages ?? []).map((imageUrl, index) => ({
    id: createId(`support-screenshot-${index}`),
    kind: "payment_screenshot" as const,
    imageUrl,
    hash: imageUrl,
  }));
  const screenshotHashes = screenshotItems.map((item) => item.hash || item.id);

  if (hasDuplicateScreenshotInThread(normalizedDraft, thread.id, screenshotHashes)) {
    throw new Error("DUPLICATE_SUPPORT_SCREENSHOT");
  }

  if (getEntryCountForWindow(normalizedDraft, thread.id, 10 * 60 * 1000) >= 1) {
    throw new Error("SUPPORT_ENTRY_RATE_LIMIT_10_MIN");
  }

  if (getEntryCountForWindow(normalizedDraft, thread.id, 24 * 60 * 60 * 1000) >= 3) {
    throw new Error("SUPPORT_ENTRY_RATE_LIMIT_24_HOUR");
  }

  const entry: CanonicalSupportEntry = {
    id: createId("support-entry"),
    supportThreadId: thread.id,
    caseId: getDraftCaseId(normalizedDraft.id),
    supporterUserId: input.supporterUserId,
    supporterNameMasked: input.supporterNameMasked,
    amount: input.amount,
    currency: "CNY" as CurrencyCode,
    supportedAt: input.supportedAt,
    note: input.note,
    screenshotItems,
    screenshotHashes,
    status: input.status ?? "pending",
    createdAt: nowIso(),
    updatedAt: nowIso(),
    confirmedAt: input.status === "confirmed" ? nowIso() : undefined,
    visibility: normalizedDraft.status === "published" ? "private" : "draft",
  };
  const nextDraft = setCurrentDraftSession({
    ...normalizedDraft,
    supportEntries: [entry, ...normalizedDraft.supportEntries],
    supportThreads: recomputeSupportThreads([entry, ...normalizedDraft.supportEntries]),
  });

  return {
    draft: nextDraft,
    thread: nextDraft.supportThreads.find((item) => item.id === thread.id)!,
    entry,
  };
}

export function confirmSupportEntryOnDraft(
  draft: RescueCreateDraft,
  input: ConfirmSupportEntryInput,
) {
  const normalizedDraft = applyDraftDefaults(draft);
  const nextEntries = normalizedDraft.supportEntries.map((entry) =>
    entry.id === input.entryId
      ? {
          ...entry,
          status: "confirmed" as SupportEntryStatus,
          unmatchedReason: undefined,
          unmatchedNote: undefined,
          confirmedAt: nowIso(),
          confirmedByUserId: input.confirmedByUserId,
          updatedAt: nowIso(),
        }
      : entry,
  );

  return setCurrentDraftSession({
    ...normalizedDraft,
    supportEntries: nextEntries,
    supportThreads: recomputeSupportThreads(nextEntries),
  });
}

export function markSupportEntryUnmatchedOnDraft(
  draft: RescueCreateDraft,
  input: MarkSupportEntryUnmatchedInput,
) {
  const normalizedDraft = applyDraftDefaults(draft);
  const nextEntries = normalizedDraft.supportEntries.map((entry) =>
    entry.id === input.entryId
      ? {
          ...entry,
          status: "unmatched" as SupportEntryStatus,
          unmatchedReason: input.reason,
          unmatchedNote: input.note,
          confirmedAt: undefined,
          confirmedByUserId: undefined,
          updatedAt: nowIso(),
        }
      : entry,
  );

  return setCurrentDraftSession({
    ...normalizedDraft,
    supportEntries: nextEntries,
    supportThreads: recomputeSupportThreads(nextEntries),
  });
}

export function addExpenseRecordToDraft(
  draft: RescueCreateDraft,
  input: AddExpenseRecordInput,
) {
  const normalizedDraft = applyDraftDefaults(draft);
  const evidenceItems = input.evidenceItems ?? [];
  const record: CanonicalExpenseRecord = {
    id: createId("expense-record"),
    caseId: getDraftCaseId(normalizedDraft.id),
    amount: input.amount,
    currency: "CNY" as CurrencyCode,
    spentAt: input.spentAt,
    category: input.category,
    summary: input.summary,
    note: input.note,
    evidenceItems,
    sharedEvidenceGroupId: input.sharedEvidenceGroupId,
    evidenceLevel: computeEvidenceLevelFromEvidenceItems(evidenceItems),
    verificationStatus: input.verificationStatus ?? "manual",
    visibility: normalizedDraft.status === "published" ? "public" : "draft",
  };
  const nextDraft = setCurrentDraftSession({
    ...normalizedDraft,
    expenseRecords: [record, ...normalizedDraft.expenseRecords],
  });

  return {
    draft: nextDraft,
    record,
  };
}

export function addExpenseRecordsBatchToDraft(
  draft: RescueCreateDraft,
  input: AddExpenseRecordsBatchInput,
) {
  return input.records.reduce(
    (state, recordInput) => addExpenseRecordToDraft(state.draft, recordInput),
    {
      draft: applyDraftDefaults(draft),
      record: undefined as CanonicalExpenseRecord | undefined,
    },
  ).draft;
}

export function calculateDraftLedger(draft: RescueCreateDraft) {
  const normalizedDraft = applyDraftDefaults(draft);
  const expense = normalizedDraft.expenseRecords
    .filter(
      (record) =>
        record.verificationStatus === "confirmed" ||
        record.verificationStatus === "manual",
    )
    .reduce((sum, record) => sum + Math.max(record.amount, 0), 0);
  const income = normalizedDraft.supportEntries
    .filter((entry) => entry.status === "confirmed")
    .reduce((sum, entry) => sum + Math.max(entry.amount, 0), 0);
  const balance = Math.max(income - expense, 0);
  const pending = Math.max(normalizedDraft.budget - Math.max(income, expense), 0);

  return {
    expense,
    income,
    balance,
    pending,
    progress:
      normalizedDraft.budget > 0
        ? Math.min(Math.round((income / normalizedDraft.budget) * 100), 100)
        : 0,
  };
}
