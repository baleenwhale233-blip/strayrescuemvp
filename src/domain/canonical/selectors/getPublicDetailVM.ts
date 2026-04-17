import type {
  CanonicalAsset,
  CanonicalCase,
  CanonicalCaseBundle,
  CanonicalExpenseEvent,
  CanonicalEvent,
  CanonicalRescuer,
  CanonicalSupportEvent,
  LedgerSnapshot,
  PublicDetailVM,
  PublicTimelineItemVM,
  StatusTone,
} from "../types";
import {
  buildLedgerSnapshotFromStructured,
  getPublicCaseId,
  getStructuredExpenseRecords,
  getStructuredSupportEntries,
  toSupportThreadSummaryVMs,
} from "../modeling";

function sortEventsDesc(events: CanonicalEvent[]) {
  return [...events].sort((left, right) =>
    right.occurredAt.localeCompare(left.occurredAt),
  );
}

function formatCurrency(amount: number) {
  return `¥${amount.toLocaleString("zh-CN")}`;
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

function getAssetMap(assets: CanonicalAsset[]) {
  return new Map(assets.map((asset) => [asset.id, asset]));
}

function getAssetUrl(assetMap: Map<string, CanonicalAsset>, assetId?: string) {
  if (!assetId) {
    return undefined;
  }

  const asset = assetMap.get(assetId);
  if (!asset) {
    return undefined;
  }

  return asset.watermarkedUrl || asset.originalUrl || asset.thumbnailUrl;
}

function getStatusTone(caseRecord: CanonicalCase): StatusTone {
  if (caseRecord.visibility === "draft" || caseRecord.currentStatus === "draft") {
    return "draft";
  }

  if (caseRecord.currentStatus === "medical" || caseRecord.currentStatus === "newly_found") {
    return "active";
  }

  if (caseRecord.currentStatus === "recovery" || caseRecord.currentStatus === "rehoming") {
    return "progress";
  }

  if (caseRecord.currentStatus === "completed" || caseRecord.currentStatus === "closed") {
    return "done";
  }

  return "active";
}

function getResolvedTargetAmount(
  caseRecord: CanonicalCase,
  events: CanonicalEvent[],
) {
  return events
    .filter((event) => event.type === "budget_adjustment")
    .sort((left, right) => left.occurredAt.localeCompare(right.occurredAt))
    .reduce((targetAmount, event) => event.newTargetAmount, caseRecord.targetAmount);
}

function isCountableExpenseEvent(
  event: CanonicalEvent,
): event is CanonicalExpenseEvent {
  return (
    event.type === "expense" &&
    (event.verificationStatus === "confirmed" ||
      event.verificationStatus === "manual")
  );
}

function isConfirmedSupportEvent(
  event: CanonicalEvent,
): event is CanonicalSupportEvent {
  return event.type === "support" && event.verificationStatus === "confirmed";
}

function isPendingSupportEvent(
  event: CanonicalEvent,
): event is CanonicalSupportEvent {
  return event.type === "support" && event.verificationStatus === "pending";
}

export function buildLedgerSnapshotFromEvents(
  caseRecord: CanonicalCase,
  events: CanonicalEvent[],
): LedgerSnapshot {
  const targetAmount = getResolvedTargetAmount(caseRecord, events);
  const confirmedExpenseAmount = events
    .filter(isCountableExpenseEvent)
    .reduce((sum, event) => sum + event.amount, 0);
  const supportedAmount = events
    .filter(isConfirmedSupportEvent)
    .reduce((sum, event) => sum + event.amount, 0);
  const pendingSupportAmount = events
    .filter(isPendingSupportEvent)
    .reduce((sum, event) => sum + event.amount, 0);
  const verifiedGapAmount = Math.max(confirmedExpenseAmount - supportedAmount, 0);
  const remainingTargetAmount = Math.max(
    targetAmount - Math.max(confirmedExpenseAmount, supportedAmount),
    0,
  );
  const progressPercent =
    targetAmount > 0 ? Math.min(Math.round((supportedAmount / targetAmount) * 100), 100) : 0;

  return {
    targetAmount,
    confirmedExpenseAmount,
    supportedAmount,
    pendingSupportAmount,
    verifiedGapAmount,
    remainingTargetAmount,
    progressPercent,
  };
}

function eventToTimelineItemVM(
  event: CanonicalEvent,
  assetMap: Map<string, CanonicalAsset>,
): PublicTimelineItemVM {
  const shared = {
    id: event.id,
    type: event.type,
    timestampLabel: formatDateLabel(event.occurredAt),
    assetUrls: event.assetIds
      .map((assetId) => getAssetUrl(assetMap, assetId))
      .filter((value): value is string => Boolean(value)),
  };

  switch (event.type) {
    case "expense":
      return {
        ...shared,
        label: "支出记录",
        tone: "urgent",
        title: event.expenseItemsText,
        description: event.merchantName,
        amountLabel: `- ${formatCurrency(event.amount)}`,
        verificationStatus: event.verificationStatus,
      };
    case "support":
      return {
        ...shared,
        label: "场外支持",
        tone: event.verificationStatus === "confirmed" ? "progress" : "draft",
        title: event.supporterNameMasked
          ? `${event.supporterNameMasked} 的支持`
          : "新的支持记录",
        description: event.message,
        amountLabel: `+ ${formatCurrency(event.amount)}`,
        verificationStatus: event.verificationStatus,
      };
    case "budget_adjustment":
      return {
        ...shared,
        label: "预算调整",
        tone: "active",
        title: `预算从 ${formatCurrency(event.previousTargetAmount)} 调整到 ${formatCurrency(
          event.newTargetAmount,
        )}`,
        description: event.reason,
      };
    case "case_created":
      return {
        ...shared,
        label: event.statusLabel || "刚发现",
        tone: "urgent",
        title: event.text,
      };
    case "progress_update":
      return {
        ...shared,
        label: event.statusLabel || "状态更新",
        tone: "progress",
        title: event.text,
      };
    default:
      return {
        ...shared,
        label: "事件",
        tone: "active",
        title: "",
      };
  }
}

function getPublicTimeline(events: CanonicalEvent[], assetMap: Map<string, CanonicalAsset>) {
  return sortEventsDesc(events)
    .filter((event) => event.visibility === "public")
    .map((event) => eventToTimelineItemVM(event, assetMap));
}

function getLatestTimelineSummary(timeline: PublicTimelineItemVM[]) {
  return timeline[0]?.description || timeline[0]?.title;
}

function getRescueStartedAt(caseRecord: CanonicalCase, events: CanonicalEvent[]) {
  const createdEvent = events
    .filter((event) => event.type === "case_created")
    .sort((left, right) => left.occurredAt.localeCompare(right.occurredAt))[0];

  return caseRecord.foundAt || createdEvent?.occurredAt || caseRecord.createdAt;
}

function getVerifiedLevelLabel(rescuer: CanonicalRescuer) {
  if (rescuer.verifiedLevel === "realname") {
    return "已实名";
  }

  if (rescuer.verifiedLevel === "wechat") {
    return "已微信认证";
  }

  return "未认证";
}

export function getPublicDetailVM(bundle: CanonicalCaseBundle): PublicDetailVM {
  const assetMap = getAssetMap(bundle.assets);
  const ledger = buildLedgerSnapshotFromStructured(bundle.case, {
    expenseRecords: getStructuredExpenseRecords(bundle),
    supportEntries: getStructuredSupportEntries(bundle),
  });
  const timeline = getPublicTimeline(bundle.events, assetMap);
  const heroImageUrl =
    getAssetUrl(assetMap, bundle.case.coverAssetId) ||
    getAssetUrl(assetMap, bundle.case.faceIdAssetId);
  const supportThreads = toSupportThreadSummaryVMs(bundle);
  const pendingSupportEntryCount = supportThreads.reduce(
    (sum, thread) => sum + thread.pendingCount,
    0,
  );
  const unmatchedSupportEntryCount = supportThreads.reduce(
    (sum, thread) => sum + thread.unmatchedCount,
    0,
  );
  const rescueStartedAt = getRescueStartedAt(bundle.case, bundle.events);

  return {
    caseId: bundle.case.id,
    publicCaseId: getPublicCaseId(bundle.case),
    rescuerId: bundle.rescuer.id,
    title: bundle.case.animalName,
    species: bundle.case.species,
    statusLabel: bundle.case.currentStatusLabel,
    statusTone: getStatusTone(bundle.case),
    heroImageUrl,
    locationText: bundle.case.foundLocationText,
    summary: bundle.case.initialSummary,
    rescueStartedAt,
    rescueStartedAtLabel: formatDateLabel(rescueStartedAt),
    updatedAtLabel: formatDateLabel(bundle.case.updatedAt),
    ledger: {
      ...ledger,
      targetAmountLabel: formatCurrency(ledger.targetAmount),
      confirmedExpenseAmountLabel: formatCurrency(ledger.confirmedExpenseAmount),
      supportedAmountLabel: formatCurrency(ledger.supportedAmount),
      pendingSupportAmountLabel: formatCurrency(ledger.pendingSupportAmount),
      verifiedGapAmountLabel: formatCurrency(ledger.verifiedGapAmount),
      remainingTargetAmountLabel: formatCurrency(ledger.remainingTargetAmount),
    },
    rescuer: {
      id: bundle.rescuer.id,
      name: bundle.rescuer.name,
      avatarUrl:
        getAssetUrl(assetMap, bundle.rescuer.avatarAssetId) ||
        bundle.rescuer.avatarUrl,
      verifiedLevel: bundle.rescuer.verifiedLevel,
      verifiedLabel: getVerifiedLevelLabel(bundle.rescuer),
      joinedAtLabel: formatDateLabel(bundle.rescuer.joinedAt),
      stats: bundle.rescuer.stats,
      wechatId: bundle.rescuer.wechatId,
      paymentQrUrl: getAssetUrl(assetMap, bundle.rescuer.paymentQrAssetId),
      profileEntryEnabled: Boolean(bundle.rescuer.id),
    },
    supportSummary: {
      confirmedSupportAmount: ledger.supportedAmount,
      confirmedSupportAmountLabel: formatCurrency(ledger.supportedAmount),
      pendingSupportEntryCount,
      unmatchedSupportEntryCount,
      threads: supportThreads,
    },
    timeline,
    latestTimelineSummary: getLatestTimelineSummary(timeline),
  };
}
