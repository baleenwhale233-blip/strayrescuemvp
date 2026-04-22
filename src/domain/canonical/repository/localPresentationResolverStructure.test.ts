import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

test("local presentation resolver delegates overlay composition to core pure functions", () => {
  const source = readFileSync(
    join(process.cwd(), "src/domain/canonical/repository/localPresentationResolver.ts"),
    "utf8",
  );

  assert.equal(source.includes("resolveBundlePresentationCore"), true);
  assert.equal(source.includes("finalizePublicDetailPresentationCore"), true);
  assert.equal(source.includes("finalizeOwnerDetailPresentationCore"), true);
  assert.equal(source.includes("finalizeHomepageCaseCardPresentationCore"), true);
  assert.equal(source.includes("finalizeWorkbenchCaseCardPresentationCore"), true);
  assert.equal(source.includes("function createOverlayAssetId"), false);
  assert.equal(source.includes("function cloneOverlayAsset"), false);
  assert.equal(source.includes("function inferCaseCurrentStatus"), false);
  assert.equal(source.includes("function replaceTimelineLabels"), false);
});
