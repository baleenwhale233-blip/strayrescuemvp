import type {
  CanonicalAsset,
  CanonicalCase,
  CanonicalCaseBundle,
  CanonicalEvidenceItem,
  CanonicalEvent,
  CanonicalExpenseEvent,
  CanonicalExpenseRecord,
  CanonicalSharedEvidenceGroup,
  CanonicalSupportEntry,
  CanonicalSupportEvent,
  CanonicalSupportThread,
  CasePublicId,
  EvidenceLevel,
  ExpenseCategory,
  ExpenseEvidenceKind,
  HomepageEligibilityStatus,
  LedgerSnapshot,
  SupportEntryStatus,
  SupportThreadSummaryVM,
  SupportUnmatchedReason,
} from "./types";

const PUBLIC_CASE_PREFIX = "JM";
const HOMEPAGE_REASON_FALLBACK = "公开后仍需继续补充基础记录";
const RECOMMENDATION_WINDOW_MS = 48 * 60 * 60 * 1000;

function stableHash(input: string) {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return Math.abs(hash >>> 0);
}

function digitsFromValue(input: string) {
  return input.replace(/[^\d]/g, "");
}

function toFixedSixDigits(input: number) {
  return `${input % 1000000}`.padStart(6, "0");
}

export function createCasePublicId(internalCaseId: string): CasePublicId {
  const digits = digitsFromValue(internalCaseId);

  if (digits.length >= 6) {
    return `${PUBLIC_CASE_PREFIX}${digits.slice(-6)}`;
  }

  return `${PUBLIC_CASE_PREFIX}${toFixedSixDigits(stableHash(internalCaseId))}`;
}

export function getPublicCaseId(caseRecord: {
  id: string;
  publicCaseId?: string;
}): CasePublicId {
  return caseRecord.publicCaseId || createCasePublicId(caseRecord.id);
}

export function normalizePublicCaseIdInput(
  input?: string,
): CasePublicId | undefined {
  const trimmed = input?.trim().toUpperCase();

  if (!trimmed) {
    return undefined;
  }

  const digitsOnly = digitsFromValue(trimmed);

  if (!digitsOnly) {
    return undefined;
  }

  if (trimmed.startsWith(PUBLIC_CASE_PREFIX)) {
    return `${PUBLIC_CASE_PREFIX}${digitsOnly}`;
  }

  return `${PUBLIC_CASE_PREFIX}${digitsOnly}`;
}

function getAssetMap(assets: CanonicalAsset[]) {
  return new Map(assets.map((asset) => [asset.id, asset]));
}

function getAssetUrl(asset?: CanonicalAsset) {
  return asset?.watermarkedUrl || asset?.originalUrl || asset?.thumbnailUrl;
}

function mapAssetKindToEvidenceKind(
  assetKind: CanonicalAsset["kind"],
): ExpenseEvidenceKind {
  switch (assetKind) {
    case "receipt":
      return "receipt";
    case "support_proof":
      return "payment_screenshot";
    case "medical_record":
      return "treatment_photo";
    case "progress_photo":
      return "animal_photo";
    default:
      return "item_photo";
  }
}

function buildEvidenceItemsFromAssetIds(
  assetIds: string[],
  assetMap: Map<string, CanonicalAsset>,
): CanonicalEvidenceItem[] {
  const items: CanonicalEvidenceItem[] = [];

  assetIds.forEach((assetId, index) => {
    const asset = assetMap.get(assetId);

    if (!asset) {
      return;
    }

    items.push({
      id: `${assetId}-evidence-${index}`,
      assetId,
      imageUrl: getAssetUrl(asset),
      kind: mapAssetKindToEvidenceKind(asset.kind),
      hash: assetId,
    });
  });

  return items;
}

