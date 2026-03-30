import Taro from "@tarojs/taro";
import type { RescueCreateDraft } from "./localDraftPersistence.ts";

const CURRENT_DRAFT_KEY = "rescue-create-current-draft";
const SAVED_DRAFTS_KEY = "rescue-create-saved-drafts";

export const draftStorage = {
  getCurrent(): RescueCreateDraft | undefined {
    return Taro.getStorageSync(CURRENT_DRAFT_KEY) as RescueCreateDraft | undefined;
  },
  setCurrent(draft: RescueCreateDraft) {
    Taro.setStorageSync(CURRENT_DRAFT_KEY, draft);
  },
  clearCurrent() {
    Taro.removeStorageSync(CURRENT_DRAFT_KEY);
  },
  getSavedList(): RescueCreateDraft[] {
    return (Taro.getStorageSync(SAVED_DRAFTS_KEY) as RescueCreateDraft[] | undefined) ?? [];
  },
  setSavedList(drafts: RescueCreateDraft[]) {
    Taro.setStorageSync(SAVED_DRAFTS_KEY, drafts);
  },
};
