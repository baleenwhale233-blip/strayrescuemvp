import assert from "node:assert/strict";
import test from "node:test";
import {
  getOwnerFinishBarViewModel,
  reduceOwnerFinishBarMode,
} from "../../../utils/ownerFinishBarState";

test("owner finish bar starts with a lightweight share-first action", () => {
  assert.deepEqual(getOwnerFinishBarViewModel("idle"), {
    sideAction: "finish",
    sideLabel: "结束",
    primaryAction: "share",
    primaryLabel: "分享档案",
  });
});

test("owner finish bar only shows the destructive slider after choosing finish", () => {
  assert.equal(reduceOwnerFinishBarMode("idle", "startFinish"), "confirming");
  assert.deepEqual(getOwnerFinishBarViewModel("confirming"), {
    sideAction: "cancel",
    sideLabel: "取消",
    primaryAction: "slider",
    primaryLabel: "右滑结束记录",
    hint: "确认这条记录已完成或已结案时，请滑动结束项目",
  });
  assert.equal(reduceOwnerFinishBarMode("confirming", "cancelFinish"), "idle");
});
