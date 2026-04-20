import {
  getCaseByPublicIdExact,
  getCanonicalBundles,
  getHomepageCaseCardVMs,
  getOwnerDetailVMByCaseId,
  getPublicDetailVMByCaseId,
  getSupportSheetDataByCaseId,
  getWorkbenchVMForCurrentUser,
} from "./canonicalReadRepository";
import {
  confirmSupportEntryByCaseId,
  createSupportEntryByCaseId,
  markSupportEntryUnmatchedByCaseId,
  type RescueCreateDraft,
  type RescueCreateDraftStatus,
  draftIdToCaseId,
} from "./draftRepository";
import {
  getHomepageCaseCardVMsFromBundles,
  getOwnerDetailVMByCaseIdFromBundles,
  getPublicDetailVMByCaseIdFromBundles,
  getSupportSheetDataByCaseIdFromBundles,
  getWorkbenchVMFromBundles,
} from "./canonicalReadRepositoryCore";
import { getHomepageCaseCardVM } from "../selectors/getDiscoverCardVM";
import { callRescueApi, canUseCloudBase } from "./cloudbaseClient";
import {
  finalizeHomepageCaseCardPresentation,
  finalizeOwnerDetailPresentation,
  finalizePublicDetailPresentation,
  finalizeWorkbenchCaseCardPresentation,
  resolveBundlePresentation,
  resolvePresentedCover,
  resolvePresentedTitle,
} from "./localPresentation";
import type {
  CanonicalCaseBundle,
  CanonicalRescuer,
  CaseCurrentStatus,
  HomepageCaseCardVM,
  PublicDetailVM,
  SupportSheetData,
  SupportUnmatchedReason,
  WorkbenchVM,
} from "../types";
import type { OwnerDetailVM } from "./canonicalReadRepositoryCore";
import {
  withRemoteFallback,
  writeRemoteOrFallback,
} from "./remote/fallback";

type BundlesPayload = {
  bundles: CanonicalCaseBundle[];
};

type RescuerHomepagePayload = {
  rescuer?: CanonicalRescuer;
  bundles: CanonicalCaseBundle[];
};

type BundlePayload = {
  bundle?: CanonicalCaseBundle;
};

export type MyProfileVM = {
  openid?: string;
  displayName: string;
  avatarAssetId?: string;
  avatarUrl: string;
  wechatId: string;
  contactNote: string;
  paymentQrAssetId?: string;
  paymentQrUrl: string;
  hasContactProfile: boolean;
};

export type SupportHistoryItemVM = {
  caseId: string;
  publicCaseId?: string;
  animalName: string;
  animalCoverImageUrl: string;
  myTotalSupportedAmount: number;
  myTotalSupportedAmountLabel: string;
  latestSupportedAt?: string;
  latestSupportedAtLabel: string;
};

export type MySupportHistoryVM = {
  totalSupportedAmount: number;
  totalSupportedAmountLabel: string;
  supportCases: SupportHistoryItemVM[];
};

export type RescuerHomepageVM = {
  rescuer: Pick<CanonicalRescuer, "id" | "name" | "avatarUrl" | "stats">;
  cards: HomepageCaseCardVM[];
  profileEntryEnabled: boolean;
};

export type CaseRecordDetailVM = {
  id: string;
  caseId: string;
  recordType: "expense" | "progress_update" | "budget_adjustment" | "support";
  title: string;
  description?: string;
  occurredAt: string;
  occurredAtLabel: string;
  amount?: number;
  amountLabel?: string;
  immutable: true;
  expenseItems?: Array<{
    description: string;
    amount?: number;
  }>;
  images: Array<{
    assetId?: string;
    fileID?: string;
    url: string;
    thumbnailUrl?: string;
    watermarkedUrl?: string;
    kind: "receipt" | "payment_screenshot" | "animal_photo" | "progress_photo" | "medical_record" | "other";
  }>;
  budgetPreviousLabel?: string;
  budgetCurrentLabel?: string;
};

type ProfilePayload = {
  profile: MyProfileVM;
};

type SupportHistoryPayload = {
  summary: MySupportHistoryVM;
};

type CaseRecordDetailPayload = {
  record: CaseRecordDetailVM;
};