function getEffectiveEvidenceItems(input: {
  evidenceItems: CanonicalEvidenceItem[];
  sharedEvidenceGroupId?: string;
  sharedEvidenceGroupMap: Map<string, CanonicalSharedEvidenceGroup>;
}) {
  const sharedItems = input.sharedEvidenceGroupId
    ? input.sharedEvidenceGroupMap.get(input.sharedEvidenceGroupId)?.items ?? []
    : [];

  return [...sharedItems, ...input.evidenceItems];
}

function hasTradeProof(items: CanonicalEvidenceItem[]) {
  return items.some((item) =>
    ["receipt", "order_screenshot", "payment_screenshot"].includes(item.kind),
  );
}

function hasSceneProof(items: CanonicalEvidenceItem[]) {
  return items.some((item) =>
    [
      "item_photo",
      "treatment_photo",
      "animal_photo",
      "animal_item_photo",
    ].includes(item.kind),
  );
}

export function computeEvidenceLevelFromEvidenceItems(
  items: CanonicalEvidenceItem[],
): EvidenceLevel {
  if (!items.length) {
    return "needs_attention";
  }

  if (hasTradeProof(items) && hasSceneProof(items)) {
    return "complete";
  }

  return "basic";
}

function inferExpenseCategory(event: CanonicalExpenseEvent): ExpenseCategory {
  const content = `${event.expenseItemsText} ${event.merchantName || ""}`;

  if (/药|消炎|针|片|胶囊/u.test(content)) {
    return "medication";
  }

  if (/粮|砂|用品|尿垫|猫包|玩具/u.test(content)) {
    return "food_supply";
  }

  if (/车|打车|交通/u.test(content)) {
    return "transport_other";
  }

  return "medical";
}

function toSupportEntryStatus(
  verificationStatus: CanonicalSupportEvent["verificationStatus"],
): SupportEntryStatus {
  if (verificationStatus === "confirmed") {
    return "confirmed";
  }

  if (verificationStatus === "pending") {
    return "pending";
  }

  return "unmatched";
}

function toLegacySupportThreadId(caseId: string, supporterUserId: string) {
  return `thread:${caseId}:${supporterUserId}`;
}

function toLegacySupporterUserId(event: CanonicalSupportEvent) {
  if (event.supporterUserId) {
    return event.supporterUserId;
  }

  if (event.supporterNameMasked) {
    return `supporter:${event.supporterNameMasked}`;
  }

  return `supporter:${event.id}`;
}

export function getStructuredExpenseRecords(
  bundle: CanonicalCaseBundle,
): CanonicalExpenseRecord[] {
  if (bundle.expenseRecords?.length) {
    return bundle.expenseRecords;
  }

  const assetMap = getAssetMap(bundle.assets);

  return bundle.events
    .filter((event): event is CanonicalExpenseEvent => event.type === "expense")
    .map((event, index) => {
      const evidenceItems = buildEvidenceItemsFromAssetIds(event.assetIds, assetMap);

      return {
        id: `expense-record:${bundle.case.id}:${index}`,
        caseId: bundle.case.id,
        amount: event.amount,
        currency: event.currency,
        spentAt: event.occurredAt,
        category: inferExpenseCategory(event),
        summary: event.expenseItemsText,
        note: event.merchantName,
        merchantName: event.merchantName,
        evidenceItems,
        evidenceLevel: computeEvidenceLevelFromEvidenceItems(evidenceItems),
        verificationStatus: event.verificationStatus,
        visibility: event.visibility,
        projectedEventId: event.id,
      };
    });
}

