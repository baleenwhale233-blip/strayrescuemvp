const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();
const _ = db.command;

const COLLECTIONS = {
  profiles: "user_profiles",
  cases: "rescue_cases",
  events: "case_events",
  expenses: "expense_records",
  supportThreads: "support_threads",
  supportEntries: "support_entries",
  assets: "evidence_assets",
  sharedEvidenceGroups: "shared_evidence_groups",
};

function ok(data) {
  return { ok: true, data };
}

function fail(error, message) {
  return { ok: false, error, message };
}

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizeId(value) {
  return String(value || "unknown").replace(/[^a-zA-Z0-9_-]/g, "_");
}

function normalizeOpenid(value) {
  return value || "anonymous";
}

function getCaseId(doc) {
  return doc.caseId || doc.id || doc._id;
}

function getOpenid(event) {
  const context = cloud.getWXContext();
  return normalizeOpenid(context.OPENID || event?.openid);
}

async function queryCollection(name, where = {}, limit = 100) {
  try {
    const result = await db.collection(name).where(where).limit(limit).get();
    return result.data || [];
  } catch (error) {
    console.warn(`[rescueApi] ${name} query failed`, error);
    return [];
  }
}

async function getOne(name, where) {
  const items = await queryCollection(name, where, 1);
  return items[0];
}

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
  return {
    id: doc.assetId || doc.id || doc._id,
    kind: doc.kind || "other",
    originalUrl: doc.fileID || doc.originalUrl,
    watermarkedUrl: doc.watermarkedUrl,
    thumbnailUrl: doc.thumbnailUrl || doc.fileID,
  };
}

function toCanonicalSharedEvidenceGroup(doc) {
  return {
    id: doc.groupId || doc.id || doc._id,
    caseId: doc.caseId,
    title: doc.title,
    items: doc.items || [],
  };
}

async function composeBundles(caseDocs) {
  const cases = caseDocs.map(toCanonicalCase);
  const caseIds = cases.map((item) => item.id).filter(Boolean);
  const rescuerIds = cases.map((item) => item.rescuerId).filter(Boolean);

  if (!caseIds.length) {
    return [];
  }

  const [profiles, events, expenses, supportEntries, supportThreads, assets, sharedGroups] =
    await Promise.all([
      queryCollection(COLLECTIONS.profiles, {
        openid: _.in(rescuerIds),
      }),
      queryCollection(COLLECTIONS.events, {
        caseId: _.in(caseIds),
      }),
      queryCollection(COLLECTIONS.expenses, {
        caseId: _.in(caseIds),
      }),
      queryCollection(COLLECTIONS.supportEntries, {
        caseId: _.in(caseIds),
      }),
      queryCollection(COLLECTIONS.supportThreads, {
        caseId: _.in(caseIds),
      }),
      queryCollection(COLLECTIONS.assets, {
        caseId: _.in(caseIds),
      }),
      queryCollection(COLLECTIONS.sharedEvidenceGroups, {
        caseId: _.in(caseIds),
      }),
    ]);

  const profileMap = new Map(profiles.map((profile) => [profileKey(profile), profile]));
  const canonicalEntries = supportEntries.map(toCanonicalSupportEntry);
  const recomputedThreads = recomputeThreads(canonicalEntries);

  return cases.map((caseRecord) => {
    const caseId = caseRecord.id;
    const caseDoc = caseDocs.find((doc) => getCaseId(doc) === caseId) || {};
    const profile = profileMap.get(caseRecord.rescuerId) || {};
    const caseAssets = assets
      .filter((doc) => doc.caseId === caseId)
      .map(toCanonicalAsset);

    if (caseDoc.coverFileID) {
      caseAssets.push({
        id: `${caseId}_cover`,
        kind: "case_cover",
        originalUrl: caseDoc.coverFileID,
        watermarkedUrl: caseDoc.coverFileID,
        thumbnailUrl: caseDoc.coverFileID,
      });
    }

    return {
      sourceKind: "remote",
      rescuer: toCanonicalRescuer(profile, caseRecord.rescuerId),
      case: caseRecord,
      events: events
        .filter((doc) => doc.caseId === caseId)
        .map(toCanonicalEvent),
      assets: caseAssets,
      sharedEvidenceGroups: sharedGroups
        .filter((doc) => doc.caseId === caseId)
        .map(toCanonicalSharedEvidenceGroup),
      expenseRecords: expenses
        .filter((doc) => doc.caseId === caseId)
        .map(toCanonicalExpenseRecord),
      supportEntries: canonicalEntries.filter((entry) => entry.caseId === caseId),
      supportThreads: (supportThreads.length
        ? supportThreads.map((doc) => ({
            id: doc.threadId || doc.id || doc._id,
            caseId: doc.caseId,
            supporterUserId: doc.supporterUserId || doc.supporterOpenid,
            supporterNameMasked: doc.supporterNameMasked,
            createdAt: doc.createdAt || nowIso(),
            updatedAt: doc.updatedAt || doc.createdAt || nowIso(),
            totalConfirmedAmount: Number(doc.totalConfirmedAmount || 0),
            totalPendingAmount: Number(doc.totalPendingAmount || 0),
            totalUnmatchedAmount: Number(doc.totalUnmatchedAmount || 0),
            pendingCount: Number(doc.pendingCount || 0),
            unmatchedCount: Number(doc.unmatchedCount || 0),
            latestStatusSummary: doc.latestStatusSummary,
          }))
        : recomputedThreads
      ).filter((thread) => thread.caseId === caseId),
    };
  });
}

