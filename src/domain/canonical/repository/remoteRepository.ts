import {
  getCaseByPublicIdExact,
  getCanonicalBundles,
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
import { isDomainErrorCode } from "./domainErrorCodes";
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
      draft.currentStatusLabel || (status === "published" ? "医疗救助中" : "草稿中"),
    budget: draft.budget,
    targetAmount: draft.budget,
    coverFileID: draft.coverPath?.startsWith("cloud://") ? draft.coverPath : undefined,
    foundLocationText: draft.foundLocationText,
    createdAt: draft.createdAt,
  };
}

const LOCAL_SUPPORTER_ID = "supporter_current_user";
const LOCAL_RESCUER_ID = "rescuer_current_user";

function getErrorCode(error: unknown) {
  return error instanceof Error ? error.message : "";
}

function shouldFallbackToLocal(error: unknown) {
  return !isDomainErrorCode(getErrorCode(error));
}

async function withRemoteFallback<T>(
  remote: () => Promise<T>,
  fallback: () => T,
): Promise<T> {
  if (!canUseCloudBase()) {
    return fallback();
  }

  try {
    return await remote();
  } catch (error) {
    if (!shouldFallbackToLocal(error)) {
      throw error;
    }

    console.warn("[remoteRepository] Falling back to local repository", error);
    return fallback();
  }
}

async function writeRemoteOrFallback(remote: () => Promise<void>): Promise<boolean> {
  if (!canUseCloudBase()) {
    return false;
  }

  try {
    await remote();
    return true;
  } catch (error) {
    if (!shouldFallbackToLocal(error)) {
      throw error;
    }

    console.warn("[remoteRepository] Falling back to local write overlay", error);
    return false;
  }
}

export async function loadHomepageCaseCardVMs(): Promise<HomepageCaseCardVM[]> {
  return withRemoteFallback(
    async () => {
      const { bundles } = await callRescueApi<BundlesPayload>("listHomepageCases");
      return getHomepageCaseCardVMsFromBundles(bundles);
    },
    () => getHomepageCaseCardVMsFromBundles(getCanonicalBundles()),
  );
}

function buildRescuerHomepageVMFromBundles(input: {
  rescuer?: CanonicalRescuer;
  bundles: CanonicalCaseBundle[];
}): RescuerHomepageVM | undefined {
  const rescuer = input.rescuer ?? input.bundles[0]?.rescuer;

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
    cards: input.bundles
      .filter((bundle) => bundle.case.visibility === "published")
      .sort((left, right) => right.case.updatedAt.localeCompare(left.case.updatedAt))
      .map((bundle) => getHomepageCaseCardVM(bundle)),
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
      return buildRescuerHomepageVMFromBundles(payload);
    },
    () => undefined,
  );
}

export async function searchCaseByPublicIdExact(input?: string) {
  return withRemoteFallback(
    async () => {
      const { bundle } = await callRescueApi<BundlePayload>(
        "searchCaseByPublicId",
        { publicCaseId: input },
      );
      return bundle;
    },
    () => getCaseByPublicIdExact(input),
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
      return bundle ? getPublicDetailVMByCaseIdFromBundles([bundle], caseId) : undefined;
    },
    () => getPublicDetailVMByCaseId(caseId),
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
        ? getSupportSheetDataByCaseIdFromBundles([bundle], caseId)
        : undefined;
    },
    () => getSupportSheetDataByCaseId(caseId),
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
      return bundle ? getOwnerDetailVMByCaseIdFromBundles([bundle], caseId) : undefined;
    },
    () => getOwnerDetailVMByCaseId(caseId),
  );
}

export async function loadWorkbenchVMForCurrentUser(): Promise<
  WorkbenchVM | undefined
> {
  return withRemoteFallback(
    async () => {
      const { bundles } = await callRescueApi<BundlesPayload>("getOwnerWorkbench");
      return getWorkbenchVMFromBundles(bundles);
    },
    () => getWorkbenchVMForCurrentUser(),
  );
}

export async function loadMyProfile(): Promise<MyProfileVM | undefined> {
  return withRemoteFallback(
    async () => {
      const { profile } = await callRescueApi<ProfilePayload>("getMyProfile");
      return profile;
    },
    () => undefined,
  );
}

export async function updateRemoteMyProfile(input: UpdateMyProfileInput) {
  return writeRemoteOrFallback(async () => {
    await callRescueApi<ProfilePayload>("updateMyProfile", input);
  });
}

export async function loadMySupportHistory(): Promise<
  MySupportHistoryVM | undefined
> {
  return withRemoteFallback(
    async () => {
      const { summary } = await callRescueApi<SupportHistoryPayload>(
        "getMySupportHistory",
      );
      return summary;
    },
    () => undefined,
  );
}

export async function updateRemoteCaseProfileByCaseId(
  caseId: string | undefined,
  input: UpdateCaseProfileInput,
) {
  return writeRemoteOrFallback(async () => {
    await callRescueApi<BundlePayload>("updateCaseProfile", {
      caseId,
      ...input,
    });
  });
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
  );
}

export async function createRemoteManualSupportEntryByCaseId(
  caseId: string | undefined,
  input: CreateManualSupportEntryInput,
) {
  return writeRemoteOrFallback(async () => {
    await callRescueApi<BundlePayload>("createManualSupportEntry", {
      caseId,
      ...input,
    });
  }).then((didSyncRemote) => {
    if (didSyncRemote) {
      return true;
    }

    createSupportEntryByCaseId(caseId, {
      supporterUserId: `manual-supporter:${Date.now()}`,
      supporterNameMasked: input.supporterNameMasked || "线下支持",
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
  return writeRemoteOrFallback(async () => {
    await callRescueApi<BundlePayload>("createProgressUpdate", {
      caseId,
      ...input,
    });
  });
}

export async function createRemoteExpenseRecordByCaseId(
  caseId: string | undefined,
  input: CreateExpenseRecordInput,
) {
  return writeRemoteOrFallback(async () => {
    await callRescueApi<BundlePayload>("createExpenseRecord", {
      caseId,
      ...input,
    });
  });
}

export async function createRemoteBudgetAdjustmentByCaseId(
  caseId: string | undefined,
  input: CreateBudgetAdjustmentInput,
) {
  return writeRemoteOrFallback(async () => {
    await callRescueApi<BundlePayload>("createBudgetAdjustment", {
      caseId,
      ...input,
    });
  });
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
  );
}
