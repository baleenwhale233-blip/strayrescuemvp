const cloud = require("wx-server-sdk");
const { seedMockData } = require("./mockSeed");

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

function isCloudFileID(value) {
  return typeof value === "string" && value.startsWith("cloud://");
}

function hasOnlyCloudFileIDs(values = []) {
  return Array.isArray(values) && values.every((fileID) => isCloudFileID(fileID));
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

  const [profiles, events, expenses, supportEntries, supportThreads, assets, profileAssets, sharedGroups] =
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
      queryCollection(COLLECTIONS.assets, {
        uploadedByOpenid: _.in(rescuerIds),
        kind: "payment_qr",
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
    const profileAssetIds = [
      profile.avatarAssetId,
      profile.paymentQrAssetId,
    ].filter(Boolean);
    const profileScopedAssets = profileAssets
      .filter((doc) => profileAssetIds.includes(doc.assetId || doc.id || doc._id))
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
      assets: [...caseAssets, ...profileScopedAssets],
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

function formatCurrencyLabel(amount) {
  return `¥${Number(amount || 0).toLocaleString("zh-CN")}`;
}

function formatDateLabel(isoDateTime) {
  const date = new Date(isoDateTime);
  if (Number.isNaN(date.getTime())) {
    return isoDateTime || "";
  }

  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");

  return `${month}-${day} ${hours}:${minutes}`;
}

function toProfilePayload(profile, paymentQrAsset) {
  return {
    openid: profile.openid || profile._openid || profile.userId || profile._id,
    displayName: profile.displayName || profile.name || "",
    avatarUrl: profile.avatarUrl || "",
    wechatId: profile.wechatId || "",
    contactNote: profile.contactNote || "",
    paymentQrAssetId: profile.paymentQrAssetId,
    paymentQrUrl: paymentQrAsset?.fileID || paymentQrAsset?.originalUrl || "",
    hasContactProfile: Boolean(profile.wechatId && profile.paymentQrAssetId),
  };
}

function pickStringField(input, key, fallback = "") {
  if (Object.prototype.hasOwnProperty.call(input || {}, key)) {
    return String(input?.[key] || "").trim();
  }

  return String(fallback || "").trim();
}

async function getProfileByOpenid(openid) {
  return (
    (await getOne(COLLECTIONS.profiles, {
      openid,
    })) ||
    (await getOne(COLLECTIONS.profiles, {
      _id: openid,
    }))
  );
}

async function getMyProfile(openid) {
  const profile = await getProfileByOpenid(openid);

  if (!profile) {
    return ok({
      profile: toProfilePayload({
        openid,
        displayName: "",
        avatarUrl: "",
        verifiedLevel: "wechat",
        joinedAt: nowIso(),
      }),
    });
  }

  const paymentQrAsset = profile.paymentQrAssetId
    ? await getOne(COLLECTIONS.assets, {
        assetId: profile.paymentQrAssetId,
      })
    : undefined;

  return ok({ profile: toProfilePayload(profile, paymentQrAsset) });
}

async function updateMyProfile(openid, input) {
  const existing = await getProfileByOpenid(openid);
  const timestamp = nowIso();
  const displayName = pickStringField(
    input,
    "displayName",
    existing?.displayName || existing?.name,
  );
  const avatarUrl = pickStringField(input, "avatarUrl", existing?.avatarUrl);
  const wechatId = pickStringField(input, "wechatId", existing?.wechatId);
  const contactNote = pickStringField(input, "contactNote", existing?.contactNote);
  const paymentQrFileID = String(input?.paymentQrFileID || "").trim();
  let paymentQrAssetId = existing?.paymentQrAssetId;

  if (paymentQrFileID) {
    if (!isCloudFileID(paymentQrFileID)) {
      return fail("INVALID_PROFILE_ASSET_FILE_ID");
    }

    paymentQrAssetId = `profile_${sanitizeId(openid)}_payment_qr`;
    await db.collection(COLLECTIONS.assets).doc(paymentQrAssetId).set({
      data: {
        assetId: paymentQrAssetId,
        fileID: paymentQrFileID,
        kind: "payment_qr",
        visibility: "private",
        uploadedByOpenid: openid,
        createdAt: existing?.createdAt || timestamp,
        updatedAt: timestamp,
      },
    });
  }

  const profile = {
    openid,
    displayName,
    name: displayName || existing?.name || "当前用户",
    avatarUrl,
    verifiedLevel: existing?.verifiedLevel || "wechat",
    joinedAt: existing?.joinedAt || existing?.createdAt || timestamp,
    createdAt: existing?.createdAt || timestamp,
    updatedAt: timestamp,
    wechatId,
    contactNote,
    paymentQrAssetId,
    stats: existing?.stats || {
      publishedCaseCount: 0,
      verifiedReceiptCount: 0,
    },
  };

  await db.collection(COLLECTIONS.profiles).doc(openid).set({
    data: profile,
  });

  return getMyProfile(openid);
}

async function getMySupportHistory(openid) {
  const entries = await queryCollection(COLLECTIONS.supportEntries, {
    supporterUserId: openid,
    status: "confirmed",
  }, 1000);
  const caseIds = [...new Set(entries.map((entry) => entry.caseId).filter(Boolean))];

  if (!caseIds.length) {
    return ok({
      summary: {
        totalSupportedAmount: 0,
        totalSupportedAmountLabel: formatCurrencyLabel(0),
        supportCases: [],
      },
    });
  }

  const caseDocs = await queryCollection(COLLECTIONS.cases, {
    caseId: _.in(caseIds),
  }, 1000);
  const bundles = await composeBundles(caseDocs);
  const caseMap = new Map(bundles.map((bundle) => [bundle.case.id, bundle]));
  const items = caseIds
    .map((caseId) => {
      const caseEntries = entries.filter((entry) => entry.caseId === caseId);
      const amount = caseEntries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
      const latestSupportedAt = caseEntries
        .map((entry) => entry.supportedAt || entry.confirmedAt || entry.updatedAt || entry.createdAt)
        .filter(Boolean)
        .sort()
        .pop();
      const bundle = caseMap.get(caseId);
      const assetMap = new Map((bundle?.assets || []).map((asset) => [asset.id, asset]));
      const coverAsset = bundle?.case.coverAssetId
        ? assetMap.get(bundle.case.coverAssetId)
        : undefined;
      const faceAsset = bundle?.case.faceIdAssetId
        ? assetMap.get(bundle.case.faceIdAssetId)
        : undefined;
      const coverUrl =
        coverAsset?.watermarkedUrl ||
        coverAsset?.originalUrl ||
        coverAsset?.thumbnailUrl ||
        faceAsset?.watermarkedUrl ||
        faceAsset?.originalUrl ||
        faceAsset?.thumbnailUrl ||
        "";

      return {
        caseId,
        publicCaseId: bundle?.case.publicCaseId,
        animalName: bundle?.case.animalName || "未命名救助",
        animalCoverImageUrl: coverUrl,
        myTotalSupportedAmount: amount,
        myTotalSupportedAmountLabel: formatCurrencyLabel(amount),
        latestSupportedAt,
        latestSupportedAtLabel: latestSupportedAt ? formatDateLabel(latestSupportedAt) : "",
      };
    })
    .filter((item) => item.myTotalSupportedAmount > 0)
    .sort((left, right) => String(right.latestSupportedAt || "").localeCompare(String(left.latestSupportedAt || "")));
  const total = items.reduce((sum, item) => sum + item.myTotalSupportedAmount, 0);

  return ok({
    summary: {
      totalSupportedAmount: total,
      totalSupportedAmountLabel: formatCurrencyLabel(total),
      supportCases: items,
    },
  });
}

async function listHomepageCases() {
  const caseDocs = await queryCollection(COLLECTIONS.cases, {
    visibility: "published",
  });
  const bundles = await composeBundles(caseDocs);

  return ok({ bundles });
}

async function getRescuerHomepage(_, input) {
  let rescuerId = String(input?.rescuerId || "").trim();

  if (!rescuerId && input?.caseId) {
    const caseDoc = await getCaseDocByCaseId(input.caseId);
    rescuerId = caseDoc?.rescuerId || caseDoc?.rescuerOpenid || caseDoc?._openid || "";
  }

  if (!rescuerId) {
    return ok({ rescuer: undefined, bundles: [] });
  }

  const [byOpenid, byRescuerId, profile] = await Promise.all([
    queryCollection(COLLECTIONS.cases, {
      rescuerOpenid: rescuerId,
      visibility: "published",
    }, 1000),
    queryCollection(COLLECTIONS.cases, {
      rescuerId,
      visibility: "published",
    }, 1000),
    getProfileByOpenid(rescuerId),
  ]);
  const caseMap = new Map();

  [...byOpenid, ...byRescuerId].forEach((doc) => {
    caseMap.set(getCaseId(doc), doc);
  });

  const caseDocs = [...caseMap.values()].sort((left, right) =>
    String(right.updatedAt || "").localeCompare(String(left.updatedAt || "")),
  );
  const bundles = await composeBundles(caseDocs);

  return ok({
    rescuer: toCanonicalRescuer(profile || {}, rescuerId),
    bundles,
  });
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

async function getOwnedBundleOrFailure(openid, caseId) {
  const bundle = await getBundleByCaseId(caseId);

  if (!bundle) {
    return { error: fail("CASE_NOT_FOUND") };
  }

  if (bundle.case.rescuerId !== openid) {
    return { error: fail("FORBIDDEN", "Only the rescuer can manage this case.") };
  }

  return { bundle };
}

async function updateCaseProfile(openid, input) {
  const { bundle, error } = await getOwnedBundleOrFailure(openid, input?.caseId);
  if (error) {
    return error;
  }

  const timestamp = nowIso();
  const updateData = {
    updatedAt: timestamp,
  };
  const animalName = String(input?.animalName || "").trim();
  const coverFileID = String(input?.coverFileID || "").trim();

  if (Object.prototype.hasOwnProperty.call(input || {}, "animalName")) {
    if (!animalName) {
      return fail("INVALID_CASE_PROFILE");
    }
    updateData.animalName = animalName;
  }

  if (coverFileID) {
    if (!isCloudFileID(coverFileID)) {
      return fail("INVALID_ASSET_FILE_ID");
    }

    updateData.coverFileID = coverFileID;
    await db.collection(COLLECTIONS.assets).doc(`${bundle.case.id}_cover`).set({
      data: {
        assetId: `${bundle.case.id}_cover`,
        caseId: bundle.case.id,
        fileID: coverFileID,
        kind: "case_cover",
        visibility: "public",
        uploadedByOpenid: openid,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    });
  }

  const caseDoc = await getCaseDocByCaseId(bundle.case.id);
  await db.collection(COLLECTIONS.cases).doc(caseDoc._id).update({
    data: updateData,
  });

  return ok({ bundle: await getBundleByCaseId(bundle.case.id) });
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

async function touchCase(caseId, timestamp = nowIso()) {
  const caseDoc = await getCaseDocByCaseId(caseId);

  if (!caseDoc) {
    return;
  }

  await db.collection(COLLECTIONS.cases).doc(caseDoc._id).update({
    data: {
      updatedAt: timestamp,
    },
  });
}

function getSupportEventId(entryId) {
  return `event_${sanitizeId(entryId)}_support`;
}

function toSupportEventData(entry, status, timestamp) {
  const eventId = entry.projectedEventId || getSupportEventId(entry.entryId);
  const verificationStatus =
    status === "confirmed" ? "confirmed" : status === "unmatched" ? "rejected" : "pending";

  return {
    eventId,
    caseId: entry.caseId,
    type: "support",
    occurredAt: entry.supportedAt || entry.createdAt || timestamp,
    supporterUserId: entry.supporterUserId || entry.supporterOpenid,
    amount: Number(entry.amount || 0),
    currency: entry.currency || "CNY",
    supportSource: entry.supportSource || "donor_claim",
    supporterNameMasked: entry.supporterNameMasked,
    message: entry.note,
    verificationStatus,
    assetIds: [],
    visibility: status === "confirmed" ? "public" : "private",
    supportEntryId: entry.entryId,
    supportThreadId: entry.supportThreadId,
    createdAt: entry.createdAt || timestamp,
    updatedAt: timestamp,
  };
}

async function upsertSupportEvent(entry, status, timestamp) {
  const eventData = toSupportEventData(entry, status, timestamp);
  const eventDoc = await getOne(COLLECTIONS.events, {
    eventId: eventData.eventId,
  });

  if (eventDoc) {
    await db.collection(COLLECTIONS.events).doc(eventDoc._id).update({
      data: eventData,
    });
    return eventData.eventId;
  }

  await db.collection(COLLECTIONS.events).doc(eventData.eventId).set({
    data: eventData,
  });
  return eventData.eventId;
}

async function createAssetDocs(input) {
  const {
    caseId,
    fileIds,
    idPrefix,
    kind,
    visibility,
    uploadedByOpenid,
    timestamp,
  } = input;
  const assetIds = [];

  for (const [index, fileID] of fileIds.entries()) {
    const assetId = `${idPrefix}_asset_${index}`;
    assetIds.push(assetId);
    await db.collection(COLLECTIONS.assets).add({
      data: {
        assetId,
        caseId,
        fileID,
        kind,
        visibility,
        uploadedByOpenid,
        createdAt: timestamp,
      },
    });
  }

  return assetIds;
}

function toEvidenceItemsFromFileIds(fileIds = [], idPrefix = "evidence") {
  return fileIds.map((fileID, index) => ({
    id: `${idPrefix}_${index}`,
    kind: "receipt",
    imageUrl: fileID,
    hash: fileID,
  }));
}

const ALLOWED_PROGRESS_STATUSES = new Set([
  "newly_found",
  "medical",
  "recovery",
  "rehoming",
  "closed",
]);

async function createProgressUpdate(openid, input) {
  const { bundle, error } = await getOwnedBundleOrFailure(openid, input?.caseId);
  if (error) {
    return error;
  }

  const status = String(input?.status || "").trim();
  const statusLabel = String(input?.statusLabel || "").trim();
  const text = String(input?.text || "").trim();
  const assetFileIds = Array.isArray(input?.assetFileIds)
    ? input.assetFileIds.filter(Boolean)
    : [];
  const timestamp = nowIso();
  const occurredAt = input?.occurredAt || timestamp;

  if (!ALLOWED_PROGRESS_STATUSES.has(status) || !statusLabel) {
    return fail("INVALID_STATUS");
  }

  if (!text) {
    return fail("INVALID_TEXT");
  }

  if (!hasOnlyCloudFileIDs(assetFileIds)) {
    return fail("INVALID_ASSET_FILE_ID");
  }

  const eventId = createId("progress_event");
  const assetIds = await createAssetDocs({
    caseId: bundle.case.id,
    fileIds: assetFileIds,
    idPrefix: eventId,
    kind: "progress_photo",
    visibility: "public",
    uploadedByOpenid: openid,
    timestamp,
  });

  await db.collection(COLLECTIONS.events).doc(eventId).set({
    data: {
      eventId,
      caseId: bundle.case.id,
      type: "progress_update",
      occurredAt,
      text,
      statusLabel,
      assetIds,
      visibility: "public",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  });

  const caseDoc = await getCaseDocByCaseId(bundle.case.id);
  await db.collection(COLLECTIONS.cases).doc(caseDoc._id).update({
    data: {
      currentStatus: status,
      currentStatusLabel: statusLabel,
      updatedAt: timestamp,
    },
  });

  return ok({ bundle: await getBundleByCaseId(bundle.case.id) });
}

async function createExpenseRecord(openid, input) {
  const { bundle, error } = await getOwnedBundleOrFailure(openid, input?.caseId);
  if (error) {
    return error;
  }

  const amount = Number(input?.amount || 0);
  const summary = String(input?.summary || "").trim();
  const evidenceFileIds = Array.isArray(input?.evidenceFileIds)
    ? input.evidenceFileIds.filter(Boolean)
    : [];
  const timestamp = nowIso();
  const spentAt = input?.spentAt || timestamp;

  if (!amount || Number.isNaN(amount) || !summary) {
    return fail("INVALID_EXPENSE_RECORD");
  }

  if (!hasOnlyCloudFileIDs(evidenceFileIds)) {
    return fail("INVALID_ASSET_FILE_ID");
  }

  const recordId = createId("expense_record");
  const eventId = createId("expense_event");
  const assetIds = await createAssetDocs({
    caseId: bundle.case.id,
    fileIds: evidenceFileIds,
    idPrefix: recordId,
    kind: "receipt",
    visibility: "public",
    uploadedByOpenid: openid,
    timestamp,
  });

  await db.collection(COLLECTIONS.expenses).doc(recordId).set({
    data: {
      recordId,
      caseId: bundle.case.id,
      amount,
      currency: "CNY",
      spentAt,
      category: input?.category || "medical",
      summary,
      note: input?.note,
      merchantName: input?.merchantName,
      evidenceItems: toEvidenceItemsFromFileIds(evidenceFileIds, recordId),
      evidenceLevel: evidenceFileIds.length ? "basic" : "needs_attention",
      verificationStatus: "manual",
      visibility: "public",
      projectedEventId: eventId,
      expenseItems: Array.isArray(input?.expenseItems) ? input.expenseItems : [],
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  });

  await db.collection(COLLECTIONS.events).doc(eventId).set({
    data: {
      eventId,
      caseId: bundle.case.id,
      type: "expense",
      occurredAt: spentAt,
      amount,
      currency: "CNY",
      merchantName: input?.merchantName,
      expenseItemsText: summary,
      verificationStatus: "manual",
      assetIds,
      visibility: "public",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  });

  await touchCase(bundle.case.id, timestamp);

  return ok({ bundle: await getBundleByCaseId(bundle.case.id) });
}

async function createBudgetAdjustment(openid, input) {
  const { bundle, error } = await getOwnedBundleOrFailure(openid, input?.caseId);
  if (error) {
    return error;
  }

  const previousTargetAmount = Number(
    input?.previousTargetAmount ?? bundle.case.targetAmount ?? 0,
  );
  const newTargetAmount = Number(input?.newTargetAmount || 0);
  const reason = String(input?.reason || "").trim();
  const timestamp = nowIso();
  const occurredAt = input?.occurredAt || timestamp;

  if (!newTargetAmount || Number.isNaN(newTargetAmount) || !reason) {
    return fail("INVALID_TARGET_AMOUNT");
  }

  const eventId = createId("budget_event");
  await db.collection(COLLECTIONS.events).doc(eventId).set({
    data: {
      eventId,
      caseId: bundle.case.id,
      type: "budget_adjustment",
      occurredAt,
      previousTargetAmount,
      newTargetAmount,
      reason,
      assetIds: [],
      visibility: "public",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  });

  const caseDoc = await getCaseDocByCaseId(bundle.case.id);
  await db.collection(COLLECTIONS.cases).doc(caseDoc._id).update({
    data: {
      targetAmount: newTargetAmount,
      updatedAt: timestamp,
    },
  });

  return ok({ bundle: await getBundleByCaseId(bundle.case.id) });
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
  const screenshotFileIds = Array.isArray(input?.screenshotFileIds)
    ? input.screenshotFileIds.filter(Boolean)
    : [];
  if (screenshotFileIds.some((fileID) => !isCloudFileID(fileID))) {
    return fail("INVALID_SCREENSHOT_FILE_ID");
  }

  const existingHashes = new Set(existingEntries.flatMap((entry) => entry.screenshotHashes || entry.screenshotFileIds || []));

  if (screenshotFileIds.some((fileID) => existingHashes.has(fileID))) {
    return fail("DUPLICATE_SUPPORT_SCREENSHOT");
  }

  if (recentEntries.some((entry) => Date.parse(entry.createdAt || entry.supportedAt) >= lastTenMinutes)) {
    return fail("SUPPORT_ENTRY_RATE_LIMIT_10_MIN");
  }

  if (
    recentEntries.filter((entry) => Date.parse(entry.createdAt || entry.supportedAt) >= lastDay)
      .length >= 3
  ) {
    return fail("SUPPORT_ENTRY_RATE_LIMIT_24_HOUR");
  }

  const timestamp = nowIso();
  const entryId = createId("support_entry");
  const projectedEventId = getSupportEventId(entryId);

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
      projectedEventId,
    },
  });

  await upsertSupportEvent(
    {
      entryId,
      projectedEventId,
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
      createdAt: timestamp,
    },
    "pending",
    timestamp,
  );
  await updateSupportThread(threadId);
  await touchCase(caseId, timestamp);

  return ok({ bundle: await getBundleByCaseId(caseId) });
}

async function createManualSupportEntry(openid, input) {
  const { bundle, error } = await getOwnedBundleOrFailure(openid, input?.caseId);
  if (error) {
    return error;
  }

  const amount = Number(input?.amount || 0);
  const supporterNameMasked = String(input?.supporterNameMasked || "").trim() || "线下支持";
  const note = input?.note || "救助人手动记一笔";
  const timestamp = nowIso();
  const supportedAt = input?.supportedAt || timestamp;

  if (!amount || Number.isNaN(amount)) {
    return fail("INVALID_AMOUNT");
  }

  const manualSupporterId = `manual_${sanitizeId(bundle.case.id)}_${sanitizeId(supporterNameMasked)}`;
  const threadId = `thread_${sanitizeId(bundle.case.id)}_${manualSupporterId}`;
  const entryId = createId("support_entry_manual");
  const projectedEventId = getSupportEventId(entryId);

  await db.collection(COLLECTIONS.supportEntries).doc(entryId).set({
    data: {
      entryId,
      supportThreadId: threadId,
      caseId: bundle.case.id,
      supporterOpenid: manualSupporterId,
      supporterUserId: manualSupporterId,
      supporterNameMasked,
      amount,
      currency: "CNY",
      supportedAt,
      note,
      screenshotFileIds: [],
      screenshotHashes: [],
      status: "confirmed",
      createdAt: timestamp,
      updatedAt: timestamp,
      confirmedAt: timestamp,
      confirmedByOpenid: openid,
      confirmedByUserId: openid,
      visibility: "private",
      supportSource: "manual_entry",
      projectedEventId,
    },
  });

  await upsertSupportEvent(
    {
      entryId,
      projectedEventId,
      supportThreadId: threadId,
      caseId: bundle.case.id,
      supporterOpenid: manualSupporterId,
      supporterUserId: manualSupporterId,
      supporterNameMasked,
      amount,
      currency: "CNY",
      supportedAt,
      note,
      supportSource: "manual_entry",
      screenshotFileIds: [],
      createdAt: timestamp,
    },
    "confirmed",
    timestamp,
  );
  await updateSupportThread(threadId);
  await touchCase(bundle.case.id, timestamp);

  return ok({ bundle: await getBundleByCaseId(bundle.case.id) });
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
    updateData.visibility = "private";
    updateData.unmatchedReason = _.remove();
    updateData.unmatchedNote = _.remove();
  } else {
    updateData.unmatchedReason = input?.reason || "other";
    updateData.unmatchedNote = input?.note;
    updateData.visibility = "private";
    updateData.confirmedAt = _.remove();
    updateData.confirmedByOpenid = _.remove();
    updateData.confirmedByUserId = _.remove();
  }

  await db.collection(COLLECTIONS.supportEntries).doc(entryDoc._id).update({
    data: updateData,
  });

  await upsertSupportEvent(
    {
      ...entryDoc,
      ...updateData,
      status,
      updatedAt: timestamp,
    },
    status,
    timestamp,
  );
  await updateSupportThread(entryDoc.supportThreadId);
  await touchCase(input?.caseId, timestamp);

  return ok({ bundle: await getBundleByCaseId(input?.caseId) });
}

async function seedMockCases(openid, input) {
  const result = await seedMockData({
    db,
    collections: COLLECTIONS,
    openid,
    input,
  });

  return ok(result);
}

const handlers = {
  listHomepageCases: (_, input) => listHomepageCases(input),
  getRescuerHomepage,
  searchCaseByPublicId: (_, input) => searchCaseByPublicId(input),
  getCaseDetail: (_, input) => getCaseDetail(input),
  getOwnerWorkbench: (openid) => getOwnerWorkbench(openid),
  getOwnerCaseDetail,
  getMyProfile,
  updateMyProfile,
  getMySupportHistory,
  updateCaseProfile,
  saveDraftCase,
  publishCase,
  createSupportEntry,
  createManualSupportEntry,
  reviewSupportEntry,
  createProgressUpdate,
  createExpenseRecord,
  createBudgetAdjustment,
  seedMockCases,
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