async function getBundleByCaseId(caseId) {
  if (!caseId) {
    return undefined;
  }

  const caseDoc = await getCaseDocByCaseId(caseId);
  const bundles = await composeBundles([caseDoc].filter(Boolean));

  return bundles[0];
}

async function getCaseDocByCaseId(caseId) {
  if (!caseId) {
    return undefined;
  }

  return (
    (await getOne(COLLECTIONS.cases, {
      caseId,
    })) ||
    (await getOne(COLLECTIONS.cases, {
      _id: caseId,
    }))
  );
}

async function listHomepageCases() {
  const caseDocs = await queryCollection(COLLECTIONS.cases, {
    visibility: "published",
  });
  const bundles = await composeBundles(caseDocs);

  return ok({ bundles });
}

async function searchCaseByPublicId(input) {
  const raw = String(input?.publicCaseId || "").trim().toUpperCase();
  const digits = raw.replace(/[^\d]/g, "");
  const publicCaseId = digits ? `JM${digits}` : raw;
  const caseDoc = await getOne(COLLECTIONS.cases, {
    publicCaseId,
    visibility: "published",
  });
  const bundles = await composeBundles(caseDoc ? [caseDoc] : []);

  return ok({ bundle: bundles[0] });
}

async function getCaseDetail(input) {
  return ok({ bundle: await getBundleByCaseId(input?.caseId) });
}

async function getOwnerWorkbench(openid) {
  const caseDocs = await queryCollection(COLLECTIONS.cases, {
    rescuerOpenid: openid,
  });
  const bundles = await composeBundles(caseDocs);

  return ok({ bundles });
}

async function getOwnerCaseDetail(openid, input) {
  const bundle = await getBundleByCaseId(input?.caseId);

  if (!bundle) {
    return fail("CASE_NOT_FOUND");
  }

  if (bundle.case.rescuerId !== openid) {
    return fail("FORBIDDEN", "Only the rescuer can manage this case.");
  }

  return ok({ bundle });
}

