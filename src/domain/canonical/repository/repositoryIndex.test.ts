import assert from "node:assert/strict";
import { join } from "node:path";
import { readFileSync } from "node:fs";
import test from "node:test";

test("repository barrel keeps page-facing APIs and hides internal-only helpers", () => {
  const source = readFileSync(
    join(process.cwd(), "src/domain/canonical/repository/index.ts"),
    "utf8",
  );

  assert.equal(source.includes('export * from "./canonicalReadRepository";'), false);
  assert.equal(source.includes('export * from "./draftRepository";'), false);
  assert.equal(source.includes('export * from "./draftStorage";'), false);
  assert.equal(source.includes('export * from "./remoteRepository";'), false);
  assert.equal(source.includes("loadHomepageCaseCardVMs"), true);
  assert.equal(source.includes("updateRemoteMyProfile"), true);
  assert.equal(source.includes("getCurrentDraft"), true);
  assert.equal(source.includes("saveCaseStatusSubmission"), true);
  assert.equal(source.includes("clearCaseBudgetAdjustments"), true);
  assert.equal(source.includes("clearCaseStatusSubmissions"), true);
});
