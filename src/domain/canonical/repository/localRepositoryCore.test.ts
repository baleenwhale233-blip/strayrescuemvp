import assert from "node:assert/strict";
import test from "node:test";
import {
  caseIdToDraftId,
  draftIdToCaseId,
  toOwnerActionTimelineEntry,
} from "./localRepositoryCore";

test("repository core maps draft ids and case ids reversibly", () => {
  assert.equal(draftIdToCaseId("custom-project-123"), "case-123");
  assert.equal(caseIdToDraftId("case-123"), "custom-project-123");
});

test("repository core builds timeline entries for owner actions", () => {
  const receiptEntry = toOwnerActionTimelineEntry({
    action: "receipt",
    title: "支付：清创手术费 + 抗生素",
    description: "门诊检查和消炎药",
    amount: 320,
    imageUrls: ["https://example.com/receipt.png"],
    timestampLabel: "今天 14:20",
  });

  const budgetEntry = toOwnerActionTimelineEntry({
    action: "budget",
    title: "新增后期康复理疗预算",
    description: "复查后需要增加理疗预算",
    previousTargetAmount: 3000,
    currentTargetAmount: 4200,
    timestampLabel: "今天 15:30",
  });

  assert.equal(receiptEntry.tone, "expense");
  assert.equal(receiptEntry.label, "支出记录");
  assert.equal(receiptEntry.amount, 320);
  assert.deepEqual(receiptEntry.images, ["https://example.com/receipt.png"]);

  assert.equal(budgetEntry.tone, "budget");
  assert.equal(budgetEntry.label, "预算调整");
  assert.equal(budgetEntry.budgetPrevious, 3000);
  assert.equal(budgetEntry.budgetCurrent, 4200);
});
