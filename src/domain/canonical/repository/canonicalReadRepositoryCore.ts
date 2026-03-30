import { getDiscoverCardVM } from "../selectors/getDiscoverCardVM";
import {
  buildLedgerSnapshotFromEvents,
  getPublicDetailVM,
} from "../selectors/getPublicDetailVM";
import { getWorkbenchVM } from "../selectors/getWorkbenchVM";
import type {
  CanonicalCaseBundle,
  CanonicalRescuer,
  DiscoverCardVM,
  PublicDetailVM,
  SupportSheetData,
  WorkbenchVM,
} from "../types";
import { caseIdToDraftId, type OwnerDetailActionKey } from "./localRepositoryCore";

export type OwnerDetailVM = {
  caseId: string;
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
      "支持完成后，请回到页面点击“我已支持，去认领”以更新透明账本。",
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
  const ledger = buildLedgerSnapshotFromEvents(bundle.case, bundle.events);

  return {
    caseId: bundle.case.id,
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
      targetAmount: ledger.targetAmount,
      targetAmountLabel: publicDetail.ledger.targetAmountLabel,
      supportedAmount: ledger.supportedAmount,
      supportedAmountLabel: publicDetail.ledger.supportedAmountLabel,
      confirmedExpenseAmount: ledger.confirmedExpenseAmount,
      confirmedExpenseAmountLabel: publicDetail.ledger.confirmedExpenseAmountLabel,
      verifiedGapAmount: ledger.verifiedGapAmount,
      verifiedGapAmountLabel: publicDetail.ledger.verifiedGapAmountLabel,
      remainingTargetAmount: ledger.remainingTargetAmount,
      remainingTargetAmountLabel: publicDetail.ledger.remainingTargetAmountLabel,
    },
    timeline: publicDetail.timeline,
    timelineHint: "数据实时更新",
    support: getSupportSheetDataByCaseIdFromBundles(bundles, caseId)!,
    quickActions,
  };
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
