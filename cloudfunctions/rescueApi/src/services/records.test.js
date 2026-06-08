const assert = require("node:assert/strict");
const test = require("node:test");

const {
  createRecordsService,
  getExpenseItemsFromRecord,
  toRecordDetailPayload,
  toRecordType,
} = require("./records");

function createFakeDb() {
  const writes = [];

  return {
    writes,
    collection(name) {
      return {
        add(payload) {
          writes.push({ op: "add", name, payload });
        },
        doc(id) {
          return {
            async set(payload) {
              writes.push({ op: "set", name, id, payload });
            },
            async update(payload) {
              writes.push({ op: "update", name, id, payload });
            },
          };
        },
      };
    },
  };
}

function createService(overrides = {}) {
  const db = overrides.db || createFakeDb();
  const touched = [];
  const service = createRecordsService({
    collections: {
      assets: "evidence_assets",
      cases: "rescue_cases",
      events: "case_events",
      expenses: "expense_records",
      supportEntries: "support_entries",
    },
    db,
    dbCommand: {
      in: (values) => ({ $in: values }),
    },
    createId: overrides.createId || ((prefix) => `${prefix}_fixed`),
    formatCurrencyLabel: (amount) => `¥${Number(amount || 0).toLocaleString("zh-CN")}`,
    formatDateLabel: (iso) => iso,
    getAssetFileID: (doc) => doc?.fileID,
    getBundleByCaseId:
      overrides.getBundleByCaseId ||
      (async (caseId) => ({
        case: {
          id: caseId,
          rescuerId: "openid_owner",
          targetAmount: 1200,
        },
      })),
    getCaseDocByCaseId:
      overrides.getCaseDocByCaseId ||
      (async (caseId) => ({
        _id: `${caseId}_doc`,
      })),
    getOne: overrides.getOne || (async () => undefined),
    getOwnedBundleOrFailure:
      overrides.getOwnedBundleOrFailure ||
      (async (_openid, caseId) => ({
        bundle: {
          case: {
            id: caseId,
            rescuerId: "openid_owner",
            targetAmount: 1200,
          },
        },
      })),
    getTempFileURLMap: overrides.getTempFileURLMap || (async () => new Map()),
    hasOnlyCloudFileIDs: (values = []) =>
      Array.isArray(values) && values.every((value) => String(value).startsWith("cloud://")),
    nowIso: overrides.nowIso || (() => "2026-04-20T00:00:00.000Z"),
    queryCollection: overrides.queryCollection || (async () => []),
    refreshBundle: overrides.refreshBundle || (async (caseId) => ({ case: { id: caseId } })),
    touchCase:
      overrides.touchCase ||
      (async (caseId, timestamp) => {
        touched.push({ caseId, timestamp });
      }),
    withTempFileURL: (doc) => doc,
  });

  return { db, service, touched };
}

test("record helpers preserve type normalization, image dedupe, and expense item fallback", () => {
  assert.equal(toRecordType("expense"), "expense");
  assert.equal(toRecordType("bad"), undefined);
  assert.deepEqual(
    toRecordDetailPayload({
      id: "record_1",
      images: [
        { fileID: "cloud://a", url: "https://a" },
        { fileID: "cloud://a", url: "https://a-duplicate" },
        undefined,
        { url: "https://b" },
      ],
    }),
    {
      id: "record_1",
      immutable: true,
      images: [{ fileID: "cloud://a", url: "https://a" }, { url: "https://b" }],
    },
  );
  assert.deepEqual(
    getExpenseItemsFromRecord(
      {
        summary: "支付：复查 + 药费",
      },
      88,
    ),
    [
      {
        description: "复查 + 药费",
        amount: 88,
      },
    ],
  );
});

test("records service rejects invalid progress and expense writes before persistence", async () => {
  const { db, service } = createService();

  assert.deepEqual(
    await service.createProgressUpdate("openid_owner", {
      caseId: "case_1",
      status: "invalid",
      statusLabel: "乱写状态",
      text: "更新",
    }),
    {
      ok: false,
      error: "INVALID_STATUS",
      message: undefined,
    },
  );
  assert.deepEqual(
    await service.createExpenseRecord("openid_owner", {
      caseId: "case_1",
      amount: 88,
      summary: "复查",
      evidenceFileIds: [],
    }),
    {
      ok: false,
      error: "EXPENSE_EVIDENCE_REQUIRED",
      message: undefined,
    },
  );
  assert.deepEqual(db.writes, []);
});

test("records service creates expense record, projected event, and touches case", async () => {
  const { db, service, touched } = createService();

  const result = await service.createExpenseRecord("openid_owner", {
    caseId: "case_1",
    amount: 88,
    summary: "复查",
    spentAt: "2026-04-20T01:00:00.000Z",
    evidenceFileIds: ["cloud://env/receipt.png"],
    expenseItems: [{ description: "复查", amount: 88 }],
  });

  assert.equal(result.ok, true);
  assert.deepEqual(touched, [{ caseId: "case_1", timestamp: "2026-04-20T00:00:00.000Z" }]);
  assert.ok(db.writes.some((item) => item.name === "evidence_assets" && item.op === "add"));
  assert.ok(db.writes.some((item) => item.name === "expense_records" && item.op === "set"));
  assert.ok(db.writes.some((item) => item.name === "case_events" && item.op === "set"));
});

