import assert from "node:assert/strict";
import test from "node:test";

import {
  clearCaseContentWriteLocalFallback,
  clearCaseProfileLocalFallback,
  recordCaseContentWriteLocalFallback,
  recordCaseProfileLocalFallback,
} from "./localFallbackCore";

test("local fallback facade exposes semantic profile fallback operations", () => {
  const calls: unknown[] = [];

  recordCaseProfileLocalFallback(
    {
      caseId: "case_1",
      draftId: "draft_1",
      title: "小橘",
      coverPath: "https://example.com/cover.png",
    },
    {
      saveCaseTitleOverride: (input) => calls.push(["saveTitle", input]),
      saveCaseCoverOverride: (input) => calls.push(["saveCover", input]),
      clearCaseTitleOverride: (caseId?: string, draftId?: string) =>
        calls.push(["clearTitle", caseId, draftId]),
      clearCaseCoverOverride: (caseId?: string, draftId?: string) =>
        calls.push(["clearCover", caseId, draftId]),
    },
  );
  clearCaseProfileLocalFallback(
    {
      caseId: "case_1",
      draftId: "draft_1",
      clearTitle: true,
      clearCover: true,
    },
    {
      saveCaseTitleOverride: (input) => calls.push(["saveTitle", input]),
      saveCaseCoverOverride: (input) => calls.push(["saveCover", input]),
      clearCaseTitleOverride: (caseId?: string, draftId?: string) =>
        calls.push(["clearTitle", caseId, draftId]),
      clearCaseCoverOverride: (caseId?: string, draftId?: string) =>
        calls.push(["clearCover", caseId, draftId]),
    },
  );

  assert.deepEqual(calls, [
    ["saveTitle", { title: "小橘", caseId: "case_1", draftId: "draft_1" }],
    ["saveCover", { coverPath: "https://example.com/cover.png", caseId: "case_1", draftId: "draft_1" }],
    ["clearTitle", "case_1", "draft_1"],
    ["clearCover", "case_1", "draft_1"],
  ]);
});

test("local fallback facade exposes semantic content-write fallback operations", () => {
  const calls: unknown[] = [];
  const deps = {
    saveCaseBudgetAdjustment: (caseId: string | undefined, submission: unknown) =>
      calls.push(["saveBudget", caseId, submission]),
    saveCaseExpenseSubmission: (caseId: string | undefined, submission: unknown) =>
      calls.push(["saveExpense", caseId, submission]),
    saveCaseStatusSubmission: (caseId: string | undefined, submission: unknown) =>
      calls.push(["saveStatus", caseId, submission]),
    clearCaseBudgetAdjustments: (caseId?: string) => calls.push(["clearBudget", caseId]),
    clearCaseExpenseSubmissions: (caseId?: string) => calls.push(["clearExpense", caseId]),
    clearCaseStatusSubmissions: (caseId?: string) => calls.push(["clearStatus", caseId]),
  };

  recordCaseContentWriteLocalFallback(
    {
      caseId: "case_1",
      kind: "budget",
      submission: {
        id: "budget_1",
        previousTargetAmount: 100,
        currentTargetAmount: 200,
        reason: "复查",
        timestampLabel: "今天 10:00",
        createdAt: "2026-04-20T00:00:00Z",
      },
    },
    deps,
  );
  recordCaseContentWriteLocalFallback(
    {
      caseId: "case_1",
      kind: "status",
      submission: {
        id: "status_1",
        statusLabel: "康复观察",
        description: "恢复中",
        timestampLabel: "今天 10:00",
        assetUrls: [],
        createdAt: "2026-04-20T00:00:00Z",
      },
    },
    deps,
  );
  recordCaseContentWriteLocalFallback(
    {
      caseId: "case_1",
      kind: "expense",
      submission: {
        id: "expense_1",
        title: "复查",
        amount: 100,
        timestampLabel: "今天 10:00",
        assetUrls: [],
        createdAt: "2026-04-20T00:00:00Z",
      },
    },
    deps,
  );

  clearCaseContentWriteLocalFallback({ caseId: "case_1", kind: "budget" }, deps);
  clearCaseContentWriteLocalFallback({ caseId: "case_1", kind: "status" }, deps);
  clearCaseContentWriteLocalFallback({ caseId: "case_1", kind: "expense" }, deps);

  assert.deepEqual(calls.map((call) => (call as unknown[])[0]), [
    "saveBudget",
    "saveStatus",
    "saveExpense",
    "clearBudget",
    "clearStatus",
    "clearExpense",
  ]);
});