type UpdateMyProfileInput = {
  displayName?: string;
  avatarUrl?: string;
  avatarFileID?: string;
  wechatId?: string;
  contactNote?: string;
  paymentQrFileID?: string;
};

type UpdateCaseProfileInput = {
  animalName?: string;
  coverFileID?: string;
};

type CreateSupportEntryInput = {
  supporterNameMasked?: string;
  amount: number;
  supportedAt: string;
  note?: string;
  screenshotFileIds?: string[];
  localScreenshotPaths?: string[];
};

type ReviewSupportEntryInput = {
  entryId: string;
  status: "confirmed" | "unmatched";
  reason?: SupportUnmatchedReason;
  note?: string;
};

type CreateManualSupportEntryInput = {
  supporterNameMasked?: string;
  amount: number;
  supportedAt: string;
  note?: string;
};

type CreateProgressUpdateInput = {
  status: CaseCurrentStatus;
  statusLabel: string;
  text: string;
  occurredAt: string;
  assetFileIds?: string[];
};

type CreateExpenseRecordInput = {
  amount: number;
  spentAt: string;
  summary: string;
  note?: string;
  category?: "medical" | "medication" | "food_supply" | "transport_other";
  evidenceFileIds?: string[];
  expenseItems?: Array<{
    description: string;
    amount: number;
  }>;
};

type CreateBudgetAdjustmentInput = {
  previousTargetAmount: number;
  newTargetAmount: number;
  reason: string;
  occurredAt: string;
};

function toRemoteDraftPayload(
  draft: RescueCreateDraft,
  status: RescueCreateDraftStatus,
) {
  const caseId = draftIdToCaseId(draft.id);

  return {
    caseId,
    publicCaseId: draft.publicCaseId,
    name: draft.name,
    animalName: draft.name,
    summary: draft.summary,
    initialSummary: draft.summary,
    species: draft.species,
    currentStatus:
      draft.currentStatus || (status === "published" ? "medical" : "draft"),
    currentStatusLabel:
      draft.currentStatusLabel || (status === "published" ? "医疗处理中" : "草稿中"),
    budget: draft.budget,
    targetAmount: draft.budget,
    coverFileID: draft.coverPath?.startsWith("cloud://") ? draft.coverPath : undefined,
    foundLocationText: draft.foundLocationText,
    createdAt: draft.createdAt,
  };
}

const LOCAL_SUPPORTER_ID = "supporter_current_user";
const LOCAL_RESCUER_ID = "rescuer_current_user";

function formatCurrency(amount: number) {
  return `¥${amount.toLocaleString("zh-CN")}`;
}

function resolveBundlesPresentation(bundles: CanonicalCaseBundle[]) {
  return bundles.map(resolveBundlePresentation);
}

function getRemoteFallbackOptions() {
  return {
    canUseCloudBase: canUseCloudBase(),
    log: (...args: unknown[]) => console.warn(...args),
  };
}

function finalizeWorkbenchVM(vm: WorkbenchVM | undefined) {
  if (!vm) {
    return undefined;
  }

  return {
    ...vm,
    activeCases: vm.activeCases.map((card) =>
      finalizeWorkbenchCaseCardPresentation(card, { caseId: card.caseId }),
    ),
    draftCases: vm.draftCases.map((card) =>
      finalizeWorkbenchCaseCardPresentation(card, { caseId: card.caseId }),
    ),
    archivedCases: vm.archivedCases.map((card) =>
      finalizeWorkbenchCaseCardPresentation(card, { caseId: card.caseId }),
    ),
  };
}

export async function loadHomepageCaseCardVMs(): Promise<HomepageCaseCardVM[]> {
  return withRemoteFallback(
    async () => {
      const { bundles } = await callRescueApi<BundlesPayload>("listHomepageCases");
      return getHomepageCaseCardVMsFromBundles(resolveBundlesPresentation(bundles)).map(
        (card) => finalizeHomepageCaseCardPresentation(card, { caseId: card.caseId }),
      );
    },
    () => getHomepageCaseCardVMs(),
    getRemoteFallbackOptions(),
  );
}

