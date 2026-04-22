const assert = require("node:assert/strict");
const test = require("node:test");

const { fail, ok } = require("../runtime");
const { createCaseWritesService } = require("./caseWrites");

function createFakeDb() {
  const writes = [];

  return {
    writes,
    collection(name) {
      return {
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
  const bundles = overrides.bundles || new Map([
    [
      "case_1",
      {
        case: {
          id: "case_1",
          rescuerId: "owner_1",
        },
      },
    ],
  ]);
  const service = createCaseWritesService({
    collections: {
      assets: "evidence_assets",
      cases: "rescue_cases",
    },
    createId: overrides.createId || ((prefix) => `${prefix}_fixed`),
    db,
    fail,
    getBundleByCaseId: overrides.getBundleByCaseId || (async (caseId) => bundles.get(caseId)),
    getCaseDocByCaseId: overrides.getCaseDocByCaseId || (async (caseId) => ({
      _id: `${caseId}_doc`,
      caseId,
    })),
    isCloudFileID: overrides.isCloudFileID || ((value) => String(value).startsWith("cloud://")),
    nowIso: overrides.nowIso || (() => "2026-04-21T00:00:00.000Z"),
    ok,
  });

  return {
    db,
    service,
  };
}

test("case writes owner helper rejects missing and forbidden bundles", async () => {
  const { service } = createService({
    bundles: new Map([
      [
        "case_1",
        {
          case: {
            id: "case_1",
            rescuerId: "owner_1",
          },
        },
      ],
    ]),
  });

  assert.deepEqual(await service.getOwnedBundleOrFailure("owner_1", "missing"), {
    error: {
      ok: false,
      error: "CASE_NOT_FOUND",
      message: undefined,
    },
  });
  assert.deepEqual(await service.getOwnedBundleOrFailure("viewer_1", "case_1"), {
    error: {
      ok: false,
      error: "FORBIDDEN",
      message: "Only the rescuer can manage this case.",
    },
  });
});

test("case writes updates profile and cover asset for valid owner input", async () => {
  const { db, service } = createService();

  const result = await service.updateCaseProfile("owner_1", {
    caseId: "case_1",
    animalName: "小橘",
    coverFileID: "cloud://env/cover.png",
  });

  assert.equal(result.ok, true);
  assert.deepEqual(db.writes, [
    {
      op: "set",
      name: "evidence_assets",
      id: "case_1_cover",
      payload: {
        data: {
          assetId: "case_1_cover",
          caseId: "case_1",
          fileID: "cloud://env/cover.png",
          kind: "case_cover",
          visibility: "public",
          uploadedByOpenid: "owner_1",
          createdAt: "2026-04-21T00:00:00.000Z",
          updatedAt: "2026-04-21T00:00:00.000Z",
        },
      },
    },
    {
      op: "update",
      name: "rescue_cases",
      id: "case_1_doc",
      payload: {
        data: {
          updatedAt: "2026-04-21T00:00:00.000Z",
          animalName: "小橘",
          coverFileID: "cloud://env/cover.png",
        },
      },
    },
  ]);
});

test("case writes rejects invalid case profile before persistence", async () => {
  const { db, service } = createService();

  assert.deepEqual(await service.updateCaseProfile("owner_1", {
    caseId: "case_1",
    animalName: "",
  }), {
    ok: false,
    error: "INVALID_CASE_PROFILE",
    message: undefined,
  });
  assert.deepEqual(await service.updateCaseProfile("owner_1", {
    caseId: "case_1",
    coverFileID: "/tmp/local.png",
  }), {
    ok: false,
    error: "INVALID_ASSET_FILE_ID",
    message: undefined,
  });
  assert.deepEqual(db.writes, []);
});

test("case writes saves drafts, publishes cases, and touches cases", async () => {
  const { db, service } = createService();

  await service.saveDraftCase("owner_1", {
    draft: {
      animalName: "小橘",
      publicCaseId: "JM1001",
      budget: 1200,
    },
  });
  await service.publishCase("owner_1", {
    caseId: "case_1",
  });
  await service.touchCase("case_1", "2026-04-22T00:00:00.000Z");

  assert.equal(db.writes.length, 3);
  assert.equal(db.writes[0].op, "set");
  assert.equal(db.writes[0].id, "case_fixed");
  assert.equal(db.writes[0].payload.data.visibility, "draft");
  assert.equal(db.writes[1].op, "update");
  assert.equal(db.writes[1].payload.data.visibility, "published");
  assert.equal(db.writes[2].payload.data.updatedAt, "2026-04-22T00:00:00.000Z");
});
