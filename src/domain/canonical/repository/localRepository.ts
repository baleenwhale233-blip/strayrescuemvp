import {
  adaptLocalDraftToCanonical,
  adaptRescueProjectDetailMockToCanonical,
} from "../adapters/mockToCanonical.ts";
import { sampleCaseBundle } from "../fixtures/sampleCaseBundle.ts";
import { getDiscoverCardVM } from "../selectors/getDiscoverCardVM.ts";
import {
  buildLedgerSnapshotFromEvents,
  getPublicDetailVM,
} from "../selectors/getPublicDetailVM.ts";
import { getWorkbenchVM } from "../selectors/getWorkbenchVM.ts";
import type {
  CanonicalCaseBundle,
  CanonicalRescuer,
  DiscoverCardVM,
  PublicDetailVM,
  StatusTone,
  SupportSheetData,
  WorkbenchVM,
} from "../types.ts";
import {
  appendEntryToDraft as appendEntryToDraftStore,
  calculateDraftLedger,
  formatTimelineTimestamp,
  getCurrentDraftSession,
  getSavedDraftById,
  getSavedDrafts,
  patchCurrentDraftSession,
  replaceDraftById,
  saveCurrentDraft,
  setCurrentDraftSession,
  startNewDraftSession,
  type RescueCreateDraft,
  type RescueCreateDraftStatus,
  type RescueCreateEntryTone,
  type RescueCreateTimelineEntry,
} from "./localDraftPersistence.ts";
import {
  legacyRescueProjectDetails as rescueProjectDetails,
} from "../fixtures/legacyRescueProjectDetails.ts";
import {
  caseIdToDraftId,
  draftIdToCaseId,
  getSourceKindByRescuerId,
  toOwnerActionTimelineEntry,
  type OwnerDetailActionKey,
} from "./localRepositoryCore.ts";

export type OwnerDetailVM = {
  caseId: string;
  sourceKind: "seed" | "local";
  draftId?: string;
  title: string;
  navTitle: string;
  state: string;
  coverImage?: string;
  statusLabel: string;
  statusTone: StatusTone;
  goalAmountLabel: string;
  currentAmountLabel: string;
  progressPercent: number;
  ledger: {
    supported: number;
    verifiedGap: number;
    pending: number;
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

function getSourceKind(bundle: CanonicalCaseBundle): "seed" | "local" {
  return getSourceKindByRescuerId(bundle.rescuer.id);
}

function formatCurrency(value: number) {
  return `¥${value.toLocaleString("zh-CN")}`;
}

function formatDateLabel(isoDateTime: string) {
  const date = new Date(isoDateTime);
  if (Number.isNaN(date.getTime())) {
    return isoDateTime;
  }

  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");

  return `${month}-${day} ${hours}:${minutes}`;
}

function getSeedBundles(): CanonicalCaseBundle[] {
  const legacyBundles = rescueProjectDetails.map((detail, index) =>
    adaptRescueProjectDetailMockToCanonical(detail, index),
  );

  return [sampleCaseBundle, ...legacyBundles];
}

function getLocalBundles(): CanonicalCaseBundle[] {
  return getSavedDrafts().map((draft, index) =>
    adaptLocalDraftToCanonical(draft, index),
  );
}

export function getCanonicalBundles(): CanonicalCaseBundle[] {
  return [...getSeedBundles(), ...getLocalBundles()];
}

export type { RescueCreateDraft, RescueCreateEntryTone, RescueCreateTimelineEntry };
export { calculateDraftLedger, formatTimelineTimestamp };
export { toOwnerActionTimelineEntry, type OwnerDetailActionKey } from "./localRepositoryCore.ts";

export function getCanonicalBundleByCaseId(caseId?: string) {
  if (!caseId) {
    return undefined;
  }

  return getCanonicalBundles().find((bundle) => bundle.case.id === caseId);
}

export function getDiscoverCardVMs(): DiscoverCardVM[] {
  return getCanonicalBundles()
    .filter((bundle) => bundle.case.visibility === "published")
    .map((bundle) => ({
      ...getDiscoverCardVM(bundle),
      sourceKind: getSourceKind(bundle),
    }));
}

export function getPublicDetailVMByCaseId(caseId?: string) {
  const bundle = getCanonicalBundleByCaseId(caseId);
  if (!bundle) {
    return undefined;
  }

  return getPublicDetailVM(bundle);
}

export function getSupportSheetDataByCaseId(caseId?: string): SupportSheetData | undefined {
  const detail = getPublicDetailVMByCaseId(caseId);
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

export function getOwnerDetailVMByCaseId(caseId?: string): OwnerDetailVM | undefined {
  const bundle = getCanonicalBundleByCaseId(caseId);
  if (!bundle) {
    return undefined;
  }

  const publicDetail = getPublicDetailVM(bundle);
  const ledger = buildLedgerSnapshotFromEvents(bundle.case, bundle.events);
  const sourceKind = getSourceKind(bundle);
  const draftId = sourceKind === "local" ? caseIdToDraftId(bundle.case.id) : undefined;

  return {
    caseId: bundle.case.id,
    sourceKind,
    draftId,
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
      supported: ledger.confirmedExpenseAmount,
      verifiedGap: Math.max(ledger.supportedAmount - ledger.confirmedExpenseAmount, 0),
      pending: ledger.remainingTargetAmount,
    },
    timeline: publicDetail.timeline,
    timelineHint: "数据实时更新",
    support: getSupportSheetDataByCaseId(caseId)!,
    quickActions,
  };
}

export function getWorkbenchVMForCurrentUser(): WorkbenchVM | undefined {
  const bundles = getCanonicalBundles();
  const rescuers: CanonicalRescuer[] = bundles.map((bundle) => bundle.rescuer);
  const primaryRescuer = rescuers[0];

  if (!primaryRescuer) {
    return undefined;
  }

  return getWorkbenchVM({
    rescuer: primaryRescuer,
    cases: bundles,
    includeAllCases: true,
    getCaseMeta: (bundle) => ({
      sourceKind: getSourceKind(bundle),
      draftId: getSourceKind(bundle) === "local" ? caseIdToDraftId(bundle.case.id) : undefined,
    }),
  });
}

export function startDraftSession() {
  return startNewDraftSession();
}

export function getCurrentDraft() {
  return getCurrentDraftSession();
}

export function getDraftById(draftId?: string) {
  return getSavedDraftById(draftId);
}

export function getDraftByCaseId(caseId?: string) {
  if (!caseId) {
    return undefined;
  }

  return getSavedDraftById(caseIdToDraftId(caseId));
}

export function updateCurrentDraft(patch: Partial<RescueCreateDraft>) {
  return patchCurrentDraftSession(patch);
}

export function persistDraft(status: RescueCreateDraftStatus) {
  return saveCurrentDraft(status);
}

export function appendDraftEntry(
  draft: RescueCreateDraft,
  entry: RescueCreateTimelineEntry,
) {
  return appendEntryToDraftStore(draft, entry);
}

export function replaceDraft(draft: RescueCreateDraft) {
  return replaceDraftById(draft);
}

export function syncCurrentDraft(draft: RescueCreateDraft) {
  return setCurrentDraftSession(draft);
}
