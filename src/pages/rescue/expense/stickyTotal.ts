type CompactTotalThresholdInput = {
  detailsHeadTop: number;
  scrollTop: number;
  stickyHeaderHeight: number;
  revealOffset?: number;
};

type CompactTotalVisibilityInput = {
  scrollTop: number;
  threshold: number;
};

function toFiniteNumber(value: number, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

export function getCompactTotalThreshold(input: CompactTotalThresholdInput) {
  const detailsHeadDocumentTop =
    toFiniteNumber(input.detailsHeadTop) + Math.max(0, toFiniteNumber(input.scrollTop));
  const stickyBottom =
    Math.max(0, toFiniteNumber(input.stickyHeaderHeight)) +
    Math.max(0, toFiniteNumber(input.revealOffset ?? 0));

  return Math.max(0, Math.round(detailsHeadDocumentTop - stickyBottom));
}

export function shouldShowCompactTotal(input: CompactTotalVisibilityInput) {
  const scrollTop = Math.max(0, toFiniteNumber(input.scrollTop));
  const threshold = Math.max(0, toFiniteNumber(input.threshold, Number.POSITIVE_INFINITY));

  return scrollTop >= threshold;
}
