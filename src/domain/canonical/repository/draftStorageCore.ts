import type { RescueCreateDraft } from "./localDraftPersistence.ts";

export type DraftStorageState = {
  current?: RescueCreateDraft;
  savedList: RescueCreateDraft[];
};

export function createDraftStorage(initial?: Partial<DraftStorageState>) {
  let state: DraftStorageState = {
    current: initial?.current,
    savedList: initial?.savedList ?? [],
  };

  return {
    getCurrent(): RescueCreateDraft | undefined {
      return state.current;
    },
    setCurrent(draft: RescueCreateDraft) {
      state = {
        ...state,
        current: draft,
      };
    },
    clearCurrent() {
      state = {
        ...state,
        current: undefined,
      };
    },
    getSavedList(): RescueCreateDraft[] {
      return state.savedList;
    },
    setSavedList(drafts: RescueCreateDraft[]) {
      state = {
        ...state,
        savedList: drafts,
      };
    },
  };
}
