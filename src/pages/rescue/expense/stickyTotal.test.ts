import { test } from "node:test";
import assert from "node:assert/strict";
import { getCompactTotalThreshold, shouldShowCompactTotal } from "./stickyTotal";

test("compact total stays hidden before the original total reaches the sticky header", () => {
  const threshold = getCompactTotalThreshold({
    detailsHeadTop: 420,
    scrollTop: 0,
    stickyHeaderHeight: 96,
    revealOffset: 8,
  });

  assert.equal(threshold, 316);
  assert.equal(shouldShowCompactTotal({ scrollTop: 315, threshold }), false);
});

test("compact total appears once the original total leaves the readable top area", () => {
  const threshold = getCompactTotalThreshold({
    detailsHeadTop: 420,
    scrollTop: 0,
    stickyHeaderHeight: 96,
    revealOffset: 8,
  });

  assert.equal(shouldShowCompactTotal({ scrollTop: 316, threshold }), true);
  assert.equal(shouldShowCompactTotal({ scrollTop: 480, threshold }), true);
});

test("compact total threshold is clamped for short pages or unusual native metrics", () => {
  const threshold = getCompactTotalThreshold({
    detailsHeadTop: 60,
    scrollTop: 0,
    stickyHeaderHeight: 96,
    revealOffset: 8,
  });

  assert.equal(threshold, 0);
  assert.equal(shouldShowCompactTotal({ scrollTop: 0, threshold }), true);
});
