const cloud = require("wx-server-sdk");
const { seedMockData } = require("./mockSeed");
const {
  createId,
  createRuntime,
  fail,
  getAssetFileID,
  getCaseId,
  hasOnlyCloudFileIDs,
  isCloudFileID,
  nowIso,
  ok,
  sanitizeId,
} = require("./src/runtime");
const {
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
} = require("./src/adapters/canonical");
const { createBundleService } = require("./src/services/bundles");
const { createProfileService } = require("./src/services/profile");
const { createRecordsService } = require("./src/services/records");
const { createSupportService } = require("./src/services/support");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();
const _ = db.command;
const {
  getOpenid,
  getOne,
  getTempFileURLMap,
  queryCollection,
  withTempFileURL,
} = createRuntime({ cloud, db });

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
const {
  getMyProfile,
  getProfileByOpenid,
  updateMyProfile,
} = createProfileService({
  collections: COLLECTIONS,
  db,
  getAssetFileID,
  getOne,
  getTempFileURLMap,
  withTempFileURL,
});
const {
  composeBundles,
  getBundleByCaseId,
  getCaseDocByCaseId,
} = createBundleService({
  collections: COLLECTIONS,
  dbCommand: _,
  getAssetFileID,
  getCaseId,
  getOne,
  getTempFileURLMap,
  nowIso,
  profileKey,
  queryCollection,
  recomputeThreads,
  toCanonicalAsset,
  toCanonicalCase,
  toCanonicalEvent,
  toCanonicalExpenseRecord,
  toCanonicalRescuer,
  toCanonicalSharedEvidenceGroup,
  toCanonicalSupportEntry,
  withTempFileURL,
});
const {
  createManualSupportEntry,
  createSupportEntry,
  reviewSupportEntry,
} = createSupportService({
  collections: COLLECTIONS,
  db,
  dbCommand: _,
  createId,
  getBundleByCaseId,
  getOwnedBundleOrFailure,
  getOne,
  nowIso,
  queryCollection,
  refreshBundle: getBundleByCaseId,
  recomputeThread,
  sanitizeId,
  toCanonicalSupportEntry,
  touchCase,
});
const {
  createBudgetAdjustment,
  createExpenseRecord,
  createProgressUpdate,
  getCaseRecordDetail,
} = createRecordsService({
  collections: COLLECTIONS,
  db,
  dbCommand: _,
  createId,
  formatCurrencyLabel,
  formatDateLabel,
  getAssetFileID,
  getBundleByCaseId,
  getCaseDocByCaseId,
  getOne,
  getOwnedBundleOrFailure,
  getTempFileURLMap,
  hasOnlyCloudFileIDs,
  nowIso,
  queryCollection,
  refreshBundle: getBundleByCaseId,
  touchCase,
  withTempFileURL,
});

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
      const coverUrl = getHeroImageUrlFromBundle(bundle);

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
  getCaseRecordDetail,
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
