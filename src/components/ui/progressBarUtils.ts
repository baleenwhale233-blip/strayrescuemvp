export function clampProgressPercent(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, value));
}

export function getProgressWidth(value: number) {
  return `${clampProgressPercent(value)}%`;
}
