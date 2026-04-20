import {
  getCaseByPublicIdExact,
  getCanonicalBundles,
  getHomepageCaseCardVMs,
  getOwnerDetailVMByCaseId,
  getPublicDetailVMByCaseId,
  getSupportSheetDataByCaseId,
  getWorkbenchVMForCurrentUser,
} from "../canonicalReadRepository";
import {
  getHomepageCaseCardVMsFromBundles,
  getOwnerDetailVMByCaseIdFromBundles,
  getPublicDetailVMByCaseIdFromBundles,
  getSupportSheetDataByCaseIdFromBundles,
  getWorkbenchVMFromBundles,
} from "../canonicalReadRepositoryCore";
import { getHomepageCaseCardVM } from "../../selectors/getDiscoverCardVM";
import { callRescueApi, canUseCloudBase } from "../cloudbaseClient";
import {
  finalizeHomepageCaseCardPresentation,
  finalizeOwnerDetailPresentation,
  finalizePublicDetailPresentation,
  finalizeWorkbenchCaseCardPresentation,
  resolveBundlePresentation,
  resolvePresentedCover,
  resolvePresentedTitle,
} from "../localPresentation";
import type {
  CanonicalCaseBundle,
  CanonicalRescuer,
  HomepageCaseCardVM,
  PublicDetailVM,
  SupportSheetData,
  WorkbenchVM,
} from "../../types";
import type { OwnerDetailVM } from "../canonicalReadRepositoryCore";
import {
  withRemoteFallback,
} from "./fallback";
import {
  applySupportHistoryPresentation,
  buildMySupportHistoryFromDetails,
  buildRescuerHomepageVMFromBundles,
  finalizeWorkbenchVM,
} from "./readHelpers";
import type {
  CaseRecordDetailVM,
  MyProfileVM,
  MySupportHistoryVM,
  RescuerHomepageVM,
} from "./types";

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

type ProfilePayload = {
  profile: MyProfileVM;
};

type SupportHistoryPayload = {
  summary: MySupportHistoryVM;
};

type CaseRecordDetailPayload = {
  record: CaseRecordDetailVM;
};

const LOCAL_SUPPORTER_ID = "supporter_current_user";

function formatCurrency(amount: number) {
  return `¥${amount.toLocaleString("zh-CN")}`;
}

function getRemoteFallbackOptions() {
  return {
    canUseCloudBase: canUseCloudBase(),
    log: (...args: unknown[]) => console.warn(...args),
  };
}

function resolveBundlesPresentation(bundles: CanonicalCaseBundle[]) {
  return bundles.map(resolveBundlePresentation);
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
      return buildRescuerHomepageVMFromBundles(
        {
          ...payload,
          rescuerId: input.rescuerId,
          caseId: input.caseId,
        },
        {
          resolveBundlesPresentation,
          getHomepageCaseCardVM,
          finalizeHomepageCaseCardPresentation,
          finalizeWorkbenchCaseCardPresentation,
        },
      );
    },
    () =>
      buildRescuerHomepageVMFromBundles(
        {
          bundles: getCanonicalBundles(),
          rescuerId: input.rescuerId,
          caseId: input.caseId,
        },
        {
          resolveBundlesPresentation,
          getHomepageCaseCardVM,
          finalizeHomepageCaseCardPresentation,
          finalizeWorkbenchCaseCardPresentation,
        },
      ),
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
        {
          resolveBundlesPresentation,
          getHomepageCaseCardVM,
          finalizeHomepageCaseCardPresentation,
          finalizeWorkbenchCaseCardPresentation,
          formatCurrency,
          localSupporterId: LOCAL_SUPPORTER_ID,
          resolvePresentedCover,
          resolvePresentedTitle,
        },
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

export async function loadMySupportHistory(): Promise<
  MySupportHistoryVM | undefined
> {
  return withRemoteFallback(
    async () => {
      const { summary } = await callRescueApi<SupportHistoryPayload>(
        "getMySupportHistory",
      );
      return applySupportHistoryPresentation(summary, {
        resolvePresentedTitle,
        resolvePresentedCover,
      });
    },
    () => {
      const resolvedBundles = resolveBundlesPresentation(getCanonicalBundles());
      const details = resolvedBundles
        .map((bundle) =>
          finalizePublicDetailPresentation(
            getPublicDetailVMByCaseIdFromBundles([bundle], bundle.case.id),
            { caseId: bundle.case.id },
          ),
        )
        .filter((detail): detail is PublicDetailVM => Boolean(detail));
      return buildMySupportHistoryFromDetails(details, {
        formatCurrency,
        localSupporterId: LOCAL_SUPPORTER_ID,
      });
    },
    getRemoteFallbackOptions(),
  );
}
