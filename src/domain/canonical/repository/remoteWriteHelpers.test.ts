import assert from "node:assert/strict";
import test from "node:test";

import type { RescueCreateDraft } from "./draftRepository";
import {
  buildLocalManualSupportEntryInput,
  toRemoteDraftPayload,
} from "./remote/writeHelpers";

const sampleDraft: RescueCreateDraft = {
  id: "custom-project-001",
  publicCaseId: "JM000001",
  name: "小橘",
  summary: "需要继续治疗",
  coverPath: "cloud://env/case-cover.png",
  budget: 1200,
  budgetNote: "",
  species: "cat",
  currentStatus: "recovery",
  currentStatusLabel: "康复观察",
  foundLocationText: "上海",
  rescuerName: "阿青",
  rescuerAvatarUrl: "",
  rescuerWechatId: "aqing",
  rescuerVerifiedLevel: "wechat",
  rescuerJoinedAt: "2026-04-01T00:00:00.000Z",
  rescuerStats: {
    publishedCaseCount: 1,
    verifiedReceiptCount: 2,
  },
  paymentQrUrl: "",
  status: "draft",
  timeline: [],
  sharedEvidenceGroups: [],
  expenseRecords: [],
  supportThreads: [],
  supportEntries: [],
  homepageEligibility: {
    status: "public_but_not_eligible",
    reason: "待计算首页资格",
  },
  createdAt: "2026-04-20T00:00:00.000Z",
  updatedAt: "2026-04-20T00:00:00.000Z",
};

test("remote write helpers preserve draft-to-remote payload mapping", () => {
  assert.deepEqual(toRemoteDraftPayload(sampleDraft, "published", {
    draftIdToCaseId: () => "case-001",
  }), {
    caseId: "case-001",
    publicCaseId: "JM000001",
    name: "小橘",
    animalName: "小橘",
    summary: "需要继续治疗",
    initialSummary: "需要继续治疗",
    species: "cat",
    currentStatus: "recovery",
    currentStatusLabel: "康复观察",
    budget: 1200,
    targetAmount: 1200,
    coverFileID: "cloud://env/case-cover.png",
    foundLocationText: "上海",
    createdAt: "2026-04-20T00:00:00.000Z",
  });
});

test("remote write helpers preserve local manual-entry fallback semantics", () => {
  assert.deepEqual(
    buildLocalManualSupportEntryInput(
      {
        supporterNameMasked: "",
        amount: 88,
        supportedAt: "2026-04-20T10:00:00.000Z",
        note: "线下补登",
      },
      { now: () => 1234567890 },
    ),
    {
      supporterUserId: "manual-supporter:1234567890",
      supporterNameMasked: "线下记录",
      amount: 88,
      supportedAt: "2026-04-20T10:00:00.000Z",
      note: "线下补登",
      status: "confirmed",
    },
  );
});
