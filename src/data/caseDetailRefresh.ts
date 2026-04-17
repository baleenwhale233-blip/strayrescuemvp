import Taro from "@tarojs/taro";

function getCaseDetailRefreshKey(caseId?: string) {
  return `case-detail-refresh:${caseId || "unknown-case"}`;
}

export function markCaseDetailRefresh(caseId?: string) {
  if (!caseId) {
    return;
  }

  Taro.setStorageSync(getCaseDetailRefreshKey(caseId), "1");
}

export function consumeCaseDetailRefresh(caseId?: string) {
  if (!caseId) {
    return false;
  }

  const key = getCaseDetailRefreshKey(caseId);
  const shouldRefresh = Taro.getStorageSync(key) === "1";

  if (shouldRefresh) {
    Taro.removeStorageSync(key);
  }

  return shouldRefresh;
}