export function getStructuredSupportEntries(
  bundle: CanonicalCaseBundle,
): CanonicalSupportEntry[] {
  if (bundle.supportEntries?.length) {
    return bundle.supportEntries;
  }

  const assetMap = getAssetMap(bundle.assets);

  return bundle.events
    .filter((event): event is CanonicalSupportEvent => event.type === "support")
    .map((event, index) => {
      const supporterUserId = toLegacySupporterUserId(event);
      const screenshotItems = buildEvidenceItemsFromAssetIds(event.assetIds, assetMap);

      return {
        id: `support-entry:${bundle.case.id}:${index}`,
        supportThreadId: toLegacySupportThreadId(bundle.case.id, supporterUserId),
        caseId: bundle.case.id,
        supporterUserId,
        supporterNameMasked: event.supporterNameMasked,
        amount: event.amount,
        currency: event.currency,
        supportedAt: event.occurredAt,
        note: event.message,
        screenshotItems,
        screenshotHashes: screenshotItems.map((item) => item.hash || item.id),
        status: toSupportEntryStatus(event.verificationStatus),
        unmatchedReason:
          event.verificationStatus === "rejected" ? "other" : undefined,
        createdAt: event.occurredAt,
        updatedAt: event.occurredAt,
        confirmedAt:
          event.verificationStatus === "confirmed" ? event.occurredAt : undefined,
        visibility: event.visibility,
        projectedEventId: event.id,
      };
    });
}

export function recomputeSupportThreads(
  entries: CanonicalSupportEntry[],
): CanonicalSupportThread[] {
  const groups = new Map<string, CanonicalSupportEntry[]>();

  for (const entry of entries) {
    const group = groups.get(entry.supportThreadId) ?? [];
    group.push(entry);
    groups.set(entry.supportThreadId, group);
  }

  return [...groups.entries()].map(([threadId, group]) => {
    const sorted = [...group].sort((left, right) =>
      left.supportedAt.localeCompare(right.supportedAt),
    );
    const latest = sorted[sorted.length - 1];
    const confirmedEntries = sorted.filter((entry) => entry.status === "confirmed");
    const pendingEntries = sorted.filter((entry) => entry.status === "pending");
    const unmatchedEntries = sorted.filter((entry) => entry.status === "unmatched");

    return {
      id: threadId,
      caseId: latest.caseId,
      supporterUserId: latest.supporterUserId,
      supporterNameMasked: latest.supporterNameMasked,
      createdAt: sorted[0]?.createdAt || latest.createdAt,
      updatedAt: latest.updatedAt,
      totalConfirmedAmount: confirmedEntries.reduce(
        (sum, entry) => sum + entry.amount,
        0,
      ),
      totalPendingAmount: pendingEntries.reduce(
        (sum, entry) => sum + entry.amount,
        0,
      ),
      totalUnmatchedAmount: unmatchedEntries.reduce(
        (sum, entry) => sum + entry.amount,
        0,
      ),
      pendingCount: pendingEntries.length,
      unmatchedCount: unmatchedEntries.length,
      latestStatusSummary:
        latest.status === "confirmed"
          ? "最近一条已确认"
          : latest.status === "pending"
            ? "最近一条待处理"
            : "最近一条未匹配",
    };
  });
}

export function getStructuredSupportThreads(
  bundle: CanonicalCaseBundle,
): CanonicalSupportThread[] {
  if (bundle.supportThreads?.length) {
    return bundle.supportThreads;
  }

  return recomputeSupportThreads(getStructuredSupportEntries(bundle));
}

export function buildLedgerSnapshotFromStructured(
  caseRecord: CanonicalCase,
  input: {
    expenseRecords: CanonicalExpenseRecord[];
    supportEntries: CanonicalSupportEntry[];
  },
): LedgerSnapshot {
  const confirmedExpenseAmount = input.expenseRecords
    .filter(
      (record) =>
        record.verificationStatus === "confirmed" ||
        record.verificationStatus === "manual",
    )
    .reduce((sum, record) => sum + record.amount, 0);
  const supportedAmount = input.supportEntries
    .filter((entry) => entry.status === "confirmed")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const pendingSupportAmount = input.supportEntries
    .filter((entry) => entry.status === "pending")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const verifiedGapAmount = Math.max(confirmedExpenseAmount - supportedAmount, 0);
  const remainingTargetAmount = Math.max(
    caseRecord.targetAmount - Math.max(confirmedExpenseAmount, supportedAmount),
    0,
  );
  const progressPercent =
    caseRecord.targetAmount > 0
      ? Math.min(Math.round((supportedAmount / caseRecord.targetAmount) * 100), 100)
      : 0;

  return {
    targetAmount: caseRecord.targetAmount,
    confirmedExpenseAmount,
    supportedAmount,
    pendingSupportAmount,
    verifiedGapAmount,
    remainingTargetAmount,
    progressPercent,
  };
}

