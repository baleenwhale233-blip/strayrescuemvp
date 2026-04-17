import {
  getDiscoverCardVM,
  getHomepageCaseCardVM,
} from "../selectors/getDiscoverCardVM";
import {
  getPublicDetailVM,
} from "../selectors/getPublicDetailVM";
import { getWorkbenchVM } from "../selectors/getWorkbenchVM";
import type {
  CanonicalCaseBundle,
  CanonicalRescuer,
  CanonicalSupportThread,
  DiscoverCardVM,
  HomepageCaseCardVM,
  PublicDetailVM,
  SupportSheetData,
  WorkbenchVM,
} from "../types";
import {
  getHomepageEligibility,
  getMySupportThreadByCaseId,
  getPublicCaseId,
  getStructuredSupportThreads,
  normalizePublicCaseIdInput,
} from "../modeling";
import { getOwnerAlerts, type OwnerAlertVM } from "../selectors/ownerNoticeVM";
import { caseIdToDraftId, type OwnerDetailActionKey } from "./localRepositoryCore";

export type OwnerDetailVM = {
  caseId: string;
  publicCaseId: string;
  sourceKind: CanonicalCaseBundle["sourceKind"];
  draftId?: string;
  title: string;
  navTitle: string;
  state: string;
  coverImage?: string;
  statusLabel: string;
  statusTone: PublicDetailVM["statusTone"];
  goalAmountLabel: string;
  currentAmountLabel: string;
  progressPercent: number;
  ledger: {
    targetAmount: number;
    targetAmountLabel: string;
    supportedAmount: number;
    supportedAmountLabel: string;
    confirmedExpenseAmount: number;
    confirmedExpenseAmountLabel: string;
    verifiedGapAmount: number;
    verifiedGapAmountLabel: string;
    remainingTargetAmount: number;
    remainingTargetAmountLabel: string;
  };
  timeline: PublicDetailVM["timeline"];
  timelineHint: string;
  support: SupportSheetData;
  homepageEligibilityStatus?: HomepageCaseCardVM["homepageEligibilityStatus"];
  homepageEligibilityReason?: string;
  pendingSupportEntryCount?: number;
  unmatchedSupportEntryCount?: number;
  ownerAlerts: OwnerAlertVM[];
  primaryNoticeLabel?: string;
  lastUpdateAgeHint?: string;
  canPublishHomepage: boolean;
  supportThreads?: CanonicalSupportThread[];
  quickActions: Array<{
    key: OwnerDetailActionKey;
    label: string;
    icon: "camera" | "fileText" | "handCoins" | "sparkles" | "plusCircle";
  }>;
};

const quickActions: OwnerDetailVM["quickActions"] = [
  { key: "receipt", label: "记一笔支出", icon: "camera" },
  { key: "update", label: "写进展更新", icon: "fileText" },
  { key: "income", label: "记场外收入", icon: "handCoins" },
  { key: "budget", label: "追加预算", icon: "plusCircle" },
  { key: "copy", label: "生成文案", icon: "sparkles" },
];

export function getCanonicalBundleByCaseIdFromBundles(
  bundles: CanonicalCaseBundle[],
  caseId?: string,
) {
  if (!caseId) {
    return undefined;
  }

  return bundles.find((bundle) => bundle.case.id === caseId);
}

export function getDiscoverCardVMsFromBundles(
  bundles: CanonicalCaseBundle[],
): DiscoverCardVM[] {
  return bundles
    .filter((bundle) => bundle.case.visibility === "published")
    .map((bundle) => ({
      ...getDiscoverCardVM(bundle),
      sourceKind: bundle.sourceKind,
    }));
}

export function getCaseByPublicIdExactFromBundles(
  bundles: CanonicalCaseBundle[],
  input?: string,
) {
  const normalized = normalizePublicCaseIdInput(input);

  if (!normalized) {
    return undefined;
  }

  return bundles.find(
    (bundle) =>
      bundle.case.visibility === "published" &&
      getPublicCaseId(bundle.case) === normalized,
  );
}

export function getHomepageEligibleCasesFromBundles(
  bundles: CanonicalCaseBundle[],
) {
  return bundles
    .filter((bundle) => getHomepageEligibility(bundle).status === "eligible")
    .sort((left, right) => right.case.updatedAt.localeCompare(left.case.updatedAt));
}

export function getHomepageCaseCardVMsFromBundles(
  bundles: CanonicalCaseBundle[],
): HomepageCaseCardVM[] {
  return getHomepageEligibleCasesFromBundles(bundles).map((bundle) =>
    getHomepageCaseCardVM(bundle),
  );
}

export function getPublicDetailVMByCaseIdFromBundles(
  bundles: CanonicalCaseBundle[],
  caseId?: string,
) {
  const bundle = getCanonicalBundleByCaseIdFromBundles(bundles, caseId);
  if (!bundle) {
    return undefined;
  }

  return getPublicDetailVM(bundle);
}

