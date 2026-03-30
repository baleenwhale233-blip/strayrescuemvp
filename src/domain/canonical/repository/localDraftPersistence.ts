import { draftStorage } from "./draftStorage";

export type RescueCreateEntryTone = "expense" | "status" | "income" | "budget";

export type RescueCreateTimelineEntry = {
  id: string;
  tone: RescueCreateEntryTone;
  label: string;
  title: string;
  description?: string;
  timestamp: string;
  amount?: number;
  images?: string[];
  budgetPrevious?: number;
  budgetCurrent?: number;
};

export type RescueCreateDraftStatus = "draft" | "published";

export type RescueCreateDraft = {
  id: string;
  name: string;
  summary: string;
  coverPath: string;
  budget: number;
  budgetNote: string;
  status: RescueCreateDraftStatus;
  timeline: RescueCreateTimelineEntry[];
  createdAt: string;
  updatedAt: string;
};

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}`;
}

export function formatTimelineTimestamp(date = new Date()) {
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");

  return `今天 ${hours}:${minutes}`;
}

export function createInitialDraft(): RescueCreateDraft {
  const timestamp = nowIso();

  return {
    id: createId("custom-project"),
    name: "",
    summary: "",
    coverPath: "",
    budget: 0,
    budgetNote: "",
    status: "draft",
    timeline: [
      {
        id: createId("entry"),
        tone: "status",
        label: "状态更新",
        title: "已创建基础档案，等待补充第一条进展",
        description:
          "完成封面、代号和事件简述后，就可以继续设定预算并进入救助页预览。",
        timestamp: formatTimelineTimestamp(),
      },
    ],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function startNewDraftSession() {
  const draft = createInitialDraft();
  draftStorage.setCurrent(draft);
  return draft;
}

export function getCurrentDraftSession() {
  return draftStorage.getCurrent();
}

export function setCurrentDraftSession(draft: RescueCreateDraft) {
  const nextDraft = {
    ...draft,
    updatedAt: nowIso(),
  };

  draftStorage.setCurrent(nextDraft);
  return nextDraft;
}

export function patchCurrentDraftSession(
  patch: Partial<RescueCreateDraft>,
) {
  const current = getCurrentDraftSession() ?? startNewDraftSession();

  return setCurrentDraftSession({
    ...current,
    ...patch,
  });
}

export function clearCurrentDraftSession() {
  draftStorage.clearCurrent();
}

export function getSavedDrafts() {
  return draftStorage.getSavedList();
}

export function getSavedDraftById(id?: string) {
  if (!id) {
    return undefined;
  }

  return getSavedDrafts().find((draft) => draft.id === id);
}

export function upsertSavedDraft(draft: RescueCreateDraft) {
  const drafts = [...getSavedDrafts()];
  const nextDraft = {
    ...draft,
    updatedAt: nowIso(),
  };
  const index = drafts.findIndex((item) => item.id === draft.id);

  if (index >= 0) {
    drafts[index] = nextDraft;
  } else {
    drafts.unshift(nextDraft);
  }

  draftStorage.setSavedList(drafts);
  return nextDraft;
}

export function saveCurrentDraft(status: RescueCreateDraftStatus) {
  const current = getCurrentDraftSession() ?? startNewDraftSession();
  const saved = upsertSavedDraft({
    ...current,
    status,
  });

  setCurrentDraftSession(saved);
  return saved;
}

export function appendEntryToDraft(
  draft: RescueCreateDraft,
  entry: RescueCreateTimelineEntry,
) {
  const nextDraft: RescueCreateDraft = {
    ...draft,
    timeline: [entry, ...draft.timeline],
  };

  setCurrentDraftSession(nextDraft);
  return nextDraft;
}

export function replaceDraftById(draft: RescueCreateDraft) {
  return setCurrentDraftSession(draft);
}

export function calculateDraftLedger(draft: RescueCreateDraft) {
  const expense = draft.timeline
    .filter((entry) => entry.tone === "expense")
    .reduce((sum, entry) => sum + Math.max(entry.amount ?? 0, 0), 0);
  const income = draft.timeline
    .filter((entry) => entry.tone === "income")
    .reduce((sum, entry) => sum + Math.max(entry.amount ?? 0, 0), 0);
  const balance = Math.max(income - expense, 0);
  const pending = Math.max(draft.budget - Math.max(income, expense), 0);

  return {
    expense,
    income,
    balance,
    pending,
    progress:
      draft.budget > 0
        ? Math.min(Math.round((income / draft.budget) * 100), 100)
        : 0,
  };
}