function buildRescuerHomepageVMFromBundles(input: {
  rescuer?: CanonicalRescuer;
  bundles: CanonicalCaseBundle[];
  rescuerId?: string;
  caseId?: string;
}): RescuerHomepageVM | undefined {
  const resolvedBundles = resolveBundlesPresentation(input.bundles);
  const targetRescuerId =
    input.rescuerId ||
    input.rescuer?.id ||
    (input.caseId
      ? resolvedBundles.find((bundle) => bundle.case.id === input.caseId)?.rescuer.id
      : undefined) ||
    resolvedBundles[0]?.rescuer.id;

  if (!targetRescuerId) {
    return undefined;
  }

  const rescuerBundles = resolvedBundles
    .filter(
      (bundle) =>
        bundle.rescuer.id === targetRescuerId &&
        bundle.case.visibility === "published",
    )
    .sort((left, right) => right.case.updatedAt.localeCompare(left.case.updatedAt));
  const rescuer =
    input.rescuer ||
    rescuerBundles[0]?.rescuer ||
    resolvedBundles.find((bundle) => bundle.rescuer.id === targetRescuerId)?.rescuer;

  if (!rescuer) {
    return undefined;
  }

  return {
    rescuer: {
      id: rescuer.id,
      name: rescuer.name,
      avatarUrl: rescuer.avatarUrl,
      stats: rescuer.stats,
    },
    cards: rescuerBundles.map((bundle) =>
      finalizeHomepageCaseCardPresentation(getHomepageCaseCardVM(bundle), {
        caseId: bundle.case.id,
      }),
    ),
    profileEntryEnabled: true,
  };
}

export async function loadRescuerHomepageVM(input: {
  rescuerId?: string;
  caseId?: string;
}): Promise<RescuerHomepageVM | undefined> {
  return withRemoteFallback(
    async () => {
      const payload = await callRescueApi<RescuerHomepagePayload>(
        "getRescuerHomepage",
        input,
      );
      return buildRescuerHomepageVMFromBundles({
        ...payload,
        rescuerId: input.rescuerId,
        caseId: input.caseId,
      });
    },
    () =>
      buildRescuerHomepageVMFromBundles({
        bundles: getCanonicalBundles(),
        rescuerId: input.rescuerId,
        caseId: input.caseId,
      }),
    getRemoteFallbackOptions(),
  );
}

export async function searchCaseByPublicIdExact(input?: string) {
  return withRemoteFallback(
    async () => {
      const { bundle } = await callRescueApi<BundlePayload>(
        "searchCaseByPublicId",
        { publicCaseId: input },
      );
      return bundle ? resolveBundlePresentation(bundle) : undefined;
    },
    () => getCaseByPublicIdExact(input),
    getRemoteFallbackOptions(),
  );
}

export async function loadPublicDetailVMByCaseId(
  caseId?: string,
): Promise<PublicDetailVM | undefined> {
  return withRemoteFallback(
    async () => {
      const { bundle } = await callRescueApi<BundlePayload>("getCaseDetail", {
        caseId,
      });
      return finalizePublicDetailPresentation(
        bundle
          ? getPublicDetailVMByCaseIdFromBundles(
              [resolveBundlePresentation(bundle)],
              caseId,
            )
          : undefined,
        { caseId },
      );
    },
    () => getPublicDetailVMByCaseId(caseId),
    getRemoteFallbackOptions(),
  );
}

export async function loadCaseRecordDetail(input: {
  caseId?: string;
  recordType?: CaseRecordDetailVM["recordType"];
  recordId?: string;
}): Promise<CaseRecordDetailVM | undefined> {
  return withRemoteFallback(
    async () => {
      const { record } = await callRescueApi<CaseRecordDetailPayload>(
        "getCaseRecordDetail",
        input,
      );
      return record;
    },
    () => undefined,
    getRemoteFallbackOptions(),
  );
}

export async function loadSupportSheetDataByCaseId(
  caseId?: string,
): Promise<SupportSheetData | undefined> {
  return withRemoteFallback(
    async () => {
      const { bundle } = await callRescueApi<BundlePayload>("getCaseDetail", {
        caseId,
      });
      return bundle
        ? getSupportSheetDataByCaseIdFromBundles(
            [resolveBundlePresentation(bundle)],
            caseId,
          )
        : undefined;
    },
    () => getSupportSheetDataByCaseId(caseId),
    getRemoteFallbackOptions(),
  );
}