export function getLatestStatusSummary(bundle: CanonicalCaseBundle) {
  const latestProgress = [...bundle.events]
    .filter(
      (
        event,
      ): event is Extract<CanonicalEvent, { type: "progress_update" }> =>
        event.type === "progress_update" && event.visibility === "public",
    )
    .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))[0];

  return latestProgress?.text || bundle.case.initialSummary;
}

export function getLastPublicActivityAt(bundle: CanonicalCaseBundle) {
  const latestPublicEvent = [...bundle.events]
    .filter((event) => event.visibility === "public")
    .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))[0];

  return latestPublicEvent?.occurredAt || bundle.case.updatedAt;
}

function compareEvidenceLevel(left: EvidenceLevel, right: EvidenceLevel) {
  const rank: Record<EvidenceLevel, number> = {
    needs_attention: 0,
    basic: 1,
    complete: 2,
  };

  return rank[left] - rank[right];
}

export function getCaseEvidenceLevel(bundle: CanonicalCaseBundle): EvidenceLevel {
  const sharedEvidenceGroupMap = new Map(
    (bundle.sharedEvidenceGroups ?? []).map((group) => [group.id, group]),
  );

  return getStructuredExpenseRecords(bundle).reduce<EvidenceLevel>(
    (level, record) => {
      const effectiveItems = getEffectiveEvidenceItems({
        evidenceItems: record.evidenceItems,
        sharedEvidenceGroupId: record.sharedEvidenceGroupId,
        sharedEvidenceGroupMap,
      });
      const nextLevel =
        record.evidenceLevel || computeEvidenceLevelFromEvidenceItems(effectiveItems);

      return compareEvidenceLevel(nextLevel, level) > 0 ? nextLevel : level;
    },
    "needs_attention",
  );
}

export function getHomepageEligibility(bundle: CanonicalCaseBundle): {
  status: HomepageEligibilityStatus;
  reason: string;
} {
  if (bundle.case.visibility !== "published") {
    return {
      status: "public_but_not_eligible",
      reason: "未公开，暂不进入首页",
    };
  }

  const hasPublicProgressUpdate = bundle.events.some(
    (event) => event.type === "progress_update" && event.visibility === "public",
  );

  if (!hasPublicProgressUpdate) {
    return {
      status: "missing_update",
      reason: "还缺一条最近更新",
    };
  }

  const expenseRecords = getStructuredExpenseRecords(bundle);

  if (!expenseRecords.length || getCaseEvidenceLevel(bundle) === "needs_attention") {
    return {
      status: "missing_evidence",
      reason: "基础支出证据待补充",
    };
  }

  return {
    status: "eligible",
    reason: "已满足首页条件",
  };
}

function formatCurrency(amount: number) {
  return `¥${amount.toLocaleString("zh-CN")}`;
}

export function getFundingStatusSummary(bundle: CanonicalCaseBundle) {
  const ledger = buildLedgerSnapshotFromStructured(bundle.case, {
    expenseRecords: getStructuredExpenseRecords(bundle),
    supportEntries: getStructuredSupportEntries(bundle),
  });

  if (ledger.supportedAmount >= ledger.confirmedExpenseAmount) {
    return "当前垫付已覆盖";
  }

  if (ledger.verifiedGapAmount > 0 && ledger.verifiedGapAmount <= 2000) {
    return "即将筹满";
  }

  return "‼️ 救助人垫付较多";
}

