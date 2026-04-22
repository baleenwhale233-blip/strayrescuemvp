const {
  getAssetFileID,
  getCaseId,
  nowIso,
} = require("../runtime");

function profileKey(profile) {
  return profile.openid || profile._openid || profile.userId || profile.id || profile._id;
}

function toCanonicalRescuer(profile, rescuerOpenid) {
  return {
    id: profileKey(profile) || rescuerOpenid,
    name: profile.displayName || profile.name || "当前救助人",
    avatarUrl: profile.avatarUrl,
    avatarAssetId: profile.avatarAssetId,
    verifiedLevel: profile.verifiedLevel || "wechat",
    joinedAt: profile.joinedAt || profile.createdAt || nowIso(),
    wechatId: profile.wechatId,
    paymentQrAssetId: profile.paymentQrAssetId,
    contactNote: profile.contactNote,
    stats: profile.stats || {
      publishedCaseCount: 0,
      verifiedReceiptCount: 0,
    },
  };
}

function toCanonicalCase(doc) {
  const caseId = getCaseId(doc);

  return {
    id: caseId,
    publicCaseId: doc.publicCaseId,
    rescuerId: doc.rescuerId || doc.rescuerOpenid || doc._openid,
    animalName: doc.animalName || doc.name || "未命名救助",
    species: doc.species || "cat",
    coverAssetId: doc.coverAssetId || (doc.coverFileID ? `${caseId}_cover` : undefined),
    faceIdAssetId: doc.faceIdAssetId,
    foundAt: doc.foundAt,
    foundLocationText: doc.foundLocationText,
    initialSummary: doc.initialSummary || doc.summary || "待补充事件说明",
    currentStatus: doc.currentStatus || "medical",
    currentStatusLabel: doc.currentStatusLabel || doc.statusLabel || "医疗救助中",
    targetAmount: Number(doc.targetAmount ?? doc.budget ?? 0),
    visibility: doc.visibility || doc.caseVisibility || "draft",
    createdAt: doc.createdAt || nowIso(),
    updatedAt: doc.updatedAt || doc.createdAt || nowIso(),
  };
}

function toCanonicalEvent(doc) {
  const caseId = doc.caseId;
  const base = {
    id: doc.eventId || doc.id || doc._id,
    caseId,
    type: doc.type,
    occurredAt: doc.occurredAt || doc.createdAt || nowIso(),
    assetIds: doc.assetIds || [],
    visibility: doc.visibility || "public",
  };

  if (doc.type === "expense") {
    return {
      ...base,
      amount: Number(doc.amount || 0),
      currency: doc.currency || "CNY",
      merchantName: doc.merchantName,
      expenseItemsText: doc.expenseItemsText || doc.summary || "",
      verificationStatus: doc.verificationStatus || "manual",
    };
  }

  if (doc.type === "support") {
    return {
      ...base,
      supporterUserId: doc.supporterUserId || doc.supporterOpenid,
      amount: Number(doc.amount || 0),
      currency: doc.currency || "CNY",
      supportSource: doc.supportSource || "platform_form",
      supporterNameMasked: doc.supporterNameMasked,
      message: doc.message || doc.note,
      verificationStatus: doc.verificationStatus || "pending",
    };
  }

  if (doc.type === "budget_adjustment") {
    return {
      ...base,
      previousTargetAmount: Number(doc.previousTargetAmount || 0),
      newTargetAmount: Number(doc.newTargetAmount || 0),
      reason: doc.reason || "",
    };
  }

  return {
    ...base,
    text: doc.text || doc.summary || "",
    statusLabel: doc.statusLabel,
  };
}

function toEvidenceItem(fileID, index, prefix = "evidence") {
  return {
    id: `${prefix}-${index}`,
    kind: "payment_screenshot",
    imageUrl: fileID,
    hash: fileID,
  };
}

function toCanonicalExpenseRecord(doc) {
  return {
    id: doc.recordId || doc.id || doc._id,
    caseId: doc.caseId,
    amount: Number(doc.amount || 0),
    currency: doc.currency || "CNY",
    spentAt: doc.spentAt || doc.createdAt || nowIso(),
    category: doc.category || "medical",
    summary: doc.summary || "",
    note: doc.note,
    merchantName: doc.merchantName,
    expenseItems: Array.isArray(doc.expenseItems) ? doc.expenseItems : [],
    evidenceItems: doc.evidenceItems || (doc.fileIDs || []).map(toEvidenceItem),
    sharedEvidenceGroupId: doc.sharedEvidenceGroupId,
    evidenceLevel: doc.evidenceLevel || "needs_attention",
    verificationStatus: doc.verificationStatus || "manual",
    visibility: doc.visibility || "public",
    projectedEventId: doc.projectedEventId,
  };
}

