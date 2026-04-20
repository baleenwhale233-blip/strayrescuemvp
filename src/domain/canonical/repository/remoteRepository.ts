import {
  confirmSupportEntryByCaseId,
  createSupportEntryByCaseId,
  markSupportEntryUnmatchedByCaseId,
  type RescueCreateDraft,
  type RescueCreateDraftStatus,
  draftIdToCaseId,
} from "./draftRepository";
import { callRescueApi, canUseCloudBase } from "./cloudbaseClient";
import type {
  CanonicalCaseBundle,
  CaseCurrentStatus,
  SupportUnmatchedReason,
} from "../types";
import { withRemoteFallback, writeRemoteOrFallback } from "./remote/fallback";
export {
  loadCaseRecordDetail,
  loadHomepageCaseCardVMs,
  loadMyProfile,
  loadMySupportHistory,
  loadOwnerDetailVMByCaseId,
  loadPublicDetailVMByCaseId,
  loadRescuerHomepageVM,
  loadSupportSheetDataByCaseId,
  loadWorkbenchVMForCurrentUser,
  searchCaseByPublicIdExact,
} from "./remote/readRepository";
export type {
  CaseRecordDetailVM,
  MyProfileVM,
  MySupportHistoryVM,
  RescuerHomepageVM,
  SupportHistoryItemVM,
} from "./remote/types";
import type { MyProfileVM } from "./remote/types";

type BundlePayload = {
  bundle?: CanonicalCaseBundle;
};
type ProfilePayload = {
  profile: MyProfileVM;
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

function getRemoteFallbackOptions() {
  return {
    canUseCloudBase: canUseCloudBase(),
    log: (...args: unknown[]) => console.warn(...args),
  };
}

export async function updateRemoteMyProfile(input: UpdateMyProfileInput) {
  return writeRemoteOrFallback(
    async () => {
      await callRescueApi<ProfilePayload>("updateMyProfile", input);
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
