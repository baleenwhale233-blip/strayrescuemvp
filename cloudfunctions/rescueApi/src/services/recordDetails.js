const {
  fail,
  nowIso: defaultNowIso,
  ok,
} = require("../runtime");

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

function createRecordDetailsService({
  collections,
  formatCurrencyLabel,
  formatDateLabel,
  getAssetFileID,
  getAssetMapByIds,
  getBundleByCaseId,
  getOne,
  getTempFileURLMap,
  nowIso = defaultNowIso,
}) {
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

  return {
    getCaseRecordDetail,
  };
}

module.exports = {
  createRecordDetailsService,
  getExpenseItemsFromRecord,
  toRecordDetailPayload,
  toRecordImageFromAsset,
  toRecordType,
};
