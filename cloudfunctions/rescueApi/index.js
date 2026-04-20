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
const { createProfileService } = require("./src/services/profile");
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

async function composeBundles(caseDocs) {
  const cases = caseDocs.map(toCanonicalCase);
  const caseIds = cases.map((item) => item.id).filter(Boolean);
  const rescuerIds = cases.map((item) => item.rescuerId).filter(Boolean);

  if (!caseIds.length) {
    return [];
  }

  const profiles = await queryCollection(COLLECTIONS.profiles, {
    openid: _.in(rescuerIds),
  });
  const profileAssetIds = [
    ...new Set(
      profiles.flatMap((profile) =>
        [profile.avatarAssetId, profile.paymentQrAssetId].filter(Boolean),
      ),
    ),
  ];
  const [events, expenses, supportEntries, supportThreads, assets, profileAssets, sharedGroups] =
    await Promise.all([
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
      profileAssetIds.length
        ? queryCollection(COLLECTIONS.assets, {
            assetId: _.in(profileAssetIds),
          })
        : Promise.resolve([]),
      queryCollection(COLLECTIONS.sharedEvidenceGroups, {
        caseId: _.in(caseIds),
      }),
    ]);
  const tempFileURLMap = await getTempFileURLMap([
    ...assets.map(getAssetFileID),
    ...profileAssets.map(getAssetFileID),
    ...caseDocs.map((doc) => doc.coverFileID),
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
      .map((doc) => toCanonicalAsset(withTempFileURL(doc, tempFileURLMap)));
    const profileAssetIds = [
      profile.avatarAssetId,
      profile.paymentQrAssetId,
    ].filter(Boolean);
    const profileScopedAssets = profileAssets
      .filter((doc) => profileAssetIds.includes(doc.assetId || doc.id || doc._id))
      .map((doc) => toCanonicalAsset(withTempFileURL(doc, tempFileURLMap)));

    if (caseDoc.coverFileID) {
      caseAssets.push({
        id: `${caseId}_cover`,
        kind: "case_cover",
        originalUrl: tempFileURLMap.get(caseDoc.coverFileID) || caseDoc.coverFileID,
        watermarkedUrl: tempFileURLMap.get(caseDoc.coverFileID) || caseDoc.coverFileID,
        thumbnailUrl: tempFileURLMap.get(caseDoc.coverFileID) || caseDoc.coverFileID,
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

function toRecordImageFromAsset(asset) {
  const fileID = asset._fileID || getAssetFileID(asset) || asset.fileID || "";
  const url =
    asset._tempFileURL ||
    asset.watermarkedUrl ||
    asset.thumbnailUrl ||
    asset.originalUrl ||
    fileID;
  const kindMap = {
    receipt: "receipt",
    support_proof: "payment_screenshot",
    payment_screenshot: "payment_screenshot",
    animal_photo: "animal_photo",
    animal_face: "animal_photo",
    case_cover: "animal_photo",
    progress_photo: "progress_photo",
    medical_record: "medical_record",
  };

  return {
    assetId: asset.assetId || asset.id || asset._id,
    fileID,
    url,
    thumbnailUrl: asset.thumbnailUrl || fileID,
    watermarkedUrl: asset.watermarkedUrl,
    kind: kindMap[asset.kind] || "other",
  };
}

async function getAssetMapByIds(assetIds = []) {
  const ids = [...new Set(assetIds.filter(Boolean))];
  if (!ids.length) {
    return new Map();
  }

  const docs = await queryCollection(COLLECTIONS.assets, {
    assetId: _.in(ids),
  }, 1000);
  const tempFileURLMap = await getTempFileURLMap(docs.map(getAssetFileID));

  return new Map(
    docs.map((doc) => [
      doc.assetId || doc.id || doc._id,
      withTempFileURL(doc, tempFileURLMap),
    ]),
  );
}

function getImageFromEvidenceItem(item, assetMap, tempFileURLMap = new Map()) {
  const asset = item.assetId ? assetMap.get(item.assetId) : undefined;
  if (asset) {
    return toRecordImageFromAsset(asset);
  }

  const fileID = item.imageUrl || item.fileID || "";
  if (!fileID) {
    return undefined;
  }

  return {
    assetId: item.assetId,
    fileID,
    url: tempFileURLMap.get(fileID) || fileID,
    thumbnailUrl: tempFileURLMap.get(fileID) || fileID,
    kind: item.kind || "other",
  };
}

function uniqueImages(images = []) {
  const seen = new Set();
  const result = [];

  for (const image of images) {
    if (!image?.url) {
      continue;
    }

    const key = image.fileID || image.url || image.assetId;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(image);
  }

  return result.slice(0, 9);
}

function canReadRecord(bundle, visibility, openid) {
  return visibility === "public" || visibility === "draft" || bundle.case.rescuerId === openid;
}

function toRecordType(value) {
  return value === "progress_update" ||
    value === "expense" ||
    value === "budget_adjustment" ||
    value === "support"
    ? value
    : undefined;
}

function toRecordDetailPayload(input) {
  return {
    ...input,
    immutable: true,
    images: uniqueImages(input.images || []),
  };
}

function getExpenseItemsFromRecord(record, amount) {
  if (Array.isArray(record.expenseItems) && record.expenseItems.length) {
    return record.expenseItems
      .map((item) => ({
        description: String(item.description || "").trim(),
        amount: typeof item.amount === "number" ? item.amount : Number(item.amount || 0) || undefined,
      }))
      .filter((item) => item.description);
  }

  const summary = String(record.summary || record.expenseItemsText || "").replace(/^支付[:：]\s*/, "").trim();
  return summary
    ? [
        {
          description: summary,
          amount,
        },
      ]
    : [];
}

async function getCaseRecordDetail(openid, input) {
  const caseId = input?.caseId;
  const recordType = toRecordType(input?.recordType);
  const recordId = String(input?.recordId || input?.id || "").trim();

  if (!caseId || !recordType || !recordId) {
    return fail("INVALID_RECORD_DETAIL_INPUT");
  }

  const bundle = await getBundleByCaseId(caseId);
  if (!bundle) {
    return fail("CASE_NOT_FOUND");
  }

  if (recordType === "expense") {
    const record =
      (await getOne(COLLECTIONS.expenses, { recordId, caseId })) ||
      (await getOne(COLLECTIONS.expenses, { _id: recordId, caseId })) ||
      (await getOne(COLLECTIONS.expenses, { projectedEventId: recordId, caseId }));
    const event = record
      ? await getOne(COLLECTIONS.events, { eventId: record.projectedEventId, caseId })
      : (await getOne(COLLECTIONS.events, { eventId: recordId, caseId })) ||
        (await getOne(COLLECTIONS.events, { _id: recordId, caseId }));
    const expense = record || event;

    if (!expense || (event && event.type !== "expense")) {
      return fail("RECORD_NOT_FOUND");
    }

    const visibility = expense.visibility || event?.visibility || "public";
    if (!canReadRecord(bundle, visibility, openid)) {
      return fail("FORBIDDEN");
    }

    const evidenceItems = Array.isArray(record?.evidenceItems) ? record.evidenceItems : [];
    const evidenceAssetIds = evidenceItems.map((item) => item.assetId).filter(Boolean);
    const eventAssetIds = Array.isArray(event?.assetIds) ? event.assetIds : [];
    const assetMap = await getAssetMapByIds([...evidenceAssetIds, ...eventAssetIds]);
    const evidenceTempFileURLMap = await getTempFileURLMap(
      evidenceItems.map((item) => item.imageUrl || item.fileID),
    );
    const images = [
      ...evidenceItems.map((item) => getImageFromEvidenceItem(item, assetMap, evidenceTempFileURLMap)),
      ...eventAssetIds.map((assetId) => assetMap.get(assetId)).map((asset) => asset && toRecordImageFromAsset(asset)),
    ];
    const amount = Number(expense.amount || 0);

    return ok({
      record: toRecordDetailPayload({
        id: record?.recordId || record?.id || record?._id || event?.eventId || event?._id,
        caseId,
        recordType,
        title: record?.summary || event?.expenseItemsText || "支出记录",
        occurredAt: record?.spentAt || event?.occurredAt || record?.createdAt || nowIso(),
        occurredAtLabel: formatDateLabel(record?.spentAt || event?.occurredAt || record?.createdAt || nowIso()),
        amount,
        amountLabel: `- ${formatCurrencyLabel(amount)}`,
        expenseItems: getExpenseItemsFromRecord(record || event, amount),
        images,
      }),
    });
  }

  if (recordType === "progress_update" || recordType === "budget_adjustment" || recordType === "support") {
    const event =
      (await getOne(COLLECTIONS.events, { eventId: recordId, caseId })) ||
      (await getOne(COLLECTIONS.events, { _id: recordId, caseId }));
    const expectedType = recordType === "support" ? "support" : recordType;

    if (recordType === "support" && !event) {
      const entry =
        (await getOne(COLLECTIONS.supportEntries, { entryId: recordId, caseId })) ||
        (await getOne(COLLECTIONS.supportEntries, { _id: recordId, caseId }));

      if (!entry) {
        return fail("RECORD_NOT_FOUND");
      }

      if (!canReadRecord(bundle, entry.visibility || "private", openid)) {
        return fail("FORBIDDEN");
      }

      const screenshotItems = Array.isArray(entry.screenshotItems) ? entry.screenshotItems : [];
      const assetMap = await getAssetMapByIds(
        screenshotItems.map((item) => item.assetId).filter(Boolean),
      );
      const screenshotTempFileURLMap = await getTempFileURLMap([
        ...screenshotItems.map((item) => item.imageUrl || item.fileID),
        ...(entry.screenshotFileIds || []),
      ]);
      const images = [
        ...screenshotItems.map((item) => getImageFromEvidenceItem(item, assetMap, screenshotTempFileURLMap)),
        ...(entry.screenshotFileIds || []).map((fileID, index) =>
          toRecordImageFromAsset({
            assetId: `${entry.entryId || entry._id}_proof_${index}`,
            fileID,
            _fileID: fileID,
            _tempFileURL: screenshotTempFileURLMap.get(fileID),
            kind: "support_proof",
          }),
        ),
      ];
      const amount = Number(entry.amount || 0);
      const occurredAt = entry.supportedAt || entry.createdAt || nowIso();

      return ok({
        record: toRecordDetailPayload({
          id: entry.entryId || entry._id,
          caseId,
          recordType,
          title: entry.supporterNameMasked
            ? `${entry.supporterNameMasked} 的支持`
            : "场外收入",
          description: entry.note,
          occurredAt,
          occurredAtLabel: formatDateLabel(occurredAt),
          amount,
          amountLabel: `+ ${formatCurrencyLabel(amount)}`,
          images,
        }),
      });
    }

    if (!event || event.type !== expectedType) {
      return fail("RECORD_NOT_FOUND");
    }

    if (!canReadRecord(bundle, event.visibility || "public", openid)) {
      return fail("FORBIDDEN");
    }

    const assetMap = await getAssetMapByIds(event.assetIds || []);
    const images = (event.assetIds || [])
      .map((assetId) => assetMap.get(assetId))
      .map((asset) => asset && toRecordImageFromAsset(asset));
    const occurredAt = event.occurredAt || event.createdAt || nowIso();

    if (recordType === "budget_adjustment") {
      return ok({
        record: toRecordDetailPayload({
          id: event.eventId || event._id,
          caseId,
          recordType,
          title: event.reason || "预算调整",
          description: event.reason,
          occurredAt,
          occurredAtLabel: formatDateLabel(occurredAt),
          budgetPreviousLabel: formatCurrencyLabel(event.previousTargetAmount),
          budgetCurrentLabel: formatCurrencyLabel(event.newTargetAmount),
          images,
        }),
      });
    }

    if (recordType === "support") {
      const amount = Number(event.amount || 0);
      return ok({
        record: toRecordDetailPayload({
          id: event.eventId || event._id,
          caseId,
          recordType,
          title: event.supporterNameMasked
            ? `${event.supporterNameMasked} 的支持`
            : "场外收入",
          description: event.message,
          occurredAt,
          occurredAtLabel: formatDateLabel(occurredAt),
          amount,
          amountLabel: `+ ${formatCurrencyLabel(amount)}`,
          images,
        }),
      });
    }

    return ok({
      record: toRecordDetailPayload({
        id: event.eventId || event._id,
        caseId,
        recordType,
        title: event.statusLabel || "进展更新",
        description: event.text || "",
        occurredAt,
        occurredAtLabel: formatDateLabel(occurredAt),
        images,
      }),
    });
  }

  return fail("RECORD_NOT_FOUND");
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

  if (!evidenceFileIds.length) {
    return fail("EXPENSE_EVIDENCE_REQUIRED");
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
