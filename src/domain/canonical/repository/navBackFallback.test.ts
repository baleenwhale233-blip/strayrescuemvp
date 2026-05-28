import assert from "node:assert/strict";
import test from "node:test";
import { DISCOVER_TAB_PATH, getNavBackAction } from "../../../utils/navBackFallback";

test("nav back uses normal back when a previous page exists", () => {
  assert.deepEqual(getNavBackAction(2), {
    type: "navigateBack",
  });
});

test("nav back falls back to discover tab for share-entry pages", () => {
  assert.deepEqual(getNavBackAction(1), {
    type: "switchTab",
    url: DISCOVER_TAB_PATH,
  });
});