test("records service updates expense record, keeps revision history, and syncs projected event", async () => {
  const existingRecord = {
    _id: "expense_record_doc_1",
    recordId: "expense_record_1",
    caseId: "case_1",
    amount: 88,
    currency: "CNY",
    spentAt: "2026-04-20T01:00:00.000Z",
    category: "medical",
    summary: "复查",
    note: "原备注",
    evidenceItems: [
      {
        id: "expense_record_1_0",
        kind: "receipt",
        imageUrl: "cloud://env/old-receipt.png",
        hash: "cloud://env/old-receipt.png",
      },
    ],
    evidenceLevel: "basic",
    verificationStatus: "manual",
    visibility: "public",
    projectedEventId: "expense_event_1",
    expenseItems: [{ description: "复查", amount: 88 }],
    createdAt: "2026-04-20T00:00:00.000Z",
    updatedAt: "2026-04-20T00:00:00.000Z",
  };
  const existingEvent = {
    _id: "expense_event_doc_1",
    eventId: "expense_event_1",
    caseId: "case_1",
    type: "expense",
    occurredAt: "2026-04-20T01:00:00.000Z",
    amount: 88,
    currency: "CNY",
    expenseItemsText: "复查",
    verificationStatus: "manual",
    assetIds: ["expense_record_1_asset_0"],
    visibility: "public",
    createdAt: "2026-04-20T00:00:00.000Z",
    updatedAt: "2026-04-20T00:00:00.000Z",
  };
  const { db, service, touched } = createService({
    createId: (prefix) => `${prefix}_new`,
    getOne: async (name, where) => {
      if (
        name === "expense_records" &&
        where.caseId === "case_1" &&
        (where.recordId === "expense_record_1" || where._id === "expense_record_1")
      ) {
        return existingRecord;
      }

      if (
        name === "case_events" &&
        where.caseId === "case_1" &&
        where.eventId === "expense_event_1"
      ) {
        return existingEvent;
      }

      return undefined;
    },
  });

  const result = await service.updateExpenseRecord("openid_owner", {
    caseId: "case_1",
    recordId: "expense_record_1",
    amount: 120,
    summary: "复查 + 药费",
    spentAt: "2026-04-21T01:00:00.000Z",
    evidenceFileIds: ["cloud://env/new-receipt.png"],
    expenseItems: [
      { description: "复查", amount: 88 },
      { description: "药费", amount: 32 },
    ],
    editReason: "补充漏记药费",
  });

  assert.equal(result.ok, true);
  assert.deepEqual(touched, [{ caseId: "case_1", timestamp: "2026-04-20T00:00:00.000Z" }]);
  assert.ok(db.writes.some((item) => item.name === "evidence_assets" && item.op === "add"));

  const recordUpdate = db.writes.find(
    (item) => item.name === "expense_records" && item.id === "expense_record_doc_1",
  );
  assert.deepEqual(recordUpdate?.payload.data.revisionHistory, [
    {
      revisionId: "expense_revision_new",
      editedAt: "2026-04-20T00:00:00.000Z",
      editedByOpenid: "openid_owner",
      reason: "补充漏记药费",
      previous: {
        amount: 88,
        currency: "CNY",
        spentAt: "2026-04-20T01:00:00.000Z",
        category: "medical",
        summary: "复查",
        note: "原备注",
        evidenceItems: existingRecord.evidenceItems,
        evidenceLevel: "basic",
        verificationStatus: "manual",
        visibility: "public",
        expenseItems: [{ description: "复查", amount: 88 }],
      },
      next: {
        amount: 120,
        currency: "CNY",
        spentAt: "2026-04-21T01:00:00.000Z",
        category: "medical",
        summary: "复查 + 药费",
        note: undefined,
        evidenceItems: [
          {
            id: "expense_record_1_0",
            kind: "receipt",
            imageUrl: "cloud://env/new-receipt.png",
            hash: "cloud://env/new-receipt.png",
          },
        ],
        evidenceLevel: "basic",
        verificationStatus: "manual",
        visibility: "public",
        expenseItems: [
          { description: "复查", amount: 88 },
          { description: "药费", amount: 32 },
        ],
      },
    },
  ]);
  assert.equal(recordUpdate?.payload.data.amount, 120);
  assert.equal(recordUpdate?.payload.data.summary, "复查 + 药费");

  const eventUpdate = db.writes.find(
    (item) => item.name === "case_events" && item.id === "expense_event_doc_1",
  );
  assert.equal(eventUpdate?.payload.data.amount, 120);
  assert.equal(eventUpdate?.payload.data.expenseItemsText, "复查 + 药费");
  assert.deepEqual(eventUpdate?.payload.data.assetIds, ["expense_record_1_asset_0"]);
});

