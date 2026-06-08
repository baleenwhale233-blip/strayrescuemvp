const { createId: defaultCreateId, fail, nowIso: defaultNowIso, ok } = require("../runtime");

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

function toExpenseItems(input = []) {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item) => ({
      description: String(item?.description || "").trim(),
      amount: Number(item?.amount || 0),
    }))
    .filter((item) => item.description && item.amount > 0);
}

function toExpenseRevisionSnapshot(input) {
  return {
    amount: Number(input?.amount || 0),
    currency: input?.currency || "CNY",
    spentAt: input?.spentAt,
    category: input?.category || "medical",
    summary: input?.summary || "",
    note: input?.note,
    evidenceItems: Array.isArray(input?.evidenceItems) ? input.evidenceItems : [],
    evidenceLevel: input?.evidenceLevel || "needs_attention",
    verificationStatus: input?.verificationStatus || "manual",
    visibility: input?.visibility || "public",
    expenseItems: Array.isArray(input?.expenseItems) ? input.expenseItems : [],
  };
}

function createContentWritesService({
  collections,
  db,
  createAssetDocs,
  createId = defaultCreateId,
  getCaseDocByCaseId,
  getOne,
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

    await db
      .collection(collections.events)
      .doc(eventId)
      .set({
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
    await db
      .collection(collections.cases)
      .doc(caseDoc._id)
      .update({
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

    await db
      .collection(collections.expenses)
      .doc(recordId)
      .set({
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
          expenseItems: toExpenseItems(input?.expenseItems),
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      });

    await db
      .collection(collections.events)
      .doc(eventId)
      .set({
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

  async function updateExpenseRecord(openid, input) {
    const { bundle, error } = await getOwnedBundleOrFailure(openid, input?.caseId);
    if (error) {
      return error;
    }

    const recordId = String(input?.recordId || input?.id || "").trim();
    const record =
      (await getOne(collections.expenses, { recordId, caseId: bundle.case.id })) ||
      (await getOne(collections.expenses, { _id: recordId, caseId: bundle.case.id })) ||
      (await getOne(collections.expenses, { projectedEventId: recordId, caseId: bundle.case.id }));

    if (!record) {
      return fail("RECORD_NOT_FOUND");
    }

    const amount = Number(input?.amount || 0);
    const summary = String(input?.summary || "").trim();
    const timestamp = nowIso();
    const spentAt = input?.spentAt || record.spentAt || timestamp;
    const category = input?.category || record.category || "medical";
    const expenseItems = toExpenseItems(input?.expenseItems);
    const evidenceFileIds = Array.isArray(input?.evidenceFileIds)
      ? input.evidenceFileIds.filter(Boolean)
      : undefined;

    if (!amount || Number.isNaN(amount) || !summary) {
      return fail("INVALID_EXPENSE_RECORD");
    }

    if (evidenceFileIds && !evidenceFileIds.length) {
      return fail("EXPENSE_EVIDENCE_REQUIRED");
    }

    if (evidenceFileIds && !hasOnlyCloudFileIDs(evidenceFileIds)) {
      return fail("INVALID_ASSET_FILE_ID");
    }

    const effectiveRecordId = record.recordId || record._id || recordId;
    const effectiveEvidenceItems = evidenceFileIds
      ? toEvidenceItemsFromFileIds(evidenceFileIds, effectiveRecordId)
      : Array.isArray(record.evidenceItems)
        ? record.evidenceItems
        : [];

    if (!effectiveEvidenceItems.length) {
      return fail("EXPENSE_EVIDENCE_REQUIRED");
    }

    const assetIds = evidenceFileIds
      ? await createAssetDocs({
          caseId: bundle.case.id,
          fileIds: evidenceFileIds,
          idPrefix: effectiveRecordId,
          kind: "receipt",
          visibility: "public",
          uploadedByOpenid: openid,
          timestamp,
        })
      : undefined;
    const event = record.projectedEventId
      ? await getOne(collections.events, {
          eventId: record.projectedEventId,
          caseId: bundle.case.id,
        })
      : undefined;
    const nextSnapshot = toExpenseRevisionSnapshot({
      amount,
      currency: "CNY",
      spentAt,
      category,
      summary,
      note: input?.note,
      evidenceItems: effectiveEvidenceItems,
      evidenceLevel: "basic",
      verificationStatus: record.verificationStatus || "manual",
      visibility: record.visibility || "public",
      expenseItems,
    });
    const revision = {
      revisionId: createId("expense_revision"),
      editedAt: timestamp,
      editedByOpenid: openid,
      reason: String(input?.editReason || "").trim() || undefined,
      previous: toExpenseRevisionSnapshot(record),
      next: nextSnapshot,
    };
    const revisionHistory = Array.isArray(record.revisionHistory)
      ? [...record.revisionHistory, revision]
      : [revision];

    await db
      .collection(collections.expenses)
      .doc(record._id || effectiveRecordId)
      .update({
        data: {
          ...nextSnapshot,
          revisionHistory,
          updatedAt: timestamp,
        },
      });

    if (event) {
      await db
        .collection(collections.events)
        .doc(event._id || event.eventId || record.projectedEventId)
        .update({
          data: {
            occurredAt: spentAt,
            amount,
            currency: "CNY",
            merchantName: input?.merchantName,
            expenseItemsText: summary,
            verificationStatus: record.verificationStatus || "manual",
            assetIds: assetIds || event.assetIds || [],
            visibility: record.visibility || "public",
            updatedAt: timestamp,
          },
        });
    }

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
    await db
      .collection(collections.events)
      .doc(eventId)
      .set({
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
    await db
      .collection(collections.cases)
      .doc(caseDoc._id)
      .update({
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
    updateExpenseRecord,
  };
}

module.exports = {
  ALLOWED_PROGRESS_STATUSES,
  createContentWritesService,
  toExpenseItems,
  toExpenseRevisionSnapshot,
  toEvidenceItemsFromFileIds,
};
