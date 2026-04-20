import { getStructuredExpenseRecords } from "../modeling";
import type {
  CanonicalAsset,
  CanonicalCaseBundle,
  CanonicalEvent,
  CanonicalExpenseRecord,
  CaseCurrentStatus,
  HomepageCaseCardVM,
  PublicDetailVM,
  WorkbenchCaseCardVM,
} from "../types";
import type { OwnerDetailVM } from "./canonicalReadRepositoryCore";
import type { RescueCreateDraft } from "./localDraftPersistence";

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

export type LocalPresentationSnapshot = {
  caseId: string;
  draftId?: string;
  draft?: RescueCreateDraft;
  titleOverride?: string;
  coverOverride?: string;
  statusSubmissions?: LocalStatusSubmission[];
  expenseSubmissions?: LocalExpenseSubmission[];
  budgetAdjustments?: LocalBudgetAdjustmentSubmission[];
};

function formatCurrency(amount: number) {
  return `¥${amount.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function resolvePresentedValue(input: {
  override?: string;
  draftValue?: string;
  fallback?: string;
}) {
  return input.override || input.draftValue || input.fallback;
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

function replaceTimelineLabels(
  timeline: PublicDetailVM["timeline"],
  input: LocalPresentationSnapshot,
): PublicDetailVM["timeline"] {
  const statusSubmissions = input.statusSubmissions ?? [];
  const expenseSubmissions = input.expenseSubmissions ?? [];
  const budgetAdjustments = input.budgetAdjustments ?? [];
  const rewrittenBaseTimeline = timeline
    .filter((item) => !item.id.startsWith(`overlay:${input.caseId}:expense:`))
    .filter((item) => !item.id.startsWith(`overlay:${input.caseId}:status:`))
    .filter((item) => !item.id.startsWith(`overlay:${input.caseId}:budget:`));

  const localExpenseItems = expenseSubmissions.map((submission) => ({
    id: createOverlayEventId(input.caseId, "expense", submission.id),
    type: "expense" as const,
    label: "支出记录",
    tone: "urgent" as const,
    title: submission.title,
    amountLabel: `- ${formatCurrency(submission.amount)}`,
    timestampLabel: submission.timestampLabel,
    assetUrls: submission.assetUrls.slice(0, 9),
    verificationStatus: "manual" as const,
  }));

  const localStatusItems = statusSubmissions.map((submission) => ({
    id: createOverlayEventId(input.caseId, "status", submission.id),
    type: "progress_update" as const,
    label: "状态更新",
    tone: "progress" as const,
    title: submission.description,
    timestampLabel: submission.timestampLabel,
    assetUrls: submission.assetUrls.slice(0, 9),
  }));

  const localBudgetItems = budgetAdjustments.map((submission) => ({
    id: createOverlayEventId(input.caseId, "budget", submission.id),
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
    ...rewrittenBaseTimeline,
  ];
}

export function resolvePresentedDraftCore(
  draft: RescueCreateDraft | undefined,
  input: Pick<LocalPresentationSnapshot, "titleOverride" | "coverOverride">,
) {
  if (!draft) {
    return draft;
  }

  return {
    ...draft,
    name:
      resolvePresentedValue({
        override: input.titleOverride,
        draftValue: draft.name,
        fallback: draft.name,
      }) || draft.name,
    coverPath:
      resolvePresentedValue({
        override: input.coverOverride,
        draftValue: draft.coverPath,
        fallback: draft.coverPath,
      }) || draft.coverPath,
  };
}

export function resolveBundlePresentationCore(
  bundle: CanonicalCaseBundle,
  input: LocalPresentationSnapshot,
): CanonicalCaseBundle {
  const latestStatus = input.statusSubmissions?.[0];
  const expenseSubmissions = input.expenseSubmissions ?? [];
  const budgetAdjustments = input.budgetAdjustments ?? [];
  const title =
    resolvePresentedValue({
      override: input.titleOverride,
      draftValue: input.draft?.name,
      fallback: bundle.case.animalName,
    }) || bundle.case.animalName;
  const coverPath = resolvePresentedValue({
    override: input.coverOverride,
    draftValue: input.draft?.coverPath,
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
      caseId: input.caseId,
      itemId: "cover",
      kind: "case_cover",
      url: coverPath,
    });
    assets.unshift(coverAsset);
    caseRecord.coverAssetId = coverAsset.id;
  }

  if (input.draft?.currentStatus && !latestStatus) {
    caseRecord.currentStatus = input.draft.currentStatus;
    caseRecord.currentStatusLabel =
      input.draft.currentStatusLabel || caseRecord.currentStatusLabel;
  }

  if (latestStatus) {
    const overlayVisibility = getOverlayVisibility(bundle);
    const assetIds = latestStatus.assetUrls
      .slice(0, 9)
      .map((url, index) => {
        const asset = cloneOverlayAsset({
          caseId: input.caseId,
          itemId: latestStatus.id,
          kind: "progress_photo",
          url,
          index,
        });
        assets.unshift(asset);
        return asset.id;
      });

    events.unshift({
      id: createOverlayEventId(input.caseId, "status", latestStatus.id),
      caseId: input.caseId,
      type: "progress_update",
      occurredAt: latestStatus.createdAt,
      text: latestStatus.description,
      statusLabel: latestStatus.statusLabel,
      assetIds,
      visibility: overlayVisibility,
    });

    caseRecord.currentStatus =
      inferCaseCurrentStatus(latestStatus.statusLabel) ||
      input.draft?.currentStatus ||
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
            caseId: input.caseId,
            itemId: submission.id,
            kind: index === 0 ? "receipt" : "progress_photo",
            url,
            index,
          });
          assets.unshift(asset);
          return {
            id: createOverlayAssetId(input.caseId, "expense-evidence", submission.id, index),
            kind: index === 0 ? ("receipt" as const) : ("animal_photo" as const),
            assetId: asset.id,
            imageUrl: url,
            hash: url,
          };
        });

      return {
        id: `overlay-expense-record:${input.caseId}:${submission.id}`,
        caseId: input.caseId,
        amount: submission.amount,
        currency: "CNY",
        spentAt: submission.createdAt,
        category: "medical" as const,
        summary: submission.title,
        evidenceItems,
        evidenceLevel: evidenceItems.length ? "basic" as const : "needs_attention" as const,
        verificationStatus: "manual" as const,
        visibility: overlayVisibility,
        projectedEventId: createOverlayEventId(input.caseId, "expense", submission.id),
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
  };
}

export function finalizePublicDetailPresentationCore(
  detail: PublicDetailVM | undefined,
  input: LocalPresentationSnapshot,
): PublicDetailVM | undefined {
  if (!detail) {
    return detail;
  }

  const latestStatus = input.statusSubmissions?.[0];

  return {
    ...detail,
    updatedAtLabel: latestStatus?.timestampLabel || detail.updatedAtLabel,
    latestTimelineSummary:
      latestStatus?.description || detail.latestTimelineSummary,
    timeline: replaceTimelineLabels(detail.timeline, input),
  };
}

export function finalizeOwnerDetailPresentationCore(
  detail: OwnerDetailVM | undefined,
  input: LocalPresentationSnapshot,
): OwnerDetailVM | undefined {
  if (!detail) {
    return detail;
  }

  return {
    ...detail,
    state: detail.statusLabel,
    timeline: replaceTimelineLabels(detail.timeline, input),
  };
}

export function finalizeHomepageCaseCardPresentationCore(
  card: HomepageCaseCardVM,
  input: LocalPresentationSnapshot,
): HomepageCaseCardVM {
  const latestStatus = input.statusSubmissions?.[0];

  if (!latestStatus) {
    return card;
  }

  return {
    ...card,
    updatedAtLabel: latestStatus.timestampLabel,
    latestStatusSummary: latestStatus.description,
  };
}

export function finalizeWorkbenchCaseCardPresentationCore(
  card: WorkbenchCaseCardVM,
  input: LocalPresentationSnapshot,
): WorkbenchCaseCardVM {
  const latestStatus = input.statusSubmissions?.[0];

  if (!latestStatus) {
    return card;
  }

  return {
    ...card,
    updatedAtLabel: latestStatus.timestampLabel,
  };
}
