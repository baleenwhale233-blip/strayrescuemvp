import { getStructuredExpenseRecords } from "../modeling";
import type {
  CanonicalAsset,
  CanonicalCaseBundle,
  CanonicalEvidenceItem,
  CanonicalEvent,
  CanonicalExpenseRecord,
  CaseCurrentStatus,
  HomepageCaseCardVM,
  PublicDetailVM,
  WorkbenchCaseCardVM,
} from "../types";
import type { OwnerDetailVM } from "./canonicalReadRepositoryCore";
import { caseIdToDraftId } from "./localRepositoryCore";
import { getDraftByCaseId, getDraftById, type RescueCreateDraft } from "./draftRepository";
import { clearCasePresentationOverrides } from "./localPresentationCore";

const CASE_TITLE_OVERRIDE_KEY = "case-title-overrides:v1";
const CASE_STATUS_SUBMISSION_KEY = "case-status-submissions";
const CASE_EXPENSE_SUBMISSION_KEY = "case-expense-submissions";
const CASE_BUDGET_ADJUSTMENT_KEY = "case-budget-adjustments";

type CaseTitleOverrideStore = {
  byCaseId: Record<string, string>;
  byDraftId: Record<string, string>;
  coverByCaseId: Record<string, string>;
  coverByDraftId: Record<string, string>;
};

export type LocalStatusSubmission = {
  id: string;
  statusLabel: string;
  description: string;
  timestampLabel: string;
  assetUrls: string[];
  createdAt: string;
};

export type LocalExpenseSubmission = {
  id: string;
  title: string;
  amount: number;
  timestampLabel: string;
  assetUrls: string[];
  createdAt: string;
};

export type LocalBudgetAdjustmentSubmission = {
  id: string;
  previousTargetAmount: number;
  currentTargetAmount: number;
  reason: string;
  timestampLabel: string;
  createdAt: string;
};

type CasePresentationInput = {
  caseId?: string;
  draftId?: string;
  fallback?: string;
  draftValue?: string;
};

type LocalPresentationOptions = {
  applyLocalOverlays?: boolean;
};