export function getSupportSheetDataByCaseIdFromBundles(
  bundles: CanonicalCaseBundle[],
  caseId?: string,
): SupportSheetData | undefined {
  const detail = getPublicDetailVMByCaseIdFromBundles(bundles, caseId);
  if (!detail) {
    return undefined;
  }

  return {
    wechatId: detail.rescuer.wechatId,
    paymentQrUrl: detail.rescuer.paymentQrUrl,
    contactHint: "长按图片保存到相册，打开微信扫一扫添加好友",
    directHint: "长按图片保存到相册，打开微信/支付宝扫码转账",
    contactTip: "添加救助人后，可通过微信直接沟通救助细节。",
    directTip:
      "支持完成后，请回到页面点击“我已支持”以登记支持记录。",
  };
}

export function getOwnerDetailVMByCaseIdFromBundles(
  bundles: CanonicalCaseBundle[],
  caseId?: string,
): OwnerDetailVM | undefined {
  const bundle = getCanonicalBundleByCaseIdFromBundles(bundles, caseId);
  if (!bundle) {
    return undefined;
  }

  const publicDetail = getPublicDetailVM(bundle);
  const homepageEligibility = getHomepageEligibility(bundle);
  const supportThreads = getStructuredSupportThreads(bundle);
  const pendingSupportEntryCount = supportThreads.reduce(
    (sum, thread) => sum + thread.pendingCount,
    0,
  );
  const unmatchedSupportEntryCount = supportThreads.reduce(
    (sum, thread) => sum + thread.unmatchedCount,
    0,
  );
  const ownerAlerts = getOwnerAlerts(bundle);

  return {
    caseId: bundle.case.id,
    publicCaseId: getPublicCaseId(bundle.case),
    sourceKind: bundle.sourceKind,
    draftId: bundle.sourceKind === "local" ? caseIdToDraftId(bundle.case.id) : undefined,
    title: publicDetail.title,
    navTitle: "救助记录管理",
    state: bundle.case.currentStatusLabel,
    coverImage: publicDetail.heroImageUrl,
    statusLabel: publicDetail.statusLabel,
    statusTone: publicDetail.statusTone,
    goalAmountLabel: publicDetail.ledger.targetAmountLabel,
    currentAmountLabel: publicDetail.ledger.supportedAmountLabel,
    progressPercent: publicDetail.ledger.progressPercent,
    ledger: {
      targetAmount: publicDetail.ledger.targetAmount,
      targetAmountLabel: publicDetail.ledger.targetAmountLabel,
      supportedAmount: publicDetail.ledger.supportedAmount,
      supportedAmountLabel: publicDetail.ledger.supportedAmountLabel,
      confirmedExpenseAmount: publicDetail.ledger.confirmedExpenseAmount,
      confirmedExpenseAmountLabel: publicDetail.ledger.confirmedExpenseAmountLabel,
      verifiedGapAmount: publicDetail.ledger.verifiedGapAmount,
      verifiedGapAmountLabel: publicDetail.ledger.verifiedGapAmountLabel,
      remainingTargetAmount: publicDetail.ledger.remainingTargetAmount,
      remainingTargetAmountLabel: publicDetail.ledger.remainingTargetAmountLabel,
    },
    timeline: publicDetail.timeline,
    timelineHint: "数据实时更新",
    support: getSupportSheetDataByCaseIdFromBundles(bundles, caseId)!,
    homepageEligibilityStatus: homepageEligibility.status,
    homepageEligibilityReason: homepageEligibility.reason,
    pendingSupportEntryCount,
    unmatchedSupportEntryCount,
    ownerAlerts,
    primaryNoticeLabel: ownerAlerts[0]?.label,
    lastUpdateAgeHint: ownerAlerts.find((alert) => alert.id === "stale-update")?.label,
    canPublishHomepage: homepageEligibility.status === "eligible",
    supportThreads: supportThreads,
    quickActions,
  };
}

export function getSupportThreadsByCaseIdFromBundles(
  bundles: CanonicalCaseBundle[],
  caseId?: string,
): CanonicalSupportThread[] {
  const bundle = getCanonicalBundleByCaseIdFromBundles(bundles, caseId);

  if (!bundle) {
    return [];
  }

  return getStructuredSupportThreads(bundle);
}

export function getMySupportThreadByCaseIdFromBundles(
  bundles: CanonicalCaseBundle[],
  caseId: string | undefined,
  supporterUserId: string,
) {
  const bundle = getCanonicalBundleByCaseIdFromBundles(bundles, caseId);

  if (!bundle) {
    return undefined;
  }

  return getMySupportThreadByCaseId(bundle, supporterUserId);
}

export function getWorkbenchVMFromBundles(
  bundles: CanonicalCaseBundle[],
  rescuer?: CanonicalRescuer,
): WorkbenchVM | undefined {
  const primaryRescuer = rescuer ?? bundles[0]?.rescuer;
  if (!primaryRescuer) {
    return undefined;
  }

  return getWorkbenchVM({
    rescuer: primaryRescuer,
    cases: bundles,
    includeAllCases: true,
    getCaseMeta: (bundle) => ({
      draftId: bundle.sourceKind === "local" ? caseIdToDraftId(bundle.case.id) : undefined,
    }),
  });
}
