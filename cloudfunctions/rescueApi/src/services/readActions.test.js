const assert = require("node:assert/strict");
const test = require("node:test");

const { fail, ok } = require("../runtime");
const { createReadActionsService } = require("./readActions");

function createService(overrides = {}) {
  const docsByCollection = overrides.docsByCollection || {};
  const composedInputs = [];
  const service = createReadActionsService({
    collections: {
      cases: "rescue_cases",
      supportEntries: "support_entries",
    },
    composeBundles: overrides.composeBundles || (async (caseDocs) => {
      composedInputs.push(caseDocs);
      return caseDocs.map((doc) => ({
        case: {
          id: doc.caseId,
          publicCaseId: doc.publicCaseId,
          animalName: doc.animalName,
          rescuerId: doc.rescuerOpenid || doc.rescuerId,
        },
        heroImageUrl: doc.heroImageUrl,
      }));
    }),
    dbCommand: {
      in: (values) => ({ $in: values }),
    },
    fail,
    formatCurrencyLabel: (amount) => `¥${Number(amount || 0).toLocaleString("zh-CN")}`,
    formatDateLabel: (iso) => iso,
    getBundleByCaseId: overrides.getBundleByCaseId || (async (caseId) => ({
      case: {
        id: caseId,
        rescuerId: "owner_1",
      },
    })),
    getCaseDocByCaseId: overrides.getCaseDocByCaseId || (async (caseId) => ({
      caseId,
      rescuerOpenid: "owner_1",
    })),
    getCaseId: (doc) => doc.caseId || doc._id,
    getHeroImageUrlFromBundle: (bundle) => bundle?.heroImageUrl,
    getOne: overrides.getOne || (async (name, where) => {
      const docs = docsByCollection[name] || [];
      return docs.find((doc) =>
        Object.entries(where).every(([key, value]) => doc[key] === value),
      );
    }),
    getProfileByOpenid: overrides.getProfileByOpenid || (async (openid) => ({
      openid,
      displayName: "记录维护者",
    })),
    ok,
    queryCollection: overrides.queryCollection || (async (name, where = {}) => {
      const docs = docsByCollection[name] || [];
      const entries = Object.entries(where);

      return docs.filter((doc) =>
        entries.every(([key, value]) => {
          if (Array.isArray(value?.$in)) {
            return value.$in.includes(doc[key]);
          }
          return doc[key] === value;
        }),
      );
    }),
    toCanonicalRescuer: (profile, fallbackOpenid) => ({
      id: fallbackOpenid,
      displayName: profile.displayName,
    }),
  });

  return {
    composedInputs,
    service,
  };
}

test("read actions list homepage cases through published bundle composition", async () => {
  const { composedInputs, service } = createService({
    docsByCollection: {
      rescue_cases: [
        {
          caseId: "case_1",
          rescuerOpenid: "owner_1",
          animalName: "小橘",
          visibility: "published",
        },
        {
          caseId: "case_2",
          rescuerOpenid: "owner_1",
          animalName: "草稿",
          visibility: "draft",
        },
      ],
    },
  });

  const result = await service.listHomepageCases();

  assert.equal(result.ok, true);
  assert.deepEqual(composedInputs[0].map((doc) => doc.caseId), ["case_1"]);
  assert.equal(result.data.bundles[0].case.animalName, "小橘");
});

test("read actions keep my support history totals and latest support sorting", async () => {
  const { service } = createService({
    docsByCollection: {
      rescue_cases: [
        {
          caseId: "case_1",
          publicCaseId: "JM1001",
          animalName: "小橘",
          rescuerOpenid: "owner_1",
          heroImageUrl: "https://img/case_1.png",
        },
        {
          caseId: "case_2",
          publicCaseId: "JM1002",
          animalName: "小黑",
          rescuerOpenid: "owner_2",
        },
      ],
      support_entries: [
        {
          caseId: "case_1",
          supporterUserId: "supporter_1",
          status: "confirmed",
          amount: 20,
          supportedAt: "2026-04-20T00:00:00.000Z",
        },
        {
          caseId: "case_1",
          supporterUserId: "supporter_1",
          status: "confirmed",
          amount: 30,
          supportedAt: "2026-04-21T00:00:00.000Z",
        },
        {
          caseId: "case_2",
          supporterUserId: "supporter_1",
          status: "confirmed",
          amount: 10,
          supportedAt: "2026-04-19T00:00:00.000Z",
        },
      ],
    },
  });

  const result = await service.getMySupportHistory("supporter_1");

  assert.equal(result.ok, true);
  assert.equal(result.data.summary.totalSupportedAmount, 60);
  assert.equal(result.data.summary.totalSupportedAmountLabel, "¥60");
  assert.deepEqual(result.data.summary.supportCases.map((item) => item.caseId), [
    "case_1",
    "case_2",
  ]);
  assert.equal(result.data.summary.supportCases[0].myTotalSupportedAmount, 50);
  assert.equal(result.data.summary.supportCases[0].animalCoverImageUrl, "https://img/case_1.png");
});

test("read actions resolve rescuer homepage from case id and de-duplicate cases", async () => {
  const { composedInputs, service } = createService({
    docsByCollection: {
      rescue_cases: [
        {
          caseId: "case_1",
          rescuerOpenid: "owner_1",
          animalName: "小橘",
          visibility: "published",
          updatedAt: "2026-04-20T00:00:00.000Z",
        },
        {
          caseId: "case_1",
          rescuerId: "owner_1",
          animalName: "小橘重复",
          visibility: "published",
          updatedAt: "2026-04-20T00:00:00.000Z",
        },
      ],
    },
    getCaseDocByCaseId: async () => ({
      caseId: "case_1",
      rescuerOpenid: "owner_1",
    }),
  });

  const result = await service.getRescuerHomepage("viewer_1", {
    caseId: "case_1",
  });

  assert.equal(result.ok, true);
  assert.equal(result.data.rescuer.id, "owner_1");
  assert.deepEqual(composedInputs[0].map((doc) => doc.caseId), ["case_1"]);
});

test("read actions enforce owner-only case detail access", async () => {
  const { service } = createService({
    getBundleByCaseId: async () => ({
      case: {
        id: "case_1",
        rescuerId: "owner_1",
      },
    }),
  });

  assert.deepEqual(await service.getOwnerCaseDetail("viewer_1", {
    caseId: "case_1",
  }), {
    ok: false,
    error: "FORBIDDEN",
    message: "Only the rescuer can manage this case.",
  });
});
