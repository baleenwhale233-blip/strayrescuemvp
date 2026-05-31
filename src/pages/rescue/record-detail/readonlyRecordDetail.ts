import Taro from "@tarojs/taro";
import type { RescueReadonlyRecordDetail } from "../../../components/rescue";

const RECORD_DETAIL_STORAGE_KEY = "rescue-readonly-record-detail";

function getRecordType(item: RescueReadonlyRecordDetail) {
  return item.recordType || (item.kind === "status" ? "progress_update" : item.kind);
}

export function getStoredReadonlyRecordDetail() {
  const stored = Taro.getStorageSync(RECORD_DETAIL_STORAGE_KEY);
  return stored && typeof stored === "object" ? (stored as RescueReadonlyRecordDetail) : undefined;
}

export function openReadonlyRecordDetail(item: RescueReadonlyRecordDetail) {
  Taro.setStorageSync(RECORD_DETAIL_STORAGE_KEY, item);

  const query = [
    `id=${encodeURIComponent(item.recordId || item.id)}`,
    `kind=${item.kind}`,
    `recordType=${getRecordType(item)}`,
    item.caseId ? `caseId=${encodeURIComponent(item.caseId)}` : "",
  ]
    .filter(Boolean)
    .join("&");

  Taro.navigateTo({
    url: `/pages/rescue/record-detail/index?${query}`,
  });
}
