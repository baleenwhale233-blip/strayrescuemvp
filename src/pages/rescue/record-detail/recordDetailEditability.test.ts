import assert from "node:assert/strict";
import test from "node:test";
import { canEditExpenseRecord } from "./recordDetailEditability";

test("expense detail editability can come from the owner timeline fallback", () => {
  assert.equal(canEditExpenseRecord({ kind: "expense", editable: true }, undefined), true);
  assert.equal(
    canEditExpenseRecord({ kind: "expense", editable: false }, { editable: true }),
    true,
  );
  assert.equal(canEditExpenseRecord({ kind: "status", editable: true }, { editable: true }), false);
});
