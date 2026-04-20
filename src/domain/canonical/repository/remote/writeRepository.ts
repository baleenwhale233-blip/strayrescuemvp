import {
  confirmSupportEntryByCaseId,
  createSupportEntryByCaseId,
  markSupportEntryUnmatchedByCaseId,
  type RescueCreateDraft,
  type RescueCreateDraftStatus,
  draftIdToCaseId,
} from "../draftRepository";
import { callRescueApi, canUseCloudBase } from "../cloudbaseClient";
import type { CanonicalCaseBundle } from "../../types";
import { withRemoteFallback, writeRemoteOrFallback } from "./fallback";
import type {
  CreateBudgetAdjustmentInput,
  CreateExpenseRecordInput,
  CreateManualSupportEntryInput,
  CreateProgressUpdateInput,
  CreateSupportEntryInput,
  MyProfileVM,
  ReviewSupportEntryInput,
  UpdateCaseProfileInput,
  UpdateMyProfileInput,
} from "./types";
import {
  buildLocalManualSupportEntryInput,
  toRemoteDraftPayload,
} from "./writeHelpers";

type BundlePayload = {
  bundle?: CanonicalCaseBundle;
};

type ProfilePayload = {
  profile: MyProfileVM;
};

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

    createSupportEntryByCaseId(
      caseId,
      buildLocalManualSupportEntryInput(input, {
        now: () => Date.now(),
      }),
    );
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
      const payload = toRemoteDraftPayload(draft, status, {
        draftIdToCaseId,
      });
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
