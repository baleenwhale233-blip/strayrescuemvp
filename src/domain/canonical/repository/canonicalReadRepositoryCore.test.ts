import assert from "node:assert/strict";
import test from "node:test";
import { sampleCaseBundle } from "../fixtures/sampleCaseBundle";
import type { CanonicalCaseBundle } from "../types";
import {
  getCaseByPublicIdExactFromBundles,
  getCanonicalBundleByCaseIdFromBundles,
  getDiscoverCardVMsFromBundles,
  getHomepageCaseCardVMsFromBundles,
  getMySupportThreadByCaseIdFromBundles,
  getOwnerDetailVMByCaseIdFromBundles,
  getPublicDetailVMByCaseIdFromBundles,
  getSupportThreadsByCaseIdFromBundles,
  getSupportSheetDataByCaseIdFromBundles,
  getWorkbenchVMFromBundles,
} from "./canonicalReadRepositoryCore";

const publishedBundle = sampleCaseBundle as CanonicalCaseBundle;
const draftBundle: CanonicalCaseBundle = {
  ...sampleCaseBundle,
  sourceKind: "local",
  case: {
    ...sampleCaseBundle.case,
    id: "case-123",
    visibility: "draft",
    animalName: "本地草稿狸花",
  },
};

const publishedLocalBundle: CanonicalCaseBundle = {
  ...sampleCaseBundle,
  sourceKind: "local",
  case: {
    ...sampleCaseBundle.case,
    id: "case-456",
    visibility: "published",
    animalName: "本地已发布大橘",
    targetAmount: 3000,
  },
  events: [
    ...sampleCaseBundle.events.filter((event) => event.type !== "support"),
    {
      id: "evt_local_support_pending",
      caseId: "case-456",
      type: "support",
      occurredAt: "2026-03-29T09:00:00Z",
      amount: 80,
      currency: "CNY",
      supportSource: "donor_claim",
      supporterNameMasked: "张**",
      message: "待确认支持",
      verificationStatus: "pending",
      assetIds: [],
      visibility: "private",
    },
  ],
};

test("published case appears in discover while draft case does not", () => {
  const cards = getDiscoverCardVMsFromBundles([
    publishedBundle,
    draftBundle,
    publishedLocalBundle,
  ]);

  const caseIds = cards.map((card) => card.caseId);

  assert.ok(caseIds.includes("case_001"));
  assert.ok(caseIds.includes("case-456"));
  assert.ok(!caseIds.includes("case-123"));
});

test("read repository resolves bundles and details by caseId", () => {
  const bundles = [publishedBundle, draftBundle];
  const bundle = getCanonicalBundleByCaseIdFromBundles(bundles, "case_001");
  const detail = getPublicDetailVMByCaseIdFromBundles(bundles, "case_001");

  assert.ok(bundle);
  assert.equal(bundle?.case.id, "case_001");
  assert.ok(detail);
  assert.equal(detail?.caseId, "case_001");
});

test("owner detail ledger semantics remain explicit and stable", () => {
  const ownerVm = getOwnerDetailVMByCaseIdFromBundles([publishedBundle], "case_001");

  assert.ok(ownerVm);
  assert.equal(ownerVm?.ledger.supportedAmount, 100);
  assert.equal(ownerVm?.ledger.confirmedExpenseAmount, 280);
  assert.equal(ownerVm?.ledger.verifiedGapAmount, 180);
  assert.equal(ownerVm?.ledger.remainingTargetAmount, 3920);
});

test("seed and local bundles expose explicit sourceKind", () => {
  assert.equal(publishedBundle.sourceKind, "seed");
  assert.equal(draftBundle.sourceKind, "local");
});

test("workbench reads sourceKind from bundle instead of inferring from rescuerId", () => {
  const weirdLocalBundle: CanonicalCaseBundle = {
    ...draftBundle,
    rescuer: {
      ...draftBundle.rescuer,
      id: "rescuer_999",
    },
  };

  const vm = getWorkbenchVMFromBundles([weirdLocalBundle]);

  assert.ok(vm);
  assert.equal(vm?.draftCases[0]?.sourceKind, "local");
});

test("support sheet data comes from public detail output", () => {
  const support = getSupportSheetDataByCaseIdFromBundles([publishedBundle], "case_001");

  assert.ok(support);
  assert.equal(support?.wechatId, "aqing_rescue");
});

test("public case id exact search supports prefixed and digits-only input", () => {
  const prefixed = getCaseByPublicIdExactFromBundles([publishedBundle], "JM482731");
  const digitsOnly = getCaseByPublicIdExactFromBundles([publishedBundle], "482731");

  assert.equal(prefixed?.case.id, "case_001");
  assert.equal(digitsOnly?.case.id, "case_001");
});

test("homepage richer card vm exposes recommendation and eligibility", () => {
  const cards = getHomepageCaseCardVMsFromBundles([publishedBundle]);
  const firstCard = cards[0];

  assert.ok(firstCard);
  assert.equal(firstCard.publicCaseId, "JM482731");
  assert.equal(firstCard.homepageEligibilityStatus, "eligible");
  assert.ok(firstCard.fundingStatusSummary.includes("当前缺口"));
});

test("support entries are grouped into threads", () => {
  const threads = getSupportThreadsByCaseIdFromBundles([publishedBundle], "case_001");
  const wangThread = getMySupportThreadByCaseIdFromBundles(
    [publishedBundle],
    "case_001",
    "supporter_wang_001",
  );

  assert.equal(threads.length, 2);
  assert.ok(wangThread);
  assert.equal(wangThread?.totalConfirmedAmount, 100);
});

test("public detail exposes support summary from structured support entries", () => {
  const detail = getPublicDetailVMByCaseIdFromBundles([publishedBundle], "case_001");

  assert.ok(detail);
  assert.equal(detail?.supportSummary.confirmedSupportAmount, 100);
  assert.equal(detail?.supportSummary.pendingSupportEntryCount, 1);
  assert.equal(detail?.supportSummary.unmatchedSupportEntryCount, 0);
  assert.equal(detail?.supportSummary.threads.length, 2);
});

test("owner detail exposes homepage eligibility and pending support counts", () => {
  const ownerVm = getOwnerDetailVMByCaseIdFromBundles([publishedBundle], "case_001");

  assert.ok(ownerVm);
  assert.equal(ownerVm?.publicCaseId, "JM482731");
  assert.equal(ownerVm?.homepageEligibilityStatus, "eligible");
  assert.equal(ownerVm?.pendingSupportEntryCount, 1);
});
