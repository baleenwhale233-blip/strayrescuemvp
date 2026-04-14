export default defineAppConfig({
  pages: [
    "pages/discover/index",
    "pages/rescue/index",
    "pages/rescue/create/basic/index",
    "pages/rescue/create/budget/index",
    "pages/rescue/create/preview/index",
    "pages/rescue/detail/index",
    "pages/support/claim/index",
    "pages/support/review/index",
    "pages/profile/index",
  ],
  window: {
    navigationStyle: "custom",
    backgroundColor: "#F5F4F3",
    backgroundTextStyle: "dark",
  },
  tabBar: {
    color: "#98A2B3",
    selectedColor: "#F76808",
    backgroundColor: "#FFFFFF",
    borderStyle: "white",
    list: [
      {
        pagePath: "pages/discover/index",
        text: "发现",
        iconPath: "assets/tabbar/discover.png",
        selectedIconPath: "assets/tabbar/discover-active.png",
      },
      {
        pagePath: "pages/rescue/index",
        text: "救助",
        iconPath: "assets/tabbar/rescue.png",
        selectedIconPath: "assets/tabbar/rescue-active.png",
      },
      {
        pagePath: "pages/profile/index",
        text: "我的",
        iconPath: "assets/tabbar/profile.png",
        selectedIconPath: "assets/tabbar/profile-active.png",
      },
    ],
  },
});
