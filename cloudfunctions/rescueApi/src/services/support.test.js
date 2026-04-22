const assert = require("node:assert/strict");
const test = require("node:test");

const { createSupportService, toSupportEventData } = require("./support");

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
  const refreshed = [];
  const service = createSupportService({
    collections: {
      assets: "evidence_assets",
      events: "case_events",
      supportEntries: "support_entries",
      supportThreads: "support_threads",
    },
    db,
    dbCommand: {
      remove: () => ({ __remove: true }),
    },
    createId: overrides.createId || ((prefix) => `${prefix}_fixed`),
    getBundleByCaseId: overrides.getBundleByCaseId || (async (caseId) => ({
      case: {
        id: caseId,
        rescuerId: "openid_owner",
        visibility: "published",
      },
    })),
    getOwnedBundleOrFailure: overrides.getOwnedBundleOrFailure || (async (_openid, caseId) => ({
      bundle: {
        case: {
          id: caseId,
          rescuerId: "openid_owner",
          visibility: "published",
        },
      },
    })),
    getOne: overrides.getOne || (async () => undefined),
    nowIso: overrides.nowIso || (() => "2026-04-20T00:00:00.000Z"),
    queryCollection: overrides.queryCollection || (async () => []),
    refreshBundle: overrides.refreshBundle || (async (caseId) => {
      refreshed.push(caseId);
      return { case: { id: caseId } };
    }),
    toCanonicalSupportEntry: overrides.toCanonicalSupportEntry || ((doc) => doc),
    recomputeThread: overrides.recomputeThread || ((_threadId, entries) => ({
      caseId: entries[0]?.caseId || "case_1",
      supporterUserId: entries[0]?.supporterUserId || "openid_supporter",
      supporterNameMasked: entries[0]?.supporterNameMasked,
      createdAt: entries[0]?.createdAt || "2026-04-20T00:00:00.000Z",
      updatedAt: entries[0]?.updatedAt || "2026-04-20T00:00:00.000Z",
      totalConfirmedAmount: 0,
      totalPendingAmount: entries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0),
      totalUnmatchedAmount: 0,
      pendingCount: entries.length,
      unmatchedCount: 0,
      latestStatusSummary: "最近一条待处理",
    })),
    sanitizeId: (value) => String(value || "unknown").replace(/[^a-zA-Z0-9_-]/g, "_"),
    touchCase: overrides.touchCase || (async (caseId, timestamp) => {
      touched.push({ caseId, timestamp });
    }),
  });

  return { db, refreshed, service, touched };
}

test("support service keeps support event projection behavior", () => {
  assert.deepEqual(toSupportEventData({
    entryId: "entry_1",
    supportThreadId: "thread_1",
    caseId: "case_1",
    supporterOpenid: "openid_supporter",
    amount: "88",
    note: "加油",
    supportedAt: "2026-04-20T00:00:00.000Z",
    createdAt: "2026-04-20T00:00:00.000Z",
  }, "confirmed", "2026-04-20T01:00:00.000Z", {
    getSupportEventId: (entryId) => `event_${entryId}_support`,
  }), {
    eventId: "event_entry_1_support",
    caseId: "case_1",
    type: "support",
    occurredAt: "2026-04-20T00:00:00.000Z",
    supporterUserId: "openid_supporter",
    amount: 88,
    currency: "CNY",
    supportSource: "donor_claim",
    supporterNameMasked: undefined,
    message: "加油",
    verificationStatus: "confirmed",
    assetIds: [],
    visibility: "public",
    supportEntryId: "entry_1",
    supportThreadId: "thread_1",
    createdAt: "2026-04-20T00:00:00.000Z",
    updatedAt: "2026-04-20T01:00:00.000Z",
  });
});

test("support service rejects non-cloud proof screenshots before writing", async () => {
  const { db, service } = createService();

  assert.deepEqual(await service.createSupportEntry("openid_supporter", {
    caseId: "case_1",
    amount: 88,
    supportedAt: "2026-04-20T00:00:00.000Z",
    screenshotFileIds: ["/tmp/proof.png"],
  }), {
    ok: false,
    error: "INVALID_SCREENSHOT_FILE_ID",
    message: undefined,
  });
  assert.deepEqual(db.writes, []);
});

test("support service creates pending support entry and private projected event", async () => {
  let queryCount = 0;
  const { db, refreshed, service, touched } = createService({
    queryCollection: async (name) => {
      queryCount += 1;
      return name === "support_entries" && queryCount > 1
        ? [
            {
              supportThreadId: "thread_case_1_openid_supporter",
              caseId: "case_1",
              supporterUserId: "openid_supporter",
              amount: 88,
              status: "pending",
              createdAt: "2026-04-20T00:00:00.000Z",
              updatedAt: "2026-04-20T00:00:00.000Z",
            },
          ]
        : [];
    },
  });

  const result = await service.createSupportEntry("openid_supporter", {
    caseId: "case_1",
    amount: 88,
    supportedAt: "2026-04-20T00:00:00.000Z",
    supporterNameMasked: "张**",
    screenshotFileIds: ["cloud://env/proof.png"],
  });

  assert.equal(result.ok, true);
  assert.equal(refreshed[0], "case_1");
  assert.deepEqual(touched, [
    { caseId: "case_1", timestamp: "2026-04-20T00:00:00.000Z" },
  ]);
  assert.ok(db.writes.some((item) => item.name === "evidence_assets" && item.op === "add"));
  assert.ok(db.writes.some((item) => item.name === "support_entries" && item.op === "set"));
  assert.ok(db.writes.some((item) => item.name === "case_events" && item.op === "set"));
  assert.ok(db.writes.some((item) => item.name === "support_threads" && item.op === "set"));
});
