const assert = require("node:assert/strict");
const test = require("node:test");

const {
  getHeroImageUrlFromBundle,
  recomputeThreads,
  toCanonicalCase,
  toCanonicalEvent,
  toCanonicalSupportEntry,
} = require("./canonical");

test("canonical adapters preserve case, event, and support entry mapping", () => {
  assert.deepEqual(toCanonicalCase({
    caseId: "case_1",
    publicCaseId: "JM000001",
    rescuerOpenid: "openid_owner",
    animalName: "小橘",
    coverFileID: "cloud://env/case-cover.png",
    targetAmount: "1200",
    visibility: "published",
    createdAt: "2026-04-01T00:00:00.000Z",
    updatedAt: "2026-04-02T00:00:00.000Z",
  }), {
    id: "case_1",
    publicCaseId: "JM000001",
    rescuerId: "openid_owner",
    animalName: "小橘",
    species: "cat",
    coverAssetId: "case_1_cover",
    faceIdAssetId: undefined,
    foundAt: undefined,
    foundLocationText: undefined,
    initialSummary: "待补充事件说明",
    currentStatus: "medical",
    currentStatusLabel: "医疗救助中",
    targetAmount: 1200,
    visibility: "published",
    createdAt: "2026-04-01T00:00:00.000Z",
    updatedAt: "2026-04-02T00:00:00.000Z",
  });

  assert.deepEqual(toCanonicalEvent({
    eventId: "event_support_1",
    caseId: "case_1",
    type: "support",
    occurredAt: "2026-04-02T00:00:00.000Z",
    supporterOpenid: "openid_supporter",
    amount: "88",
    supporterNameMasked: "张**",
    verificationStatus: "confirmed",
  }), {
    id: "event_support_1",
    caseId: "case_1",
    type: "support",
    occurredAt: "2026-04-02T00:00:00.000Z",
    assetIds: [],
    visibility: "public",
    supporterUserId: "openid_supporter",
    amount: 88,
    currency: "CNY",
    supportSource: "platform_form",
    supporterNameMasked: "张**",
    message: undefined,
    verificationStatus: "confirmed",
  });

  assert.deepEqual(toCanonicalSupportEntry({
    entryId: "entry_1",
    supportThreadId: "thread_1",
    caseId: "case_1",
    supporterOpenid: "openid_supporter",
    amount: "88",
    supportedAt: "2026-04-02T00:00:00.000Z",
    screenshotFileIds: ["cloud://env/proof.png"],
    status: "confirmed",
    createdAt: "2026-04-02T00:00:00.000Z",
  }), {
    id: "entry_1",
    supportThreadId: "thread_1",
    caseId: "case_1",
    supporterUserId: "openid_supporter",
    supporterNameMasked: undefined,
    amount: 88,
    currency: "CNY",
    supportedAt: "2026-04-02T00:00:00.000Z",
    note: undefined,
    screenshotItems: [
      {
        id: "support-screenshot-0-0",
        kind: "payment_screenshot",
        imageUrl: "cloud://env/proof.png",
        hash: "cloud://env/proof.png",
      },
    ],
    screenshotHashes: ["cloud://env/proof.png"],
    status: "confirmed",
    unmatchedReason: undefined,
    unmatchedNote: undefined,
    createdAt: "2026-04-02T00:00:00.000Z",
    updatedAt: "2026-04-02T00:00:00.000Z",
    confirmedAt: undefined,
    confirmedByUserId: undefined,
    visibility: "private",
    projectedEventId: undefined,
  });
});

test("canonical adapters preserve support thread aggregation and hero fallback", () => {
  assert.deepEqual(recomputeThreads([
    {
      id: "entry_1",
      supportThreadId: "thread_1",
      caseId: "case_1",
      supporterUserId: "openid_supporter",
      amount: 20,
      currency: "CNY",
      supportedAt: "2026-04-01T00:00:00.000Z",
      screenshotItems: [],
      screenshotHashes: [],
      status: "pending",
      createdAt: "2026-04-01T00:00:00.000Z",
      updatedAt: "2026-04-01T00:00:00.000Z",
      visibility: "private",
    },
    {
      id: "entry_2",
      supportThreadId: "thread_1",
      caseId: "case_1",
      supporterUserId: "openid_supporter",
      supporterNameMasked: "张**",
      amount: 30,
      currency: "CNY",
      supportedAt: "2026-04-02T00:00:00.000Z",
      screenshotItems: [],
      screenshotHashes: [],
      status: "confirmed",
      createdAt: "2026-04-02T00:00:00.000Z",
      updatedAt: "2026-04-02T00:00:00.000Z",
      visibility: "private",
    },
  ]), [
    {
      id: "thread_1",
      caseId: "case_1",
      supporterUserId: "openid_supporter",
      supporterNameMasked: "张**",
      createdAt: "2026-04-01T00:00:00.000Z",
      updatedAt: "2026-04-02T00:00:00.000Z",
      totalConfirmedAmount: 30,
      totalPendingAmount: 20,
      totalUnmatchedAmount: 0,
      pendingCount: 1,
      unmatchedCount: 0,
      latestStatusSummary: "最近一条已确认",
    },
  ]);

  assert.equal(
    getHeroImageUrlFromBundle({
      case: {
        coverAssetId: undefined,
        faceIdAssetId: "face_asset",
      },
      events: [
        {
          type: "progress_update",
          visibility: "public",
          occurredAt: "2026-04-03T00:00:00.000Z",
          assetIds: ["progress_asset"],
        },
      ],
      assets: [
        {
          id: "face_asset",
          watermarkedUrl: "https://example.com/face.png",
        },
        {
          id: "progress_asset",
          watermarkedUrl: "https://example.com/progress.png",
        },
      ],
    }),
    "https://example.com/face.png",
  );
});