export async function loadOwnerDetailVMByCaseId(
  caseId?: string,
): Promise<OwnerDetailVM | undefined> {
  return withRemoteFallback(
    async () => {
      const { bundle } = await callRescueApi<BundlePayload>("getOwnerCaseDetail", {
        caseId,
      });
      return finalizeOwnerDetailPresentation(
        bundle
          ? getOwnerDetailVMByCaseIdFromBundles(
              [resolveBundlePresentation(bundle)],
              caseId,
            )
          : undefined,
      );
    },
    () => getOwnerDetailVMByCaseId(caseId),
    getRemoteFallbackOptions(),
  );
}

export async function loadWorkbenchVMForCurrentUser(): Promise<
  WorkbenchVM | undefined
> {
  return withRemoteFallback(
    async () => {
      const { bundles } = await callRescueApi<BundlesPayload>("getOwnerWorkbench");
      return finalizeWorkbenchVM(
        getWorkbenchVMFromBundles(resolveBundlesPresentation(bundles)),
      );
    },
    () => getWorkbenchVMForCurrentUser(),
    getRemoteFallbackOptions(),
  );
}

export async function loadMyProfile(): Promise<MyProfileVM | undefined> {
  return withRemoteFallback(
    async () => {
      const { profile } = await callRescueApi<ProfilePayload>("getMyProfile");
      return profile;
    },
    () => undefined,
    getRemoteFallbackOptions(),
  );
}

export async function updateRemoteMyProfile(input: UpdateMyProfileInput) {
  return writeRemoteOrFallback(
    async () => {
      await callRescueApi<ProfilePayload>("updateMyProfile", input);
    },
    getRemoteFallbackOptions(),
  );
}

export async function loadMySupportHistory(): Promise<
  MySupportHistoryVM | undefined
> {
  return withRemoteFallback(
    async () => {
      const { summary } = await callRescueApi<SupportHistoryPayload>(
        "getMySupportHistory",
      );
      return {
        ...summary,
        supportCases: summary.supportCases.map((item) => ({
          ...item,
          animalName:
            resolvePresentedTitle({
              caseId: item.caseId,
              fallback: item.animalName,
            }) || item.animalName,
          animalCoverImageUrl:
            resolvePresentedCover({
              caseId: item.caseId,
              fallback: item.animalCoverImageUrl,
            }) || item.animalCoverImageUrl,
        })),
      };
    },
    () => {
      const resolvedBundles = resolveBundlesPresentation(getCanonicalBundles());
      const supportCases = resolvedBundles
        .map((bundle) =>
          finalizePublicDetailPresentation(
            getPublicDetailVMByCaseIdFromBundles([bundle], bundle.case.id),
            { caseId: bundle.case.id },
          ),
        )
        .filter((detail): detail is PublicDetailVM => Boolean(detail))
        .map((detail) => {
          const thread = detail.supportSummary.threads.find(
            (item) => item.supporterUserId === LOCAL_SUPPORTER_ID,
          );
          const amount =
            thread?.entries
              .filter((entry) => entry.status === "confirmed")
              .reduce((sum, entry) => sum + entry.amount, 0) || 0;

          return {
            caseId: detail.caseId,
            publicCaseId: detail.publicCaseId,
            animalName: detail.title,
            animalCoverImageUrl: detail.heroImageUrl || "",
            myTotalSupportedAmount: amount,
            myTotalSupportedAmountLabel: formatCurrency(amount),
            latestSupportedAtLabel:
              thread?.latestEntryAtLabel || detail.updatedAtLabel,
          };
        })
        .filter((item) => item.myTotalSupportedAmount > 0)
        .sort(
          (left, right) =>
            right.myTotalSupportedAmount - left.myTotalSupportedAmount,
        );
      const totalSupportedAmount = supportCases.reduce(
        (sum, item) => sum + item.myTotalSupportedAmount,
        0,
      );

      return {
        totalSupportedAmount,
        totalSupportedAmountLabel: formatCurrency(totalSupportedAmount),
        supportCases,
      };
    },
    getRemoteFallbackOptions(),
  );
}

