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

function toRecordImageFromAsset(asset, getAssetFileID) {
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

function getImageFromEvidenceItem(item, assetMap, tempFileURLMap = new Map(), getAssetFileID) {
  const asset = item.assetId ? assetMap.get(item.assetId) : undefined;
  if (asset) {
    return toRecordImageFromAsset(asset, getAssetFileID);
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

function createRecordsService({
  collections,
  db,
  dbCommand,
  createId = defaultCreateId,
  formatCurrencyLabel,
  formatDateLabel,
  getAssetFileID,
  getBundleByCaseId,
  getCaseDocByCaseId,
  getOne,
  getOwnedBundleOrFailure,
  getTempFileURLMap,
  hasOnlyCloudFileIDs,
  nowIso = defaultNowIso,
  queryCollection,
  refreshBundle,
  touchCase,
  withTempFileURL,
}) {
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
      await db.collection(collections.assets).add({
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

  async function getAssetMapByIds(assetIds = []) {
    const ids = [...new Set(assetIds.filter(Boolean))];
    if (!ids.length) {
      return new Map();
    }

    const docs = await queryCollection(collections.assets, {
      assetId: dbCommand.in(ids),
    }, 1000);
    const tempFileURLMap = await getTempFileURLMap(docs.map(getAssetFileID));

    return new Map(
      docs.map((doc) => [
        doc.assetId || doc.id || doc._id,
        withTempFileURL(doc, tempFileURLMap),
      ]),
    );
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
        (await getOne(collections.expenses, { recordId, caseId })) ||
        (await getOne(collections.expenses, { _id: recordId, caseId })) ||
        (await getOne(collections.expenses, { projectedEventId: recordId, caseId }));
      const event = record
        ? await getOne(collections.events, { eventId: record.projectedEventId, caseId })
        : (await getOne(collections.events, { eventId: recordId, caseId })) ||
          (await getOne(collections.events, { _id: recordId, caseId }));
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
        ...evidenceItems.map((item) => getImageFromEvidenceItem(item, assetMap, evidenceTempFileURLMap, getAssetFileID)),
        ...eventAssetIds.map((assetId) => assetMap.get(assetId)).map((asset) => asset && toRecordImageFromAsset(asset, getAssetFileID)),
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
        (await getOne(collections.events, { eventId: recordId, caseId })) ||
        (await getOne(collections.events, { _id: recordId, caseId }));
      const expectedType = recordType === "support" ? "support" : recordType;

      if (recordType === "support" && !event) {
        const entry =
          (await getOne(collections.supportEntries, { entryId: recordId, caseId })) ||
          (await getOne(collections.supportEntries, { _id: recordId, caseId }));

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
          ...screenshotItems.map((item) => getImageFromEvidenceItem(item, assetMap, screenshotTempFileURLMap, getAssetFileID)),
          ...(entry.screenshotFileIds || []).map((fileID, index) =>
            toRecordImageFromAsset({
              assetId: `${entry.entryId || entry._id}_proof_${index}`,
              fileID,
              _fileID: fileID,
              _tempFileURL: screenshotTempFileURLMap.get(fileID),
              kind: "support_proof",
            }, getAssetFileID),
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
        .map((asset) => asset && toRecordImageFromAsset(asset, getAssetFileID));
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
    getCaseRecordDetail,
  };
}

module.exports = {
  createRecordsService,
  getExpenseItemsFromRecord,
  toRecordDetailPayload,
  toRecordImageFromAsset,
  toRecordType,
};