function toCanonicalSupportEntry(doc) {
  const fileIDs = doc.screenshotFileIds || doc.screenshotFileIDs || [];

  return {
    id: doc.entryId || doc.id || doc._id,
    supportThreadId: doc.supportThreadId,
    caseId: doc.caseId,
    supporterUserId: doc.supporterUserId || doc.supporterOpenid,
    supporterNameMasked: doc.supporterNameMasked,
    amount: Number(doc.amount || 0),
    currency: doc.currency || "CNY",
    supportedAt: doc.supportedAt || doc.createdAt || nowIso(),
    note: doc.note,
    screenshotItems:
      doc.screenshotItems ||
      fileIDs.map((fileID, index) =>
        toEvidenceItem(fileID, index, `support-screenshot-${index}`),
      ),
    screenshotHashes: doc.screenshotHashes || fileIDs,
    status: doc.status || "pending",
    unmatchedReason: doc.unmatchedReason,
    unmatchedNote: doc.unmatchedNote,
    createdAt: doc.createdAt || nowIso(),
    updatedAt: doc.updatedAt || doc.createdAt || nowIso(),
    confirmedAt: doc.confirmedAt,
    confirmedByUserId: doc.confirmedByUserId || doc.confirmedByOpenid,
    visibility: doc.visibility || "private",
    projectedEventId: doc.projectedEventId,
  };
}

function recomputeThread(threadId, entries) {
  const sorted = [...entries].sort((left, right) =>
    String(left.supportedAt).localeCompare(String(right.supportedAt)),
  );
  const latest = sorted[sorted.length - 1];
  const confirmed = sorted.filter((entry) => entry.status === "confirmed");
  const pending = sorted.filter((entry) => entry.status === "pending");
  const unmatched = sorted.filter((entry) => entry.status === "unmatched");

  return {
    id: threadId,
    caseId: latest.caseId,
    supporterUserId: latest.supporterUserId,
    supporterNameMasked: latest.supporterNameMasked,
    createdAt: sorted[0]?.createdAt || latest.createdAt,
    updatedAt: latest.updatedAt,
    totalConfirmedAmount: confirmed.reduce((sum, entry) => sum + entry.amount, 0),
    totalPendingAmount: pending.reduce((sum, entry) => sum + entry.amount, 0),
    totalUnmatchedAmount: unmatched.reduce((sum, entry) => sum + entry.amount, 0),
    pendingCount: pending.length,
    unmatchedCount: unmatched.length,
    latestStatusSummary:
      latest.status === "confirmed"
        ? "最近一条已确认"
        : latest.status === "pending"
          ? "最近一条待处理"
          : "最近一条未匹配",
  };
}

function recomputeThreads(entries) {
  const groups = new Map();

  for (const entry of entries) {
    const group = groups.get(entry.supportThreadId) || [];
    group.push(entry);
    groups.set(entry.supportThreadId, group);
  }

  return [...groups.entries()].map(([threadId, group]) =>
    recomputeThread(threadId, group),
  );
}

function toCanonicalAsset(doc) {
  const fileID = doc._fileID || getAssetFileID(doc);
  const url = doc._tempFileURL || doc.watermarkedUrl || doc.originalUrl || doc.thumbnailUrl || fileID;

  return {
    id: doc.assetId || doc.id || doc._id,
    kind: doc.kind || "other",
    originalUrl: url,
    watermarkedUrl: doc._tempFileURL || doc.watermarkedUrl,
    thumbnailUrl: doc._tempFileURL || doc.thumbnailUrl || url,
  };
}

function getCanonicalAssetUrl(asset) {
  return asset?.watermarkedUrl || asset?.originalUrl || asset?.thumbnailUrl || "";
}

function getHeroImageUrlFromBundle(bundle) {
  if (!bundle) {
    return "";
  }

  const assetMap = new Map((bundle.assets || []).map((asset) => [asset.id, asset]));
  const getAssetUrlById = (assetId) =>
    assetId ? getCanonicalAssetUrl(assetMap.get(assetId)) : "";
  const sortedProgressEvents = [...(bundle.events || [])]
    .filter((event) => event.type === "progress_update" && event.visibility === "public")
    .sort((left, right) => String(right.occurredAt || "").localeCompare(String(left.occurredAt || "")));

  for (const event of sortedProgressEvents) {
    const progressAssetUrl = (event.assetIds || [])
      .map((assetId) => getAssetUrlById(assetId))
      .find(Boolean);

    if (progressAssetUrl) {
      return (
        getAssetUrlById(bundle.case?.coverAssetId) ||
        getAssetUrlById(bundle.case?.faceIdAssetId) ||
        progressAssetUrl
      );
    }
  }

  return getAssetUrlById(bundle.case?.coverAssetId) || getAssetUrlById(bundle.case?.faceIdAssetId);
}

function toCanonicalSharedEvidenceGroup(doc) {
  return {
    id: doc.groupId || doc.id || doc._id,
    caseId: doc.caseId,
    title: doc.title,
    items: doc.items || [],
  };
}

module.exports = {
  getCanonicalAssetUrl,
  getHeroImageUrlFromBundle,
  profileKey,
  recomputeThread,
  recomputeThreads,
  toCanonicalAsset,
  toCanonicalCase,
  toCanonicalEvent,
  toCanonicalExpenseRecord,
  toCanonicalRescuer,
  toCanonicalSharedEvidenceGroup,
  toCanonicalSupportEntry,
};
