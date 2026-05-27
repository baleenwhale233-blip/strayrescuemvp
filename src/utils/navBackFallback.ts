export const DISCOVER_TAB_PATH = "/pages/discover/index";

export type NavBackAction =
  | {
      type: "navigateBack";
    }
  | {
      type: "switchTab";
      url: string;
    };

export function getNavBackAction(pageStackLength: number): NavBackAction {
  if (pageStackLength > 1) {
    return {
      type: "navigateBack",
    };
  }

  return {
    type: "switchTab",
    url: DISCOVER_TAB_PATH,
  };
}