async function saveDraftCase(openid, input) {
  const draft = input?.draft || {};
  const caseId = draft.caseId || createId("case");
  const timestamp = nowIso();

  await db.collection(COLLECTIONS.cases).doc(caseId).set({
    data: {
      caseId,
      publicCaseId: draft.publicCaseId,
      rescuerOpenid: openid,
      animalName: draft.animalName || draft.name || "未命名救助",
      species: draft.species || "cat",
      coverFileID: draft.coverFileID,
      initialSummary: draft.initialSummary || draft.summary || "",
      currentStatus: draft.currentStatus || "draft",
      currentStatusLabel: draft.currentStatusLabel || "草稿中",
      targetAmount: Number(draft.targetAmount || draft.budget || 0),
      visibility: "draft",
      createdAt: draft.createdAt || timestamp,
      updatedAt: timestamp,
    },
  });

  return ok({ bundle: await getBundleByCaseId(caseId) });
}

async function publishCase(openid, input) {
  const caseDoc = await getCaseDocByCaseId(input?.caseId);
  const bundle = await getBundleByCaseId(input?.caseId);

  if (!bundle) {
    return fail("CASE_NOT_FOUND");
  }

  if (bundle.case.rescuerId !== openid) {
    return fail("FORBIDDEN", "Only the rescuer can publish this case.");
  }

  await db.collection(COLLECTIONS.cases).doc(caseDoc._id).update({
    data: {
      visibility: "published",
      updatedAt: nowIso(),
    },
  });

  return ok({ bundle: await getBundleByCaseId(bundle.case.id) });
}

async function updateSupportThread(threadId) {
  const entryDocs = await queryCollection(COLLECTIONS.supportEntries, {
    supportThreadId: threadId,
  });
  const entries = entryDocs.map(toCanonicalSupportEntry);
  const thread = recomputeThread(threadId, entries);

  await db.collection(COLLECTIONS.supportThreads).doc(threadId).set({
    data: {
      threadId,
      caseId: thread.caseId,
      supporterOpenid: thread.supporterUserId,
      supporterUserId: thread.supporterUserId,
      supporterNameMasked: thread.supporterNameMasked,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
      totalConfirmedAmount: thread.totalConfirmedAmount,
      totalPendingAmount: thread.totalPendingAmount,
      totalUnmatchedAmount: thread.totalUnmatchedAmount,
      pendingCount: thread.pendingCount,
      unmatchedCount: thread.unmatchedCount,
      latestStatusSummary: thread.latestStatusSummary,
    },
  });
}

async function createSupportEntry(openid, input) {
  const caseId = input?.caseId;
  const amount = Number(input?.amount || 0);
  const supportedAt = String(input?.supportedAt || "").trim();

  if (!caseId) {
    return fail("CASE_NOT_FOUND");
  }

  if (!amount || Number.isNaN(amount)) {
    return fail("INVALID_AMOUNT");
  }

  if (!supportedAt) {
    return fail("INVALID_SUPPORTED_AT");
  }

  const bundle = await getBundleByCaseId(caseId);
  if (!bundle || bundle.case.visibility !== "published") {
    return fail("CASE_NOT_FOUND");
  }

  const threadId = `thread_${sanitizeId(caseId)}_${sanitizeId(openid)}`;
  const existingEntries = await queryCollection(COLLECTIONS.supportEntries, {
    supportThreadId: threadId,
  });
  const createdAtMs = Date.now();
  const lastTenMinutes = createdAtMs - 10 * 60 * 1000;
  const lastDay = createdAtMs - 24 * 60 * 60 * 1000;
  const recentEntries = existingEntries.filter((entry) => {
    const createdAt = Date.parse(entry.createdAt || entry.supportedAt);
    return Number.isFinite(createdAt);
  });

  if (recentEntries.some((entry) => Date.parse(entry.createdAt || entry.supportedAt) >= lastTenMinutes)) {
    return fail("SUPPORT_ENTRY_RATE_LIMIT_10_MIN");
  }

  if (
    recentEntries.filter((entry) => Date.parse(entry.createdAt || entry.supportedAt) >= lastDay)
      .length >= 3
  ) {
    return fail("SUPPORT_ENTRY_RATE_LIMIT_24_HOUR");
  }

  const screenshotFileIds = input?.screenshotFileIds || [];
  const existingHashes = new Set(existingEntries.flatMap((entry) => entry.screenshotHashes || entry.screenshotFileIds || []));

  if (screenshotFileIds.some((fileID) => existingHashes.has(fileID))) {
    return fail("DUPLICATE_SUPPORT_SCREENSHOT");
  }

  const timestamp = nowIso();
  const entryId = createId("support_entry");

  for (const [index, fileID] of screenshotFileIds.entries()) {
    await db.collection(COLLECTIONS.assets).add({
      data: {
        assetId: `${entryId}_proof_${index}`,
        caseId,
        fileID,
        kind: "support_proof",
        visibility: "private",
        uploadedByOpenid: openid,
        createdAt: timestamp,
      },
    });
  }

  await db.collection(COLLECTIONS.supportEntries).doc(entryId).set({
    data: {
      entryId,
      supportThreadId: threadId,
      caseId,
      supporterOpenid: openid,
      supporterUserId: openid,
      supporterNameMasked: input?.supporterNameMasked || "爱心人士",
      amount,
      currency: "CNY",
      supportedAt,
      note: input?.note,
      screenshotFileIds,
      screenshotHashes: screenshotFileIds,
      status: "pending",
      createdAt: timestamp,
      updatedAt: timestamp,
      visibility: "private",
    },
  });

  await updateSupportThread(threadId);

  return ok({ bundle: await getBundleByCaseId(caseId) });
}

