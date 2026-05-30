import { test } from "node:test";
import assert from "node:assert/strict";
import { clampProgressPercent, getProgressWidth } from "./progressBarUtils";

test("progress percent is clamped to the visible bar range", () => {
  assert.equal(clampProgressPercent(-12), 0);
  assert.equal(clampProgressPercent(42.4), 42.4);
  assert.equal(clampProgressPercent(108), 100);
});

test("progress width is formatted as a percent string", () => {
  assert.equal(getProgressWidth(-1), "0%");
  assert.equal(getProgressWidth(67), "67%");
  assert.equal(getProgressWidth(140), "100%");
});
