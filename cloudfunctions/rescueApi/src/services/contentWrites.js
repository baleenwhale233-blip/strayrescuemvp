const {
  createId: defaultCreateId,
  fail,
  nowIso: defaultNowIso,
  ok,
} = require("../runtime");

const ALLOWED_PROGRESS_STATUSES = new Set([
  "newly_found",
  "medical",
  "recovery",
  "rehoming",
  "closed",
]);

function toEvidenceItemsFromFileIds(fileIds = [], idPrefix = "evidence") {
  return fileIds.map((fileID, index) => ({
    id: `${idPrefix}_${index}`,
    kind: "receipt",
    imageUrl: fileID,
    hash: fileID,
  }));
}

function createContentWritesService({
  collections,
  db,
  createAssetDocs,
  createId = defaultCreateId,
  getCaseDocByCaseId,
  getOwnedBundleOrFailure,
  hasOnlyCloudFileIDs,
  nowIso = defaultNowIso,
  refreshBundle,
  touchCase,
}) {
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

    await db.collection(collections.events).doc(eventId).set({
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
    await db.collection(collections.cases).doc(caseDoc._id).update({
      data: {
        currentStatus: status,
        currentStatusLabel: statusLabel,
        updatedAt: timestamp,
      },
    });

    return ok({ bundle: await refreshBundle(bundle.case.id) });
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

    await db.collection(collections.expenses).doc(recordId).set({
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

    await db.collection(collections.events).doc(eventId).set({
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

    return ok({ bundle: await refreshBundle(bundle.case.id) });
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
    await db.collection(collections.events).doc(eventId).set({
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
    await db.collection(collections.cases).doc(caseDoc._id).update({
      data: {
        targetAmount: newTargetAmount,
        updatedAt: timestamp,
      },
    });

    return ok({ bundle: await refreshBundle(bundle.case.id) });
  }

  return {
    createBudgetAdjustment,
    createExpenseRecord,
    createProgressUpdate,
  };
}

module.exports = {
  ALLOWED_PROGRESS_STATUSES,
  createContentWritesService,
  toEvidenceItemsFromFileIds,
};
