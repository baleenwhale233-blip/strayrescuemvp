import assert from "node:assert/strict";
import test from "node:test";
import { createSubmissionGuard } from "../../../utils/submissionGuard";

test("submission guard blocks concurrent runs until the active run finishes", async () => {
  const guard = createSubmissionGuard();
  let releaseFirstRun: (() => void) | undefined;
  const calls: string[] = [];

  const firstRun = guard.run(
    () =>
      new Promise<string>((resolve) => {
        calls.push("first");
        releaseFirstRun = () => resolve("first-result");
      }),
  );
  const secondRun = guard.run(async () => {
    calls.push("second");
    return "second-result";
  });

  assert.equal(await secondRun, undefined);
  assert.deepEqual(calls, ["first"]);

  releaseFirstRun?.();
  assert.equal(await firstRun, "first-result");

  assert.equal(
    await guard.run(async () => {
      calls.push("third");
      return "third-result";
    }),
    "third-result",
  );
  assert.deepEqual(calls, ["first", "third"]);
});
