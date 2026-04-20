const {
  createId: defaultCreateId,
  fail,
  isCloudFileID,
  nowIso: defaultNowIso,
  ok,
  sanitizeId: defaultSanitizeId,
} = require("../runtime");

function getSupportEventId(entryId, sanitizeId = defaultSanitizeId) {
  return `event_${sanitizeId(entryId)}_support`;
}

function toSupportEventData(entry, status, timestamp, options = {}) {
  const getProjectedEventId =
    options.getSupportEventId || ((entryId) => getSupportEventId(entryId));
  const eventId = entry.projectedEventId || getProjectedEventId(entry.entryId);
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

function createSupportService({
  collections,
  db,
  dbCommand,
  createId = defaultCreateId,
  getBundleByCaseId,
  getOwnedBundleOrFailure,
  getOne,
  nowIso = defaultNowIso,
  queryCollection,
  refreshBundle,
  recomputeThread,
  sanitizeId = defaultSanitizeId,
  toCanonicalSupportEntry,
  touchCase,
}) {
  async function updateSupportThread(threadId) {
    const entryDocs = await queryCollection(collections.supportEntries, {
      supportThreadId: threadId,
    });
    const entries = entryDocs.map(toCanonicalSupportEntry);
    const thread = recomputeThread(threadId, entries);

    await db.collection(collections.supportThreads).doc(threadId).set({
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

  async function upsertSupportEvent(entry, status, timestamp) {
    const eventData = toSupportEventData(entry, status, timestamp, {
      getSupportEventId: (entryId) => getSupportEventId(entryId, sanitizeId),
    });
    const eventDoc = await getOne(collections.events, {
      eventId: eventData.eventId,
    });

    if (eventDoc) {
      await db.collection(collections.events).doc(eventDoc._id).update({
        data: eventData,
      });
      return eventData.eventId;
    }

    await db.collection(collections.events).doc(eventData.eventId).set({
      data: eventData,
    });
    return eventData.eventId;
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
    const existingEntries = await queryCollection(collections.supportEntries, {
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
    const projectedEventId = getSupportEventId(entryId, sanitizeId);

    for (const [index, fileID] of screenshotFileIds.entries()) {
      await db.collection(collections.assets).add({
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

    await db.collection(collections.supportEntries).doc(entryId).set({
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

    return ok({ bundle: await refreshBundle(caseId) });
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
    const projectedEventId = getSupportEventId(entryId, sanitizeId);

    await db.collection(collections.supportEntries).doc(entryId).set({
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

    return ok({ bundle: await refreshBundle(bundle.case.id) });
  }

  async function reviewSupportEntry(openid, input) {
    const bundle = await getBundleByCaseId(input?.caseId);

    if (!bundle) {
      return fail("CASE_NOT_FOUND");
    }

    if (bundle.case.rescuerId !== openid) {
      return fail("FORBIDDEN", "Only the rescuer can review support entries.");
    }

    const entryDoc = await getOne(collections.supportEntries, {
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
      updateData.unmatchedReason = dbCommand.remove();
      updateData.unmatchedNote = dbCommand.remove();
    } else {
      updateData.unmatchedReason = input?.reason || "other";
      updateData.unmatchedNote = input?.note;
      updateData.visibility = "private";
      updateData.confirmedAt = dbCommand.remove();
      updateData.confirmedByOpenid = dbCommand.remove();
      updateData.confirmedByUserId = dbCommand.remove();
    }

    await db.collection(collections.supportEntries).doc(entryDoc._id).update({
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

    return ok({ bundle: await refreshBundle(input?.caseId) });
  }

  return {
    createManualSupportEntry,
    createSupportEntry,
    reviewSupportEntry,
    updateSupportThread,
    upsertSupportEvent,
  };
}

module.exports = {
  createSupportService,
  getSupportEventId,
  toSupportEventData,
};
