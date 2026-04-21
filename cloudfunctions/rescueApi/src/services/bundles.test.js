const assert = require("node:assert/strict");
const test = require("node:test");

const { createBundleService } = require("./bundles");

function createService(overrides = {}) {
  const docsByCollection = overrides.docsByCollection || {};
  const service = createBundleService({
    collections: {
      assets: "evidence_assets",
      cases: "rescue_cases",
      events: "case_events",
      expenses: "expense_records",
      profiles: "user_profiles",
      sharedEvidenceGroups: "shared_evidence_groups",
      supportEntries: "support_entries",
      supportThreads: "support_threads",
    },
    dbCommand: {
      in: (values) => ({ $in: values }),
    },
    getAssetFileID: (doc) => doc?.fileID,
    getCaseId: (doc) => doc?.caseId || doc?._id,
    getOne: overrides.getOne || (async (name, where) => {
      const docs = docsByCollection[name] || [];
      return docs.find((doc) =>
        Object.entries(where).every(([key, value]) => doc[key] === value),
      );
    }),
    getTempFileURLMap: async (fileIDs = []) =>
      new Map(fileIDs.filter(Boolean).map((fileID) => [fileID, `https://temp/${fileID}`])),
    nowIso: () => "2026-04-21T00:00:00.000Z",
    profileKey: (profile) => profile.openid,
    queryCollection: async (name, where = {}) => {
      const docs = docsByCollection[name] || [];
      const [[key, value]] = Object.entries(where);
      const allowed = value?.$in;
      return Array.isArray(allowed)
        ? docs.filter((doc) => allowed.includes(doc[key]))
        : docs;
    },
    recomputeThreads: (entries) =>
      entries.map((entry) => ({
        id: `thread:${entry.caseId}:${entry.supporterUserId}`,
        caseId: entry.caseId,
        supporterUserId: entry.supporterUserId,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
        totalConfirmedAmount: entry.status === "confirmed" ? entry.amount : 0,
        totalPendingAmount: entry.status === "pending" ? entry.amount : 0,
        totalUnmatchedAmount: entry.status === "unmatched" ? entry.amount : 0,
        pendingCount: entry.status === "pending" ? 1 : 0,
        unmatchedCount: entry.status === "unmatched" ? 1 : 0,
      })),
    toCanonicalAsset: (doc) => ({
      id: doc.assetId,
      kind: doc.kind,
      originalUrl: doc._tempFileURL || doc.fileID,
    }),
    toCanonicalCase: (doc) => ({
      id: doc.caseId,
      rescuerId: doc.rescuerOpenid,
      animalName: doc.animalName,
    }),
    toCanonicalEvent: (doc) => ({
      id: doc.eventId,
      caseId: doc.caseId,
      type: doc.type,
    }),
    toCanonicalExpenseRecord: (doc) => ({
      id: doc.recordId,
      caseId: doc.caseId,
      amount: doc.amount,
    }),
    toCanonicalRescuer: (profile, fallbackOpenid) => ({
      id: fallbackOpenid,
      displayName: profile.displayName,
    }),
    toCanonicalSharedEvidenceGroup: (doc) => ({
      id: doc.groupId,
      caseId: doc.caseId,
    }),
    toCanonicalSupportEntry: (doc) => ({
      id: doc.entryId,
      caseId: doc.caseId,
      supporterUserId: doc.supporterUserId,
      amount: doc.amount,
      status: doc.status,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }),
    withTempFileURL: (doc, tempFileURLMap) => ({
      ...doc,
      _tempFileURL: tempFileURLMap.get(doc.fileID),
    }),
  });

  return service;
}

test("bundle service resolves case documents by caseId before _id fallback", async () => {
  const service = createService({
    getOne: async (_name, where) => {
      if (where.caseId === "case_1") {
        return { _id: "doc_by_case_id", caseId: "case_1" };
      }
      if (where._id === "case_1") {
        return { _id: "doc_by_id", caseId: "case_1" };
      }
      return undefined;
    },
  });

  assert.deepEqual(await service.getCaseDocByCaseId("case_1"), {
    _id: "doc_by_case_id",
    caseId: "case_1",
  });
});

test("bundle service composes remote canonical bundles with scoped assets and entries", async () => {
  const service = createService({
    docsByCollection: {
      user_profiles: [
        {
          openid: "rescuer_1",
          displayName: "救助人",
          avatarAssetId: "avatar_1",
        },
      ],
      evidence_assets: [
        {
          assetId: "case_asset_1",
          caseId: "case_1",
          fileID: "cloud://case-photo",
          kind: "progress_photo",
        },
        {
          assetId: "avatar_1",
          fileID: "cloud://avatar",
          kind: "animal_face",
        },
      ],
      case_events: [
        {
          eventId: "event_1",
          caseId: "case_1",
          type: "progress_update",
        },
      ],
      expense_records: [
        {
          recordId: "expense_1",
          caseId: "case_1",
          amount: 88,
        },
      ],
      support_entries: [
        {
          entryId: "entry_1",
          caseId: "case_1",
          supporterUserId: "supporter_1",
          amount: 66,
          status: "confirmed",
          createdAt: "2026-04-21T00:00:00.000Z",
          updatedAt: "2026-04-21T00:00:00.000Z",
        },
      ],
      support_threads: [],
      shared_evidence_groups: [
        {
          groupId: "group_1",
          caseId: "case_1",
        },
      ],
    },
  });

  const bundles = await service.composeBundles([
    {
      caseId: "case_1",
      rescuerOpenid: "rescuer_1",
      animalName: "小橘",
      coverFileID: "cloud://cover",
    },
  ]);

  assert.equal(bundles.length, 1);
  assert.equal(bundles[0].sourceKind, "remote");
  assert.equal(bundles[0].rescuer.displayName, "救助人");
  assert.equal(bundles[0].events[0].id, "event_1");
  assert.equal(bundles[0].expenseRecords[0].id, "expense_1");
  assert.equal(bundles[0].supportEntries[0].id, "entry_1");
  assert.equal(bundles[0].supportThreads[0].id, "thread:case_1:supporter_1");
  assert.ok(bundles[0].assets.some((asset) => asset.id === "case_asset_1"));
  assert.ok(bundles[0].assets.some((asset) => asset.id === "avatar_1"));
  assert.ok(bundles[0].assets.some((asset) => asset.id === "case_1_cover"));
  assert.equal(bundles[0].sharedEvidenceGroups[0].id, "group_1");
});
