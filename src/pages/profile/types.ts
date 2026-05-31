export type ProfileUser = {
  avatarUrl: string;
  nickName: string;
};

export type ProfileMenuItem = {
  key: "support-history" | "contact-settings" | "guide";
  label: string;
  icon: string;
};
