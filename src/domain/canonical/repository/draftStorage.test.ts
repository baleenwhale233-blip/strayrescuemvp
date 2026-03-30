import assert from "node:assert/strict";
import test from "node:test";
import { createDraftStorage } from "./draftStorageCore.ts";
import type { RescueCreateDraft } from "./localDraftPersistence.ts";

const draft: RescueCreateDraft = {
  id: "custom-project-1",
  name: "测试草稿",
  summary: "测试摘要",
  coverPath: "",
  budget: 1200,
  budgetNote: "",
  status: "draft",
  timeline: [],
  createdAt: "2026-03-01T10:00:00Z",
  updatedAt: "2026-03-01T10:00:00Z",
};

test("draftStorage can write and read current draft", () => {
  const draftStorage = createDraftStorage();
  draftStorage.setCurrent(draft);

  assert.deepEqual(draftStorage.getCurrent(), draft);
});

test("draftStorage can write and read saved draft list", () => {
  const draftStorage = createDraftStorage();
  draftStorage.setSavedList([draft]);

  assert.deepEqual(draftStorage.getSavedList(), [draft]);
});

test("draftStorage can clear current draft", () => {
  const draftStorage = createDraftStorage();
  draftStorage.setCurrent(draft);
  draftStorage.clearCurrent();

  assert.equal(draftStorage.getCurrent(), undefined);
});
