import { Button, Image, Input, Text, View } from "@tarojs/components";
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
import { uploadProfileAssetImage } from "../../domain/canonical/repository/cloudbaseClient";
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

function mergeProfileUser(
  base: ProfileUser,
  incoming?: Partial<ProfileUser>,
) {
  return {
    avatarUrl: incoming?.avatarUrl || base.avatarUrl || "",
    nickName: incoming?.nickName || base.nickName || "",
  };
}

export default function ProfilePage() {
  const [profileUser, setProfileUser] = useState<ProfileUser>({
    avatarUrl: "",
    nickName: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  useDidShow(() => {
    const localUser =
      getStoredProfileUser() || {
        avatarUrl: "",
        nickName: "",
      };
    setProfileUser(localUser);
    loadMyProfile()
      .then((profile) => {
        if (!profile?.displayName && !profile?.avatarUrl) {
          return;
        }

        const nextUser = mergeProfileUser(localUser, {
          avatarUrl: profile.avatarUrl || "",
          nickName: profile.displayName || "",
        });
        saveProfileUser(nextUser);
        setProfileUser(nextUser);
      })
      .catch(() => {
        // Keep local profile as a fallback.
      });
  });

  const handleChooseAvatar = (event: { detail?: { avatarUrl?: string } }) => {
    const avatarUrl = event.detail?.avatarUrl || "";

    if (!avatarUrl) {
      return;
    }

    setProfileUser((current) => {
      const nextUser = mergeProfileUser(current, { avatarUrl });
      saveProfileUser(nextUser);
      return nextUser;
    });
  };

  const handleSaveProfile = async () => {
    const nextNickName = profileUser.nickName.trim();
    const nextAvatarUrl = profileUser.avatarUrl.trim();

    if (!nextNickName && !nextAvatarUrl) {
      Taro.showToast({
        title: "请先填写昵称或选择头像",
        icon: "none",
      });
      return;
    }

    try {
      setSavingProfile(true);
      Taro.showLoading({ title: "保存中" });

      let avatarFileID = "";

      if (
        nextAvatarUrl &&
        !nextAvatarUrl.startsWith("http://") &&
        !nextAvatarUrl.startsWith("https://") &&
        !nextAvatarUrl.startsWith("cloud://")
      ) {
        const uploaded = await uploadProfileAssetImage(nextAvatarUrl, "avatar");
        avatarFileID = uploaded.isLocalFallback ? "" : uploaded.fileID;
      }

      const didSyncRemote = await updateRemoteMyProfile({
        displayName: nextNickName,
        avatarFileID,
      });

      if (!didSyncRemote) {
        saveProfileUser({
          avatarUrl: nextAvatarUrl,
          nickName: nextNickName,
        });
        Taro.hideLoading();
        Taro.showToast({
          title: "已保存在本机，稍后会再同步",
          icon: "none",
        });
        return;
      }

      const confirmedProfile = await loadMyProfile().catch(() => undefined);
      const nextUser = mergeProfileUser(
        {
          avatarUrl: nextAvatarUrl,
          nickName: nextNickName,
        },
        {
          avatarUrl: confirmedProfile?.avatarUrl || "",
          nickName: confirmedProfile?.displayName || "",
        },
      );

      saveProfileUser(nextUser);
      setProfileUser(nextUser);
      Taro.hideLoading();
      Taro.showToast({
        title: "头像昵称已保存",
        icon: "none",
      });
    } catch (error) {
      Taro.hideLoading();
      Taro.showToast({
        title:
          error instanceof Error && error.message === "PROFILE_ASSET_UPLOAD_FAILED"
            ? "头像上传失败，请重试"
            : "头像昵称保存失败",
        icon: "none",
      });
    } finally {
      setSavingProfile(false);
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
        <View className="profile-page__user">
          <Button
            className="profile-page__avatar-button"
            openType="chooseAvatar"
            onChooseAvatar={handleChooseAvatar}
          >
            <View className="profile-page__avatar-wrap">
              {profileUser.avatarUrl ? (
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
          </Button>
          <Input
            className="profile-page__name-input"
            type="nickname"
            maxlength={24}
            placeholder="填写你的昵称"
            placeholderStyle="color:#98A2B3;"
            value={profileUser.nickName}
            onInput={(event) =>
              setProfileUser((current) => {
                const nextUser = mergeProfileUser(current, {
                  nickName: event.detail.value,
                });
                saveProfileUser(nextUser);
                return nextUser;
              })
            }
          />
          <View
            className={`theme-button-primary profile-page__save-button ${
              savingProfile ? "profile-page__save-button--disabled" : ""
            }`}
            onTap={handleSaveProfile}
          >
            <Text>{savingProfile ? "保存中" : "保存头像昵称"}</Text>
          </View>
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
