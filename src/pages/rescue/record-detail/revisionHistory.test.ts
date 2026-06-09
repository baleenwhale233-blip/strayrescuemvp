import assert from "node:assert/strict";
import test from "node:test";
import { getExpenseRevisionIndexLabel, getOrderedExpenseRevisions } from "./revisionHistory";

test("expense revisions display oldest first so the latest stays at the bottom", () => {
  const ordered = getOrderedExpenseRevisions([
    { revisionId: "second", editedAt: "2026-06-08T07:38:00.000Z" },
    { revisionId: "first", editedAt: "2026-06-08T07:30:00.000Z" },
  ]);

  assert.deepEqual(
    ordered.map((revision) => revision.revisionId),
    ["first", "second"],
  );
});

test("expense revision labels count upward by display order", () => {
  assert.equal(getExpenseRevisionIndexLabel(0), "第 1 次修改");
  assert.equal(getExpenseRevisionIndexLabel(1), "第 2 次修改");
});