export function getRecommendationReason(bundle: CanonicalCaseBundle) {
  const ledger = buildLedgerSnapshotFromStructured(bundle.case, {
    expenseRecords: getStructuredExpenseRecords(bundle),
    supportEntries: getStructuredSupportEntries(bundle),
  });
  const now = Date.now();
  const lastPublicActivityAt = Date.parse(getLastPublicActivityAt(bundle));
  const evidenceLevel = getCaseEvidenceLevel(bundle);

  if (
    ledger.confirmedExpenseAmount >= 1000 &&
    ledger.verifiedGapAmount >= 500
  ) {
    return `已垫付 ${formatCurrency(ledger.confirmedExpenseAmount)}，仍待补位`;
  }

  if (
    Number.isFinite(lastPublicActivityAt) &&
    now - lastPublicActivityAt <= RECOMMENDATION_WINDOW_MS &&
    ledger.verifiedGapAmount > 0
  ) {
    return `刚更新病情，当前仍缺 ${formatCurrency(ledger.verifiedGapAmount)}`;
  }

  if (ledger.verifiedGapAmount > 0 && ledger.verifiedGapAmount <= 300) {
    return `接近完成，只差最后 ${formatCurrency(ledger.verifiedGapAmount)}`;
  }

  if (evidenceLevel === "complete" && ledger.verifiedGapAmount > 0) {
    return "证据完整，当前仍有缺口";
  }

  return undefined;
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

function getSupportEntryStatusLabel(status: SupportEntryStatus) {
  switch (status) {
    case "pending":
      return "待处理";
    case "confirmed":
      return "已确认";
    case "unmatched":
      return "未匹配";
    default:
      return "待处理";
  }
}

function getSupportUnmatchedReasonLabel(reason?: SupportUnmatchedReason) {
  switch (reason) {
    case "no_transfer_found":
      return "未查到对应转账";
    case "amount_or_time_mismatch":
      return "金额或时间不匹配";
    case "insufficient_screenshot":
      return "截图信息不足";
    case "duplicate_submission":
      return "疑似重复提交";
    case "unrelated_record":
      return "疑似无关记录";
    case "other":
      return "其他";
    default:
      return undefined;
  }
}

export function toSupportThreadSummaryVMs(
  bundle: CanonicalCaseBundle,
): SupportThreadSummaryVM[] {
  const threads = getStructuredSupportThreads(bundle);
  const entries = getStructuredSupportEntries(bundle);

  return threads.map((thread) => {
    const threadEntries = entries
      .filter((entry) => entry.supportThreadId === thread.id)
      .sort((left, right) => right.supportedAt.localeCompare(left.supportedAt));

    return {
      id: thread.id,
      supporterUserId: thread.supporterUserId,
      supporterNameMasked: thread.supporterNameMasked,
      confirmedAmount: thread.totalConfirmedAmount,
      confirmedAmountLabel: formatCurrency(thread.totalConfirmedAmount),
      pendingCount: thread.pendingCount,
      unmatchedCount: thread.unmatchedCount,
      latestEntryAtLabel: formatDateLabel(thread.updatedAt),
      entries: threadEntries.map((entry) => ({
        id: entry.id,
        amount: entry.amount,
        amountLabel: formatCurrency(entry.amount),
        status: entry.status,
        statusLabel: getSupportEntryStatusLabel(entry.status),
        supportedAtLabel: formatDateLabel(entry.supportedAt),
        note: entry.note,
        hasScreenshot: entry.screenshotItems.length > 0,
        screenshotUrls: entry.screenshotItems
          .map((item) => item.imageUrl)
          .filter((value): value is string => Boolean(value)),
        unmatchedReasonLabel: getSupportUnmatchedReasonLabel(
          entry.unmatchedReason,
        ),
      })),
    };
  });
}

export function getMySupportThreadByCaseId(
  bundle: CanonicalCaseBundle,
  supporterUserId: string,
) {
  return getStructuredSupportThreads(bundle).find(
    (thread) => thread.supporterUserId === supporterUserId,
  );
}
