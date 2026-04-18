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

test("getPublicDetailVM prefers case cover for hero image when available", () => {
  const vm = getPublicDetailVM(bundle);

  assert.equal(
    vm.heroImageUrl,
    "https://example.com/assets/case-cover-watermarked.png",
  );
});

test("getPublicDetailVM exposes latest public timeline summary", () => {
  const vm = getPublicDetailVM(bundle);

  assert.equal(vm.latestTimelineSummary, "复查后需要进一步治疗，增加药费预算");
  assert.equal(vm.timeline[0]?.label, "预算调整");
});

test("getPublicDetailVM exposes stable rescue start time", () => {
  const vm = getPublicDetailVM(bundle);

  assert.equal(vm.rescueStartedAt, "2026-03-28T08:30:00Z");
  assert.equal(vm.rescueStartedAtLabel, "03-28 16:30");
});

test("getPublicDetailVM falls back to the latest public progress photo when cover and face are missing", () => {
  const vm = getPublicDetailVM({
    ...bundle,
    case: {
      ...bundle.case,
      coverAssetId: undefined,
      faceIdAssetId: undefined,
    },
    events: [
      ...bundle.events,
      {
        id: "evt_007",
        caseId: bundle.case.id,
        type: "progress_update",
        occurredAt: "2026-03-30T12:30:00Z",
        statusLabel: "继续治疗",
        text: "今天精神稳定，继续观察恢复情况",
        assetIds: ["asset_progress_002"],
        visibility: "public",
      },
    ],
    assets: [
      ...bundle.assets,
      {
        id: "asset_progress_002",
        kind: "progress_photo",
        originalUrl: "https://example.com/assets/progress-002.png",
        watermarkedUrl: "https://example.com/assets/progress-002-watermarked.png",
        thumbnailUrl: "https://example.com/assets/progress-002-thumb.png",
      },
    ],
  });

  assert.equal(
    vm.heroImageUrl,
    "https://example.com/assets/progress-002-watermarked.png",
  );
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