test("records service reads support entry detail when no support event exists", async () => {
  const { service } = createService({
    getBundleByCaseId: async () => ({
      case: {
        id: "case_1",
        rescuerId: "openid_owner",
      },
    }),
    getOne: async (name, where) => {
      if (name === "support_entries" && where.entryId === "entry_1") {
        return {
          _id: "entry_doc_1",
          entryId: "entry_1",
          caseId: "case_1",
          supporterNameMasked: "张**",
          amount: 66,
          supportedAt: "2026-04-20T02:00:00.000Z",
          note: "谢谢",
          visibility: "private",
          screenshotFileIds: ["cloud://env/proof.png"],
        };
      }
      return undefined;
    },
    getTempFileURLMap: async () => new Map([["cloud://env/proof.png", "https://temp/proof.png"]]),
  });

  assert.deepEqual(
    await service.getCaseRecordDetail("openid_owner", {
      caseId: "case_1",
      recordType: "support",
      recordId: "entry_1",
    }),
    {
      ok: true,
      data: {
        record: {
          id: "entry_1",
          caseId: "case_1",
          recordType: "support",
          title: "张** 的支持",
          description: "谢谢",
          occurredAt: "2026-04-20T02:00:00.000Z",
          occurredAtLabel: "2026-04-20T02:00:00.000Z",
          amount: 66,
          amountLabel: "+ ¥66",
          immutable: true,
          images: [
            {
              assetId: "entry_1_proof_0",
              fileID: "cloud://env/proof.png",
              url: "https://temp/proof.png",
              thumbnailUrl: "cloud://env/proof.png",
              watermarkedUrl: undefined,
              kind: "payment_screenshot",
            },
          ],
        },
      },
    },
  );
});

test("records service returns expense editability and revision history in record detail", async () => {
  const { service } = createService({
    getBundleByCaseId: async () => ({
      case: {
        id: "case_1",
        rescuerId: "openid_owner",
      },
    }),
    getOne: async (name, where) => {
      if (name === "expense_records" && where.recordId === "expense_record_1") {
        return {
          _id: "expense_record_doc_1",
          recordId: "expense_record_1",
          caseId: "case_1",
          amount: 120,
          currency: "CNY",
          spentAt: "2026-04-21T01:00:00.000Z",
          category: "medical",
          summary: "复查 + 药费",
          evidenceItems: [],
          visibility: "public",
          projectedEventId: "expense_event_1",
          expenseItems: [
            { description: "复查", amount: 88 },
            { description: "药费", amount: 32 },
          ],
          revisionHistory: [
            {
              revisionId: "expense_revision_1",
              editedAt: "2026-04-20T00:00:00.000Z",
              reason: "补充漏记药费",
              previous: {
                amount: 88,
                summary: "复查",
                expenseItems: [{ description: "复查", amount: 88 }],
              },
              next: {
                amount: 120,
                summary: "复查 + 药费",
                expenseItems: [
                  { description: "复查", amount: 88 },
                  { description: "药费", amount: 32 },
                ],
              },
            },
          ],
        };
      }

      if (name === "case_events" && where.eventId === "expense_event_1") {
        return {
          _id: "expense_event_doc_1",
          eventId: "expense_event_1",
          caseId: "case_1",
          type: "expense",
          amount: 120,
          expenseItemsText: "复查 + 药费",
          visibility: "public",
          assetIds: [],
        };
      }

      return undefined;
    },
  });

  assert.deepEqual(
    await service.getCaseRecordDetail("openid_owner", {
      caseId: "case_1",
      recordType: "expense",
      recordId: "expense_record_1",
    }),
    {
      ok: true,
      data: {
        record: {
          id: "expense_record_1",
          caseId: "case_1",
          recordType: "expense",
          title: "复查 + 药费",
          occurredAt: "2026-04-21T01:00:00.000Z",
          occurredAtLabel: "2026-04-21T01:00:00.000Z",
          amount: 120,
          amountLabel: "- ¥120",
          editable: true,
          immutable: false,
          expenseItems: [
            { description: "复查", amount: 88 },
            { description: "药费", amount: 32 },
          ],
          images: [],
          revisionHistory: [
            {
              revisionId: "expense_revision_1",
              editedAt: "2026-04-20T00:00:00.000Z",
              editedAtLabel: "2026-04-20T00:00:00.000Z",
              reason: "补充漏记药费",
              previous: {
                summary: "复查",
                amount: 88,
                amountLabel: "¥88",
                expenseItems: [{ description: "复查", amount: 88 }],
              },
              next: {
                summary: "复查 + 药费",
                amount: 120,
                amountLabel: "¥120",
                expenseItems: [
                  { description: "复查", amount: 88 },
                  { description: "药费", amount: 32 },
                ],
              },
            },
          ],
        },
      },
    },
  );
});