type SyncStorageAPI = {
  getStorageSync(key: string): unknown;
  setStorageSync(key: string, value: unknown): void;
  removeStorageSync(key: string): void;
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

function formatCurrency(amount: number) {
  return `¥${amount.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function readStore(): CaseTitleOverrideStore {
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

function writeStore(store: CaseTitleOverrideStore) {
  getStorage().setStorageSync(CASE_TITLE_OVERRIDE_KEY, store);
}

function getCaseTitleOverride(input: {
  caseId?: string;
  draftId?: string;
}) {
  const store = readStore();

  return (
    (input.draftId ? store.byDraftId[input.draftId] : undefined) ||
    (input.caseId ? store.byCaseId[input.caseId] : undefined)
  );
}

function getCaseCoverOverride(input: {
  caseId?: string;
  draftId?: string;
}) {
  const store = readStore();

  return (
    (input.draftId ? store.coverByDraftId[input.draftId] : undefined) ||
    (input.caseId ? store.coverByCaseId[input.caseId] : undefined)
  );
}

function getCaseStatusSubmissions(caseId?: string) {
  if (!caseId) {
    return [];
  }

  return readArrayStorage<LocalStatusSubmission>(
    getStorageKey(CASE_STATUS_SUBMISSION_KEY, caseId),
  );
}

function getCaseExpenseSubmissions(caseId?: string) {
  if (!caseId) {
    return [];
  }

  return readArrayStorage<LocalExpenseSubmission>(
    getStorageKey(CASE_EXPENSE_SUBMISSION_KEY, caseId),
  );
}

function getCaseBudgetAdjustments(caseId?: string) {
  if (!caseId) {
    return [];
  }

  return readArrayStorage<LocalBudgetAdjustmentSubmission>(
    getStorageKey(CASE_BUDGET_ADJUSTMENT_KEY, caseId),
  );
}

function getSavedDraftPresentation(input: { caseId?: string; draftId?: string }) {
  return (
    (input.caseId ? getDraftByCaseId(input.caseId) : undefined) ||
    (input.draftId ? getDraftById(input.draftId) : undefined)
  );
}

function resolvePresentedValue(input: CasePresentationInput & { readOverride: (input: {
  caseId?: string;
  draftId?: string;
}) => string | undefined }) {
  return (
    input.readOverride({ caseId: input.caseId, draftId: input.draftId }) ||
    input.draftValue ||
    input.fallback
  );
}

function getOverlayDraftId(bundle: CanonicalCaseBundle) {
  return bundle.sourceKind === "local" ? caseIdToDraftId(bundle.case.id) : undefined;
}

function createOverlayAssetId(caseId: string, kind: string, itemId: string, index?: number) {
  return index === undefined
    ? `overlay:${caseId}:${kind}:${itemId}`
    : `overlay:${caseId}:${kind}:${itemId}:${index}`;
}

function createOverlayEventId(caseId: string, kind: string, itemId: string) {
  return `overlay:${caseId}:${kind}:${itemId}`;
}

function cloneOverlayAsset(input: {
  caseId: string;
  itemId: string;
  kind: CanonicalAsset["kind"];
  url: string;
  index?: number;
}) {
  return {
    id: createOverlayAssetId(input.caseId, input.kind, input.itemId, input.index),
    kind: input.kind,
    originalUrl: input.url,
    watermarkedUrl: input.url,
    thumbnailUrl: input.url,
  } satisfies CanonicalAsset;
}

function inferCaseCurrentStatus(label?: string): CaseCurrentStatus | undefined {
  switch (label) {
    case "草稿中":
      return "draft";
    case "紧急送医":
      return "newly_found";
    case "医疗处理中":
    case "医疗救助中":
      return "medical";
    case "康复观察":
      return "recovery";
    case "寻找领养":
      return "rehoming";
    case "已完成":
      return "completed";
    case "遗憾离世":
      return "closed";
    default:
      return undefined;
  }
}

function getOverlayVisibility(bundle: CanonicalCaseBundle): CanonicalEvent["visibility"] {
  return bundle.case.visibility === "published" ? "public" : "draft";
}

function getLatestStatusSubmission(caseId?: string) {
  return getCaseStatusSubmissions(caseId)[0];
}

function replaceTimelineLabels(
  timeline: PublicDetailVM["timeline"],
  caseId?: string,
): PublicDetailVM["timeline"] {
  if (!caseId) {
    return timeline;
  }

  const expenseMap = new Map(
    getCaseExpenseSubmissions(caseId).map((submission) => [
      createOverlayEventId(caseId, "expense", submission.id),
      submission,
    ]),
  );
  const statusMap = new Map(
    getCaseStatusSubmissions(caseId).map((submission) => [
      createOverlayEventId(caseId, "status", submission.id),
      submission,
    ]),
  );
  const budgetMap = new Map(
    getCaseBudgetAdjustments(caseId).map((submission) => [
      createOverlayEventId(caseId, "budget", submission.id),
      submission,
    ]),
  );

  const rewrittenBaseTimeline = timeline
    .filter((item) => !item.id.startsWith(`overlay:${caseId}:expense:`))
    .filter((item) => !item.id.startsWith(`overlay:${caseId}:status:`))
    .filter((item) => !item.id.startsWith(`overlay:${caseId}:budget:`));

  const localExpenseItems = getCaseExpenseSubmissions(caseId).map((submission) => ({
    id: createOverlayEventId(caseId, "expense", submission.id),
    type: "expense" as const,
    label: "支出记录",
    tone: "urgent" as const,
    title: submission.title,
    amountLabel: `- ${formatCurrency(submission.amount)}`,
    timestampLabel: submission.timestampLabel,
    assetUrls: submission.assetUrls.slice(0, 9),
    verificationStatus: "manual" as const,
  }));

  const localStatusItems = getCaseStatusSubmissions(caseId).map((submission) => ({
    id: createOverlayEventId(caseId, "status", submission.id),
    type: "progress_update" as const,
    label: "状态更新",
    tone: "progress" as const,
    title: submission.description,
    timestampLabel: submission.timestampLabel,
    assetUrls: submission.assetUrls.slice(0, 9),
  }));

  const localBudgetItems = getCaseBudgetAdjustments(caseId).map((submission) => ({
    id: createOverlayEventId(caseId, "budget", submission.id),
    type: "budget_adjustment" as const,
    label: "预算调整",
    tone: "active" as const,
    title: `预算从 ${formatCurrency(submission.previousTargetAmount)} 调整到 ${formatCurrency(
      submission.currentTargetAmount,
    )}`,
    description: submission.reason,
    timestampLabel: submission.timestampLabel,
    assetUrls: [],
  }));

  return [
    ...localBudgetItems,
    ...localStatusItems,
    ...localExpenseItems,
    ...rewrittenBaseTimeline.map((item) => {
      const localExpense = expenseMap.get(item.id);
      if (localExpense) {
        return {
          ...item,
          title: localExpense.title,
          amountLabel: `- ${formatCurrency(localExpense.amount)}`,
          timestampLabel: localExpense.timestampLabel,
          assetUrls: localExpense.assetUrls.slice(0, 9),
          verificationStatus: "manual" as const,
        };
      }

      const localStatus = statusMap.get(item.id);
      if (localStatus) {
        return {
          ...item,
          label: "状态更新",
          title: localStatus.description,
          timestampLabel: localStatus.timestampLabel,
          assetUrls: localStatus.assetUrls.slice(0, 9),
        };
      }

      const localBudget = budgetMap.get(item.id);
      if (localBudget) {
        return {
          ...item,
          title: `预算从 ${formatCurrency(
            localBudget.previousTargetAmount,
          )} 调整到 ${formatCurrency(localBudget.currentTargetAmount)}`,
          description: localBudget.reason,
          timestampLabel: localBudget.timestampLabel,
        };
      }

      return item;
    }),
  ];
}

export function saveCaseTitleOverride(input: {
  title: string;
  caseId?: string;
  draftId?: string;
}) {
  const title = input.title.trim();
  if (!title) {
    return;
  }

  const store = readStore();

  if (input.caseId) {
    store.byCaseId[input.caseId] = title;
  }

  if (input.draftId) {
    store.byDraftId[input.draftId] = title;
  }

  writeStore(store);
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

  const store = readStore();

  if (input.caseId) {
    store.coverByCaseId[input.caseId] = coverPath;
  }

  if (input.draftId) {
    store.coverByDraftId[input.draftId] = coverPath;
  }

  writeStore(store);
}

export function clearCaseTitleOverride(caseId?: string) {
  if (!caseId) {
    return;
  }

  const store = readStore();
  writeStore(
    clearCasePresentationOverrides({
      ...store,
      caseId,
    }, {
      clearTitle: true,
    }),
  );
}

export function clearCaseCoverOverride(caseId?: string) {
  if (!caseId) {
    return;
  }

  const store = readStore();
  writeStore(
    clearCasePresentationOverrides({
      ...store,
      caseId,
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

  const key = getStorageKey(CASE_STATUS_SUBMISSION_KEY, caseId);
  const list = readArrayStorage<LocalStatusSubmission>(key);
  getStorage().setStorageSync(key, [submission, ...list]);
}

export function clearCaseStatusSubmissions(caseId?: string) {
  if (!caseId) {
    return;
  }

  getStorage().removeStorageSync(getStorageKey(CASE_STATUS_SUBMISSION_KEY, caseId));
}

export function saveCaseExpenseSubmission(
  caseId: string | undefined,
  submission: LocalExpenseSubmission,
) {
  if (!caseId) {
    return;
  }

  const key = getStorageKey(CASE_EXPENSE_SUBMISSION_KEY, caseId);
  const list = readArrayStorage<LocalExpenseSubmission>(key);
  getStorage().setStorageSync(key, [submission, ...list]);
}

export function clearCaseExpenseSubmissions(caseId?: string) {
  if (!caseId) {
    return;
  }

  getStorage().removeStorageSync(getStorageKey(CASE_EXPENSE_SUBMISSION_KEY, caseId));
}

export function saveCaseBudgetAdjustment(
  caseId: string | undefined,
  submission: LocalBudgetAdjustmentSubmission,
) {
  if (!caseId) {
    return;
  }

  const key = getStorageKey(CASE_BUDGET_ADJUSTMENT_KEY, caseId);
  const list = readArrayStorage<LocalBudgetAdjustmentSubmission>(key);
  getStorage().setStorageSync(key, [submission, ...list]);
}

export function clearCaseBudgetAdjustments(caseId?: string) {
  if (!caseId) {
    return;
  }

  getStorage().removeStorageSync(getStorageKey(CASE_BUDGET_ADJUSTMENT_KEY, caseId));
}

export function resetLocalPresentationStorageForTests(caseId?: string) {
  getStorage().removeStorageSync(CASE_TITLE_OVERRIDE_KEY);

  if (caseId) {
    getStorage().removeStorageSync(getStorageKey(CASE_STATUS_SUBMISSION_KEY, caseId));
    getStorage().removeStorageSync(getStorageKey(CASE_EXPENSE_SUBMISSION_KEY, caseId));
    getStorage().removeStorageSync(getStorageKey(CASE_BUDGET_ADJUSTMENT_KEY, caseId));
  }
}

export function buildExpenseEvidenceItems(imageUrls: string[]): CanonicalEvidenceItem[] {
  return imageUrls.map((imageUrl, index) => ({
    id: `expense-evidence-${Date.now()}-${index}`,
    kind: index === 0 ? "receipt" : "animal_photo",
    imageUrl,
    hash: imageUrl,
  }));
}

export function resolvePresentedTitle(input: CasePresentationInput) {
  return resolvePresentedValue({
    ...input,
    readOverride: getCaseTitleOverride,
  });
}

export function resolvePresentedCover(input: CasePresentationInput) {
  return resolvePresentedValue({
    ...input,
    readOverride: getCaseCoverOverride,
  });
}

export function resolvePresentedDraft(
  draft: RescueCreateDraft | undefined,
  caseId?: string,
  options: LocalPresentationOptions = {},
): RescueCreateDraft | undefined {
  if (!draft) {
    return draft;
  }

  if (options.applyLocalOverlays === false) {
    return draft;
  }

  return {
    ...draft,
    name:
      resolvePresentedTitle({
        caseId,
        draftId: draft.id,
        fallback: draft.name,
        draftValue: draft.name,
      }) || draft.name,
    coverPath:
      resolvePresentedCover({
        caseId,
        draftId: draft.id,
        fallback: draft.coverPath,
        draftValue: draft.coverPath,
      }) || draft.coverPath,
  };
}

export function resolveBundlePresentation(
  bundle: CanonicalCaseBundle,
  options: LocalPresentationOptions = {},
) {
  if (options.applyLocalOverlays === false) {
    return bundle;
  }

  const caseId = bundle.case.id;
  const draftId = getOverlayDraftId(bundle);
  const savedDraft = getSavedDraftPresentation({ caseId, draftId });
  const latestStatus = getLatestStatusSubmission(caseId);
  const expenseSubmissions = getCaseExpenseSubmissions(caseId);
  const budgetAdjustments = getCaseBudgetAdjustments(caseId);
  const title =
    resolvePresentedTitle({
      caseId,
      draftId,
      fallback: bundle.case.animalName,
      draftValue: savedDraft?.name,
    }) || bundle.case.animalName;
  const coverPath = resolvePresentedCover({
    caseId,
    draftId,
    draftValue: savedDraft?.coverPath,
  });
  const assets = [...bundle.assets];
  const events = [...bundle.events];
  const caseRecord = {
    ...bundle.case,
    animalName: title,
  };
  let expenseRecords: CanonicalExpenseRecord[] | undefined = bundle.expenseRecords
    ? [...bundle.expenseRecords]
    : undefined;

  if (coverPath) {
    const coverAsset = cloneOverlayAsset({
      caseId,
      itemId: "cover",
      kind: "case_cover",
      url: coverPath,
    });
    assets.unshift(coverAsset);
    caseRecord.coverAssetId = coverAsset.id;
  }

  if (savedDraft?.currentStatus && !latestStatus) {
    caseRecord.currentStatus = savedDraft.currentStatus;
    caseRecord.currentStatusLabel =
      savedDraft.currentStatusLabel || caseRecord.currentStatusLabel;
  }

  if (latestStatus) {
    const overlayVisibility = getOverlayVisibility(bundle);
    const assetIds = latestStatus.assetUrls
      .slice(0, 9)
      .map((url, index) => {
        const asset = cloneOverlayAsset({
          caseId,
          itemId: latestStatus.id,
          kind: "progress_photo",
          url,
          index,
        });
        assets.unshift(asset);
        return asset.id;
      });

    events.unshift({
      id: createOverlayEventId(caseId, "status", latestStatus.id),
      caseId,
      type: "progress_update",
      occurredAt: latestStatus.createdAt,
      text: latestStatus.description,
      statusLabel: latestStatus.statusLabel,
      assetIds,
      visibility: overlayVisibility,
    });

    caseRecord.currentStatus =
      inferCaseCurrentStatus(latestStatus.statusLabel) ||
      savedDraft?.currentStatus ||
      caseRecord.currentStatus;
    caseRecord.currentStatusLabel = latestStatus.statusLabel;
    caseRecord.updatedAt = latestStatus.createdAt;
  }

  if (budgetAdjustments.length) {
    caseRecord.targetAmount = budgetAdjustments[0].currentTargetAmount;
  }

  if (expenseSubmissions.length) {
    const baseExpenseRecords = getStructuredExpenseRecords(bundle);
    const overlayVisibility = getOverlayVisibility(bundle);
    const localRecords = expenseSubmissions.map((submission) => {
      const evidenceItems = submission.assetUrls
        .slice(0, 9)
        .map((url, index) => {
          const asset = cloneOverlayAsset({
            caseId,
            itemId: submission.id,
            kind: index === 0 ? "receipt" : "progress_photo",
            url,
            index,
          });
          assets.unshift(asset);
          return {
            id: createOverlayAssetId(caseId, "expense-evidence", submission.id, index),
            kind: index === 0 ? "receipt" : "animal_photo",
            assetId: asset.id,
            imageUrl: url,
            hash: url,
          } satisfies CanonicalEvidenceItem;
        });

      return {
        id: `overlay-expense-record:${caseId}:${submission.id}`,
        caseId,
        amount: submission.amount,
        currency: "CNY",
        spentAt: submission.createdAt,
        category: "medical" as const,
        summary: submission.title,
        evidenceItems,
        evidenceLevel: evidenceItems.length ? "basic" as const : "needs_attention" as const,
        verificationStatus: "manual" as const,
        visibility: overlayVisibility,
        projectedEventId: createOverlayEventId(caseId, "expense", submission.id),
      } satisfies CanonicalExpenseRecord;
    });

    expenseRecords = [...localRecords, ...baseExpenseRecords];
  }

  return {
    ...bundle,
    case: caseRecord,
    assets,
    events,
    expenseRecords,
  } satisfies CanonicalCaseBundle;
}

export function finalizePublicDetailPresentation(
  detail: PublicDetailVM | undefined,
  input?: { caseId?: string } & LocalPresentationOptions,
): PublicDetailVM | undefined {
  if (!detail) {
    return detail;
  }

  if (input?.applyLocalOverlays === false) {
    return detail;
  }

  const latestStatus = getLatestStatusSubmission(input?.caseId || detail.caseId);

  return {
    ...detail,
    updatedAtLabel: latestStatus?.timestampLabel || detail.updatedAtLabel,
    latestTimelineSummary:
      latestStatus?.description || detail.latestTimelineSummary,
    timeline: replaceTimelineLabels(detail.timeline, input?.caseId || detail.caseId),
  };
}

export function finalizeOwnerDetailPresentation(
  detail: OwnerDetailVM | undefined,
  options: LocalPresentationOptions = {},
): OwnerDetailVM | undefined {
  if (!detail) {
    return detail;
  }

  if (options.applyLocalOverlays === false) {
    return detail;
  }

  return {
    ...detail,
    state: detail.statusLabel,
    timeline: replaceTimelineLabels(detail.timeline, detail.caseId),
  };
}

export function finalizeHomepageCaseCardPresentation(
  card: HomepageCaseCardVM,
  input: { caseId?: string } & LocalPresentationOptions,
): HomepageCaseCardVM {
  if (input.applyLocalOverlays === false) {
    return card;
  }

  const latestStatus = getLatestStatusSubmission(input.caseId || card.caseId);

  if (!latestStatus) {
    return card;
  }

  return {
    ...card,
    updatedAtLabel: latestStatus.timestampLabel,
    latestStatusSummary: latestStatus.description,
  };
}

export function finalizeWorkbenchCaseCardPresentation(
  card: WorkbenchCaseCardVM,
  input: { caseId?: string } & LocalPresentationOptions,
): WorkbenchCaseCardVM {
  if (input.applyLocalOverlays === false) {
    return card;
  }

  const latestStatus = getLatestStatusSubmission(input.caseId || card.caseId);

  if (!latestStatus) {
    return card;
  }

  return {
    ...card,
    updatedAtLabel: latestStatus.timestampLabel,
  };
}
