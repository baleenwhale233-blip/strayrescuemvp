export type OwnerFinishBarMode = "idle" | "confirming";

export type OwnerFinishBarEvent = "startFinish" | "cancelFinish";

export type OwnerFinishBarViewModel = {
  sideAction: "finish" | "cancel";
  sideLabel: string;
  primaryAction: "share" | "slider";
  primaryLabel: string;
  hint?: string;
};

export function reduceOwnerFinishBarMode(
  mode: OwnerFinishBarMode,
  event: OwnerFinishBarEvent,
): OwnerFinishBarMode {
  if (event === "startFinish") {
    return "confirming";
  }

  if (event === "cancelFinish") {
    return "idle";
  }

  return mode;
}

export function getOwnerFinishBarViewModel(mode: OwnerFinishBarMode): OwnerFinishBarViewModel {
  if (mode === "confirming") {
    return {
      sideAction: "cancel",
      sideLabel: "取消",
      primaryAction: "slider",
      primaryLabel: "右滑结束档案",
      hint: "确认这份档案已完成或已结案时，请滑动结束项目",
    };
  }

  return {
    sideAction: "finish",
    sideLabel: "结束",
    primaryAction: "share",
    primaryLabel: "分享档案",
  };
}
