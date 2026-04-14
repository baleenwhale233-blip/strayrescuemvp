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
import { callRescueApi, canUseCloudBase } from "./cloudbaseClient";
import type {
  CanonicalCaseBundle,
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

type BundlePayload = {
  bundle?: CanonicalCaseBundle;
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
const DOMAIN_ERROR_CODES = new Set([
  "CASE_NOT_FOUND",
  "FORBIDDEN",
  "INVALID_AMOUNT",
  "INVALID_SUPPORTED_AT",
  "SUPPORT_ENTRY_NOT_FOUND",
  "DUPLICATE_SUPPORT_SCREENSHOT",
  "SUPPORT_ENTRY_RATE_LIMIT_10_MIN",
  "SUPPORT_ENTRY_RATE_LIMIT_24_HOUR",
]);

function getErrorCode(error: unknown) {
  return error instanceof Error ? error.message : "";
}

function shouldFallbackToLocal(error: unknown) {
  return !DOMAIN_ERROR_CODES.has(getErrorCode(error));
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

export async function loadHomepageCaseCardVMs(): Promise<HomepageCaseCardVM[]> {
  return withRemoteFallback(
    async () => {
      const { bundles } = await callRescueApi<BundlesPayload>("listHomepageCases");
      return getHomepageCaseCardVMsFromBundles(bundles);
    },
    () => getHomepageCaseCardVMsFromBundles(getCanonicalBundles()),
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
