import Taro from "@tarojs/taro";
import type { RescueCreateDraft } from "./localDraftPersistence";

const CURRENT_DRAFT_KEY = "rescue-create-current-draft";
const SAVED_DRAFTS_KEY = "rescue-create-saved-drafts";

function isDraftLike(value: unknown): value is RescueCreateDraft {
  return Boolean(
    value &&
      typeof value === "object" &&
      "id" in value &&
      "timeline" in value &&
      Array.isArray((value as RescueCreateDraft).timeline),
  );
}

function normalizeSavedDrafts(value: unknown): RescueCreateDraft[] {
  if (Array.isArray(value)) {
    return value.filter(isDraftLike);
  }

  if (isDraftLike(value)) {
    return [value];
  }

  if (
    value &&
    typeof value === "object" &&
    "savedList" in value &&
    Array.isArray((value as { savedList?: unknown[] }).savedList)
  ) {
    return ((value as { savedList?: unknown[] }).savedList ?? []).filter(
      isDraftLike,
    );
  }

  return [];
}

export const draftStorage = {
  getCurrent(): RescueCreateDraft | undefined {
    const raw = Taro.getStorageSync(CURRENT_DRAFT_KEY);
    return isDraftLike(raw) ? raw : undefined;
  },
  setCurrent(draft: RescueCreateDraft) {
    Taro.setStorageSync(CURRENT_DRAFT_KEY, draft);
  },
  clearCurrent() {
    Taro.removeStorageSync(CURRENT_DRAFT_KEY);
  },
  getSavedList(): RescueCreateDraft[] {
    const raw = Taro.getStorageSync(SAVED_DRAFTS_KEY);
    const normalized = normalizeSavedDrafts(raw);

    if (!Array.isArray(raw) || raw.length !== normalized.length) {
      Taro.setStorageSync(SAVED_DRAFTS_KEY, normalized);
    }

    return normalized;
  },
  setSavedList(drafts: RescueCreateDraft[]) {
    Taro.setStorageSync(
      SAVED_DRAFTS_KEY,
      drafts.filter(isDraftLike),
    );
  },
};