export async function updateRemoteCaseProfileByCaseId(
  caseId: string | undefined,
  input: UpdateCaseProfileInput,
) {
  return writeRemoteOrFallback(
    async () => {
      await callRescueApi<BundlePayload>("updateCaseProfile", {
        caseId,
        ...input,
      });
    },
    getRemoteFallbackOptions(),
  );
}

export async function createRemoteSupportEntryByCaseId(
  caseId: string | undefined,
  input: CreateSupportEntryInput,
) {
  return withRemoteFallback(
    async () => {
      await callRescueApi<BundlePayload>("createSupportEntry", {
        caseId,
        ...input,
      });
    },
    () => {
      createSupportEntryByCaseId(caseId, {
        supporterUserId: LOCAL_SUPPORTER_ID,
        supporterNameMasked: input.supporterNameMasked,
        amount: input.amount,
        supportedAt: input.supportedAt,
        note: input.note,
        screenshotImages: input.localScreenshotPaths ?? input.screenshotFileIds ?? [],
      });
    },
    getRemoteFallbackOptions(),
  );
}

export async function reviewRemoteSupportEntryByCaseId(
  caseId: string | undefined,
  input: ReviewSupportEntryInput,
) {
  return withRemoteFallback(
    async () => {
      await callRescueApi<BundlePayload>("reviewSupportEntry", {
        caseId,
        ...input,
      });
    },
    () => {
      if (input.status === "confirmed") {
        confirmSupportEntryByCaseId(caseId, {
          entryId: input.entryId,
          confirmedByUserId: LOCAL_RESCUER_ID,
        });
        return;
      }

      markSupportEntryUnmatchedByCaseId(caseId, {
        entryId: input.entryId,
        reason: input.reason ?? "other",
        note: input.note,
      });
    },
    getRemoteFallbackOptions(),
  );
}

export async function createRemoteManualSupportEntryByCaseId(
  caseId: string | undefined,
  input: CreateManualSupportEntryInput,
) {
  return writeRemoteOrFallback(
    async () => {
      await callRescueApi<BundlePayload>("createManualSupportEntry", {
        caseId,
        ...input,
      });
    },
    getRemoteFallbackOptions(),
  ).then((didSyncRemote) => {
    if (didSyncRemote) {
      return true;
    }

    createSupportEntryByCaseId(caseId, {
      supporterUserId: `manual-supporter:${Date.now()}`,
      supporterNameMasked: input.supporterNameMasked || "线下记录",
      amount: input.amount,
      supportedAt: input.supportedAt,
      note: input.note,
      status: "confirmed",
    });
    return false;
  });
}

export async function createRemoteProgressUpdateByCaseId(
  caseId: string | undefined,
  input: CreateProgressUpdateInput,
) {
  return writeRemoteOrFallback(
    async () => {
      await callRescueApi<BundlePayload>("createProgressUpdate", {
        caseId,
        ...input,
      });
    },
    getRemoteFallbackOptions(),
  );
}

export async function createRemoteExpenseRecordByCaseId(
  caseId: string | undefined,
  input: CreateExpenseRecordInput,
) {
  return writeRemoteOrFallback(
    async () => {
      await callRescueApi<BundlePayload>("createExpenseRecord", {
        caseId,
        ...input,
      });
    },
    getRemoteFallbackOptions(),
  );
}

export async function createRemoteBudgetAdjustmentByCaseId(
  caseId: string | undefined,
  input: CreateBudgetAdjustmentInput,
) {
  return writeRemoteOrFallback(
    async () => {
      await callRescueApi<BundlePayload>("createBudgetAdjustment", {
        caseId,
        ...input,
      });
    },
    getRemoteFallbackOptions(),
  );
}

export async function saveRemoteDraftCase(
  draft: RescueCreateDraft,
  status: RescueCreateDraftStatus,
) {
  return withRemoteFallback(
    async () => {
      const payload = toRemoteDraftPayload(draft, status);
      await callRescueApi<BundlePayload>("saveDraftCase", {
        draft: payload,
      });

      if (status === "published") {
        await callRescueApi<BundlePayload>("publishCase", {
          caseId: payload.caseId,
        });
      }
    },
    () => undefined,
    getRemoteFallbackOptions(),
  );
}
