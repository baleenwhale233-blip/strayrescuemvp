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
import { buildSupportSheetCopy } from "../../contactProfileSemantics";
import { getHomepageCaseCardVM } from "../../selectors/getDiscoverCardVM";
import { callRescueApi, canUseCloudBase } from "../cloudbaseClient";
import {
  finalizeHomepageCaseCardPresentation,
  finalizeOwnerDetailPresentation,
  finalizePublicDetailPresentation,
  finalizeWorkbenchCaseCardPresentation,
  resolveBundlePresentation,
} from "../localPresentation";
import type {
  CanonicalCaseBundle,
  CanonicalRescuer,
  HomepageCaseCardVM,
  PublicDetailVM,
  SupportSheetData,
  WorkbenchCaseCardVM,
  WorkbenchVM,
} from "../../types";
import type { OwnerDetailVM } from "../canonicalReadRepositoryCore";
import { getRemoteErrorCode, withRemoteFallback } from "./fallback";
import {
  buildMySupportHistoryFromDetails,
  buildRescuerHomepageVMFromBundles,
  finalizeWorkbenchVM,
} from "./readHelpers";
import type {
  CaseRecordDetailVM,
  MyProfileVM,
  MySupportHistoryVM,
  RescuerHomepageVM,
  ViewerCaseDetailVM,
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

type ViewerCaseDetailPayload = {
  bundle?: CanonicalCaseBundle;
  viewerIsOwner?: boolean;
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
  return bundles.map((bundle) => resolveBundlePresentation(bundle));
}

function resolveRemoteBundlesCanonical(bundles: CanonicalCaseBundle[]) {
  return bundles.map((bundle) => resolveBundlePresentation(bundle, { applyLocalOverlays: false }));
}

function finalizeRemoteHomepageCaseCardPresentation(card: HomepageCaseCardVM) {
  return finalizeHomepageCaseCardPresentation(card, {
    caseId: card.caseId,
    applyLocalOverlays: false,
  });
}

function finalizeRemotePublicDetailPresentation(
  detail: PublicDetailVM | undefined,
  input: { caseId?: string },
) {
  return finalizePublicDetailPresentation(detail, {
    ...input,
    applyLocalOverlays: false,
  });
}

function finalizeRemoteOwnerDetailPresentation(detail: OwnerDetailVM | undefined) {
  return finalizeOwnerDetailPresentation(detail, {
    applyLocalOverlays: false,
  });
}

function buildSupportSheetDataFromPublicDetail(
  detail: PublicDetailVM | undefined,
): SupportSheetData | undefined {
  if (!detail) {
    return undefined;
  }

  return {
    wechatId: detail.rescuer.wechatId,
    contactNote: detail.rescuer.contactNote,
    paymentQrUrl: detail.rescuer.paymentQrUrl,
    ...buildSupportSheetCopy({
      wechatId: detail.rescuer.wechatId,
      paymentQrUrl: detail.rescuer.paymentQrUrl,
    }),
  };
}

function finalizeRemoteWorkbenchCaseCardPresentation(card: WorkbenchCaseCardVM) {
  return finalizeWorkbenchCaseCardPresentation(card, {
    caseId: card.caseId,
    applyLocalOverlays: false,
  });
}

async function loadViewerCaseDetailVMViaExistingReads(
  caseId?: string,
): Promise<ViewerCaseDetailVM> {
  const [publicDetail, ownerDetail, supportData] = await Promise.all([
    loadPublicDetailVMByCaseId(caseId),
    loadOwnerDetailVMByCaseId(caseId).catch(() => undefined),
    loadSupportSheetDataByCaseId(caseId),
  ]);

  return {
    publicDetail,
    ownerDetail,
    supportData,
    viewerIsOwner: Boolean(ownerDetail),
  };
}

export async function loadHomepageCaseCardVMs(): Promise<HomepageCaseCardVM[]> {
  return withRemoteFallback(
    async () => {
      const { bundles } = await callRescueApi<BundlesPayload>("listHomepageCases");
      return getHomepageCaseCardVMsFromBundles(resolveRemoteBundlesCanonical(bundles)).map((card) =>
        finalizeRemoteHomepageCaseCardPresentation(card),
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
      const payload = await callRescueApi<RescuerHomepagePayload>("getRescuerHomepage", input);
      return buildRescuerHomepageVMFromBundles(
        {
          ...payload,
          rescuerId: input.rescuerId,
          caseId: input.caseId,
        },
        {
          resolveBundlesPresentation: resolveRemoteBundlesCanonical,
          getHomepageCaseCardVM,
          finalizeHomepageCaseCardPresentation: (card) =>
            finalizeRemoteHomepageCaseCardPresentation(card),
          finalizeWorkbenchCaseCardPresentation: (card) =>
            finalizeRemoteWorkbenchCaseCardPresentation(card),
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
      const { bundle } = await callRescueApi<BundlePayload>("searchCaseByPublicId", {
        publicCaseId: input,
      });
      return bundle ? resolveRemoteBundlesCanonical([bundle])[0] : undefined;
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
      return finalizeRemotePublicDetailPresentation(
        bundle
          ? getPublicDetailVMByCaseIdFromBundles(resolveRemoteBundlesCanonical([bundle]), caseId)
          : undefined,
        { caseId },
      );
    },
    () => getPublicDetailVMByCaseId(caseId),
    getRemoteFallbackOptions(),
  );
}

export async function loadViewerCaseDetailVMByCaseId(
  caseId?: string,
): Promise<ViewerCaseDetailVM> {
  return withRemoteFallback(
    async () => {
      let payload: ViewerCaseDetailPayload;

      try {
        payload = await callRescueApi<ViewerCaseDetailPayload>("getCaseDetailForViewer", {
          caseId,
        });
      } catch (error) {
        if (getRemoteErrorCode(error) === "UNKNOWN_ACTION") {
          return loadViewerCaseDetailVMViaExistingReads(caseId);
        }

        throw error;
      }

      const { bundle, viewerIsOwner } = payload;
      const resolvedBundle = bundle ? resolveRemoteBundlesCanonical([bundle])[0] : undefined;
      const publicDetail = resolvedBundle
        ? finalizeRemotePublicDetailPresentation(
            getPublicDetailVMByCaseIdFromBundles([resolvedBundle], caseId),
            { caseId },
          )
        : undefined;
      const ownerDetail =
        resolvedBundle && viewerIsOwner
          ? finalizeRemoteOwnerDetailPresentation(
              getOwnerDetailVMByCaseIdFromBundles([resolvedBundle], caseId),
            )
          : undefined;

      return {
        publicDetail,
        ownerDetail,
        supportData: buildSupportSheetDataFromPublicDetail(publicDetail),
        viewerIsOwner: Boolean(viewerIsOwner),
      };
    },
    () => {
      const publicDetail = getPublicDetailVMByCaseId(caseId);
      const ownerDetail = getOwnerDetailVMByCaseId(caseId);

      return {
        publicDetail,
        ownerDetail,
        supportData: getSupportSheetDataByCaseId(caseId),
        viewerIsOwner: Boolean(ownerDetail),
      };
    },
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
      const { record } = await callRescueApi<CaseRecordDetailPayload>("getCaseRecordDetail", input);
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
        ? getSupportSheetDataByCaseIdFromBundles(resolveRemoteBundlesCanonical([bundle]), caseId)
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
      return finalizeRemoteOwnerDetailPresentation(
        bundle
          ? getOwnerDetailVMByCaseIdFromBundles(resolveRemoteBundlesCanonical([bundle]), caseId)
          : undefined,
      );
    },
    () => getOwnerDetailVMByCaseId(caseId),
    getRemoteFallbackOptions(),
  );
}

export async function loadWorkbenchVMForCurrentUser(): Promise<WorkbenchVM | undefined> {
  return withRemoteFallback(
    async () => {
      const { bundles } = await callRescueApi<BundlesPayload>("getOwnerWorkbench");
      return finalizeWorkbenchVM(
        getWorkbenchVMFromBundles(resolveRemoteBundlesCanonical(bundles)),
        {
          resolveBundlesPresentation: resolveRemoteBundlesCanonical,
          getHomepageCaseCardVM,
          finalizeHomepageCaseCardPresentation: (card) =>
            finalizeRemoteHomepageCaseCardPresentation(card),
          finalizeWorkbenchCaseCardPresentation: (card) =>
            finalizeRemoteWorkbenchCaseCardPresentation(card),
          formatCurrency,
          localSupporterId: LOCAL_SUPPORTER_ID,
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

export async function loadMySupportHistory(): Promise<MySupportHistoryVM | undefined> {
  return withRemoteFallback(
    async () => {
      const { summary } = await callRescueApi<SupportHistoryPayload>("getMySupportHistory");
      return summary;
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
