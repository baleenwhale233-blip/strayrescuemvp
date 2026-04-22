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
    getBundleByCaseId: overrides.getBundleByCaseId || (async (caseId) => ({
      case: {
        id: caseId,
        rescuerId: "openid_owner",
        targetAmount: 1200,
      },
    })),
    getCaseDocByCaseId: overrides.getCaseDocByCaseId || (async (caseId) => ({
      _id: `${caseId}_doc`,
    })),
    getOne: overrides.getOne || (async () => undefined),
    getOwnedBundleOrFailure: overrides.getOwnedBundleOrFailure || (async (_openid, caseId) => ({
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
    touchCase: overrides.touchCase || (async (caseId, timestamp) => {
      touched.push({ caseId, timestamp });
    }),
    withTempFileURL: (doc) => doc,
  });

  return { db, service, touched };
}

test("record helpers preserve type normalization, image dedupe, and expense item fallback", () => {
  assert.equal(toRecordType("expense"), "expense");
  assert.equal(toRecordType("bad"), undefined);
  assert.deepEqual(toRecordDetailPayload({
    id: "record_1",
    images: [
      { fileID: "cloud://a", url: "https://a" },
      { fileID: "cloud://a", url: "https://a-duplicate" },
      undefined,
      { url: "https://b" },
    ],
  }), {
    id: "record_1",
    immutable: true,
    images: [
      { fileID: "cloud://a", url: "https://a" },
      { url: "https://b" },
    ],
  });
  assert.deepEqual(getExpenseItemsFromRecord({
    summary: "支付：复查 + 药费",
  }, 88), [
    {
      description: "复查 + 药费",
      amount: 88,
    },
  ]);
});

test("records service rejects invalid progress and expense writes before persistence", async () => {
  const { db, service } = createService();

  assert.deepEqual(await service.createProgressUpdate("openid_owner", {
    caseId: "case_1",
    status: "invalid",
    statusLabel: "乱写状态",
    text: "更新",
  }), {
    ok: false,
    error: "INVALID_STATUS",
    message: undefined,
  });
  assert.deepEqual(await service.createExpenseRecord("openid_owner", {
    caseId: "case_1",
    amount: 88,
    summary: "复查",
    evidenceFileIds: [],
  }), {
    ok: false,
    error: "EXPENSE_EVIDENCE_REQUIRED",
    message: undefined,
  });
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
  assert.deepEqual(touched, [
    { caseId: "case_1", timestamp: "2026-04-20T00:00:00.000Z" },
  ]);
  assert.ok(db.writes.some((item) => item.name === "evidence_assets" && item.op === "add"));
  assert.ok(db.writes.some((item) => item.name === "expense_records" && item.op === "set"));
  assert.ok(db.writes.some((item) => item.name === "case_events" && item.op === "set"));
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
    getTempFileURLMap: async () =>
      new Map([["cloud://env/proof.png", "https://temp/proof.png"]]),
  });

  assert.deepEqual(await service.getCaseRecordDetail("openid_owner", {
    caseId: "case_1",
    recordType: "support",
    recordId: "entry_1",
  }), {
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
  });
});