async function reviewSupportEntry(openid, input) {
  const bundle = await getBundleByCaseId(input?.caseId);

  if (!bundle) {
    return fail("CASE_NOT_FOUND");
  }

  if (bundle.case.rescuerId !== openid) {
    return fail("FORBIDDEN", "Only the rescuer can review support entries.");
  }

  const entryDoc = await getOne(COLLECTIONS.supportEntries, {
    entryId: input?.entryId,
    caseId: input?.caseId,
  });

  if (!entryDoc) {
    return fail("SUPPORT_ENTRY_NOT_FOUND");
  }

  const timestamp = nowIso();
  const status = input?.status === "confirmed" ? "confirmed" : "unmatched";
  const updateData = {
    status,
    updatedAt: timestamp,
  };

  if (status === "confirmed") {
    updateData.confirmedAt = timestamp;
    updateData.confirmedByOpenid = openid;
    updateData.confirmedByUserId = openid;
    updateData.unmatchedReason = _.remove();
    updateData.unmatchedNote = _.remove();
  } else {
    updateData.unmatchedReason = input?.reason || "other";
    updateData.unmatchedNote = input?.note;
    updateData.confirmedAt = _.remove();
    updateData.confirmedByOpenid = _.remove();
    updateData.confirmedByUserId = _.remove();
  }

  await db.collection(COLLECTIONS.supportEntries).doc(entryDoc._id).update({
    data: updateData,
  });

  await updateSupportThread(entryDoc.supportThreadId);

  return ok({ bundle: await getBundleByCaseId(input?.caseId) });
}

const handlers = {
  listHomepageCases: (_, input) => listHomepageCases(input),
  searchCaseByPublicId: (_, input) => searchCaseByPublicId(input),
  getCaseDetail: (_, input) => getCaseDetail(input),
  getOwnerWorkbench: (openid) => getOwnerWorkbench(openid),
  getOwnerCaseDetail,
  saveDraftCase,
  publishCase,
  createSupportEntry,
  reviewSupportEntry,
};

exports.main = async (event = {}) => {
  const action = event.action;
  const handler = handlers[action];

  if (!handler) {
    return fail("UNKNOWN_ACTION", `Unsupported action: ${action}`);
  }

  try {
    const openid = getOpenid(event);
    return await handler(openid, event.input || {});
  } catch (error) {
    console.error("[rescueApi] unhandled error", error);
    return fail("INTERNAL_ERROR", error.message);
  }
};
