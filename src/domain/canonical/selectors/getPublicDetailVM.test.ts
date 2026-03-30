import assert from "node:assert/strict";
import test from "node:test";
import { sampleCaseBundle } from "../fixtures/sampleCaseBundle";
import { getDiscoverCardVM } from "./getDiscoverCardVM";
import { getPublicDetailVM } from "./getPublicDetailVM";
import { getWorkbenchVM } from "./getWorkbenchVM";
import type {
  CanonicalCaseBundle,
  CanonicalRescuer,
} from "../types";

const bundle = sampleCaseBundle as CanonicalCaseBundle;

test("getPublicDetailVM only counts confirmed support into supportedAmount", () => {
  const vm = getPublicDetailVM(bundle);

  assert.equal(vm.ledger.supportedAmount, 100);
  assert.equal(vm.ledger.pendingSupportAmount, 60);
  assert.equal(vm.ledger.targetAmount, 4200);
  assert.equal(vm.statusLabel, "医疗救助中");
});

test("getPublicDetailVM exposes latest public timeline summary", () => {
  const vm = getPublicDetailVM(bundle);

  assert.equal(vm.latestTimelineSummary, "复查后需要进一步治疗，增加药费预算");
  assert.equal(vm.timeline[0]?.label, "预算调整");
});

test("getDiscoverCardVM derives list-friendly card fields from canonical bundle", () => {
  const vm = getDiscoverCardVM(bundle);

  assert.equal(vm.caseId, "case_001");
  assert.equal(vm.amountLabel, "¥100 / ¥4,200");
  assert.equal(vm.latestTimelineSummary, "复查后需要进一步治疗，增加药费预算");
});

test("getWorkbenchVM groups published and draft cases by visibility", () => {
  const draftBundle: CanonicalCaseBundle = {
    ...bundle,
    case: {
      ...bundle.case,
      id: "case_002",
      visibility: "draft",
    },
  };

  const vm = getWorkbenchVM({
    rescuer: bundle.rescuer as CanonicalRescuer,
    cases: [bundle, draftBundle],
    includeAllCases: true,
    getCaseMeta: () => ({}),
  });

  assert.equal(vm.counts.active, 1);
  assert.equal(vm.counts.draft, 1);
  assert.equal(vm.activeCases[0]?.caseId, "case_001");
  assert.equal(vm.draftCases[0]?.caseId, "case_002");
});
