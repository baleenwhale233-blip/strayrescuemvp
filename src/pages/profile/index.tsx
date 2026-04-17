import { Image, Text, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useState } from "react";
import { NavBar } from "../../components/NavBar";
import supportHistoryIcon from "../../assets/profile/support-history.svg";
import contactSettingsIcon from "../../assets/profile/contact-settings.svg";
import guideBookIcon from "../../assets/profile/guide-book.svg";
import chevronIcon from "../../assets/rescue-detail/owner/action-chevron.svg";
import {
  loadMyProfile,
  updateRemoteMyProfile,
} from "../../domain/canonical/repository";
import "./index.scss";

type ProfileUser = {
  avatarUrl: string;
  nickName: string;
};

const PROFILE_USER_KEY = "profile-user:v1";

const MENU_ITEMS = [
  {
    key: "support-history",
    label: "我的支持足迹",
    icon: supportHistoryIcon,
  },
  {
    key: "contact-settings",
    label: "救助联系方式设置",
    icon: contactSettingsIcon,
  },
  {
    key: "guide",
    label: "救助账本使用说明",
    icon: guideBookIcon,
  },
] as const;

function getStoredProfileUser() {
  const stored = Taro.getStorageSync(PROFILE_USER_KEY);
  if (!stored || typeof stored !== "object") {
    return undefined;
  }

  const candidate = stored as Partial<ProfileUser>;
  if (!candidate.nickName && !candidate.avatarUrl) {
    return undefined;
  }

  return {
    avatarUrl: candidate.avatarUrl || "",
    nickName: candidate.nickName || "",
  };
}

function saveProfileUser(user: ProfileUser) {
  Taro.setStorageSync(PROFILE_USER_KEY, user);
}

export default function ProfilePage() {
  const [profileUser, setProfileUser] = useState<ProfileUser | undefined>();

  useDidShow(() => {
    setProfileUser(getStoredProfileUser());
    loadMyProfile()
      .then((profile) => {
        if (!profile?.displayName && !profile?.avatarUrl) {
          return;
        }

        const nextUser = {
          avatarUrl: profile.avatarUrl || "",
          nickName: profile.displayName || "",
        };
        saveProfileUser(nextUser);
        setProfileUser(nextUser);
      })
      .catch(() => {
        // Keep local profile as a fallback.
      });
  });

  const handleLogin = async () => {
    const getUserProfile = Taro.getUserProfile as
      | undefined
      | ((options: { desc: string }) => Promise<{ userInfo?: Partial<ProfileUser> }>);

    if (!getUserProfile) {
      Taro.showToast({
        title: "当前环境暂不支持微信资料授权",
        icon: "none",
      });
      return;
    }

    try {
      const result = await getUserProfile({
        desc: "用于在救猫咪中展示头像和昵称",
      });
      const userInfo = result.userInfo || {};
      const nextUser = {
        avatarUrl: userInfo.avatarUrl || "",
        nickName: userInfo.nickName || "微信用户",
      };

      saveProfileUser(nextUser);
      setProfileUser(nextUser);
      updateRemoteMyProfile({
        displayName: nextUser.nickName,
        avatarUrl: nextUser.avatarUrl,
      }).catch(() => {
        // Local profile remains usable when remote sync is unavailable.
      });
    } catch {
      Taro.showToast({
        title: "未获取微信资料",
        icon: "none",
      });
    }
  };

  const handleMenuTap = (key: (typeof MENU_ITEMS)[number]["key"]) => {
    if (key === "support-history") {
      Taro.navigateTo({
        url: "/pages/profile/support-history/index",
      });
      return;
    }

    if (key === "contact-settings") {
      Taro.navigateTo({
        url: "/pages/profile/contact-settings/index",
      });
      return;
    }

    if (key === "guide") {
      Taro.navigateTo({
        url: "/pages/profile/guide/index",
      });
    }
  };

  return (
    <View className="page-shell profile-page">
      <NavBar title="救猫咪" />

      <View className="profile-page__body">
        <View className="profile-page__user" onTap={handleLogin}>
          <View className="profile-page__avatar-wrap">
            {profileUser?.avatarUrl ? (
              <Image
                className="profile-page__avatar"
                mode="aspectFill"
                src={profileUser.avatarUrl}
              />
            ) : (
              <View className="profile-page__avatar-placeholder">
                <View className="profile-page__avatar-head" />
                <View className="profile-page__avatar-body" />
              </View>
            )}
          </View>
          <Text className="profile-page__name">
            {profileUser?.nickName || "点击登录"}
          </Text>
        </View>

        <View className="profile-page__menu">
          {MENU_ITEMS.map((item) => (
            <View
              key={item.key}
              className="profile-page__menu-item"
              onTap={() => handleMenuTap(item.key)}
            >
              <View className="profile-page__menu-main">
                <View className="profile-page__menu-icon-wrap">
                  <Image
                    className="profile-page__menu-icon"
                    mode="aspectFit"
                    src={item.icon}
                  />
                </View>
                <Text className="profile-page__menu-label">{item.label}</Text>
              </View>
              <Image
                className="profile-page__chevron"
                mode="aspectFit"
                src={chevronIcon}
              />
            </View>
          ))}
        </View>
      </View>

      <View className="profile-page__footer">
        <Text className="profile-page__powered">Powered by</Text>
        <Text className="profile-page__brand">God/1000 Lab · Druid Project</Text>
      </View>
    </View>
  );
}
