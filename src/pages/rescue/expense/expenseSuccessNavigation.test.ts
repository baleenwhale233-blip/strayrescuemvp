import assert from "node:assert/strict";
import test from "node:test";
import { getExpenseSuccessNavigation } from "./expenseSuccessNavigation";

test("edit mode success feedback does not navigate back before returning to record detail", () => {
  assert.deepEqual(getExpenseSuccessNavigation(true), {
    feedbackShouldNavigateBack: false,
    shouldReturnToRecordDetail: true,
  });
});

test("new expense success keeps the existing one-step return behavior", () => {
  assert.deepEqual(getExpenseSuccessNavigation(false), {
    feedbackShouldNavigateBack: true,
    shouldReturnToRecordDetail: false,
  });
});
