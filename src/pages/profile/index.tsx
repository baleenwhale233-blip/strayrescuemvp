import { View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useRef, useState } from "react";
import { NavBar } from "../../components/NavBar";
import { PageShell } from "../../components/ui";
import { createSubmissionGuard } from "../../utils/submissionGuard";
import supportHistoryIcon from "../../assets/profile/support-history.svg";
import contactSettingsIcon from "../../assets/profile/contact-settings.svg";
import guideBookIcon from "../../assets/profile/guide-book.svg";
import { loadMyProfile, updateRemoteMyProfile } from "../../domain/canonical/repository";
import { uploadProfileAssetImage } from "../../domain/canonical/repository/cloudbaseClient";
import { ProfileFooter } from "./components/ProfileFooter";
import { ProfileMenuList } from "./components/ProfileMenuList";
import { ProfileUserEditor } from "./components/ProfileUserEditor";
import type { ProfileMenuItem, ProfileUser } from "./types";
import "./index.scss";

const PROFILE_USER_KEY = "profile-user:v1";

const MENU_ITEMS: ProfileMenuItem[] = [
  {
    key: "support-history",
    label: "我的登记记录",
    icon: supportHistoryIcon,
  },
  {
    key: "contact-settings",
    label: "联系信息设置",
    icon: contactSettingsIcon,
  },
  {
    key: "guide",
    label: "使用说明",
    icon: guideBookIcon,
  },
];

function isTemporaryCloudAvatarUrl(avatarUrl: string) {
  if (!avatarUrl.startsWith("http://") && !avatarUrl.startsWith("https://")) {
    return false;
  }

  try {
    const parsed = new URL(avatarUrl);
    const isCloudAssetHost =
      parsed.hostname.endsWith("tcb.qcloud.la") || parsed.hostname.endsWith("tcb.qcloud.com");

    return isCloudAssetHost && (parsed.searchParams.has("sign") || parsed.searchParams.has("t"));
  } catch {
    return avatarUrl.includes("tcb.qcloud") && avatarUrl.includes("sign=");
  }
}

function sanitizeStoredAvatarUrl(avatarUrl: string) {
  return isTemporaryCloudAvatarUrl(avatarUrl) ? "" : avatarUrl;
}

function getStoredProfileUser() {
  const stored = Taro.getStorageSync(PROFILE_USER_KEY);
  if (!stored || typeof stored !== "object") {
    return undefined;
  }

  const candidate = stored as Partial<ProfileUser>;
  if (!candidate.nickName && !candidate.avatarUrl) {
    return undefined;
  }

  const sanitizedUser = {
    avatarUrl: sanitizeStoredAvatarUrl(candidate.avatarUrl || ""),
    nickName: candidate.nickName || "",
  };

  if (sanitizedUser.avatarUrl !== (candidate.avatarUrl || "")) {
    Taro.setStorageSync(PROFILE_USER_KEY, sanitizedUser);
  }

  return sanitizedUser;
}

function saveProfileUser(user: ProfileUser) {
  Taro.setStorageSync(PROFILE_USER_KEY, {
    ...user,
    avatarUrl: sanitizeStoredAvatarUrl(user.avatarUrl),
  });
}

function mergeProfileUser(base: ProfileUser, incoming?: Partial<ProfileUser>) {
  return {
    avatarUrl: incoming?.avatarUrl || base.avatarUrl || "",
    nickName: incoming?.nickName || base.nickName || "",
  };
}

function shouldUploadAvatar(avatarUrl: string) {
  return (
    Boolean(avatarUrl) && !avatarUrl.startsWith("https://") && !avatarUrl.startsWith("cloud://")
  );
}

export default function ProfilePage() {
  const [profileUser, setProfileUser] = useState<ProfileUser>({
    avatarUrl: "",
    nickName: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const menuNavigationLockRef = useRef(false);
  const submitGuardRef = useRef(createSubmissionGuard());

  useDidShow(() => {
    const localUser = getStoredProfileUser() || {
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

        const shouldBackfillAvatar =
          Boolean(localUser.avatarUrl) &&
          !profile.avatarUrl &&
          shouldUploadAvatar(localUser.avatarUrl);
        const shouldBackfillNickName = Boolean(localUser.nickName.trim()) && !profile.displayName;

        if (!shouldBackfillAvatar && !shouldBackfillNickName) {
          return;
        }

        void (async () => {
          try {
            let avatarFileID = "";

            if (shouldBackfillAvatar) {
              const uploaded = await uploadProfileAssetImage(localUser.avatarUrl, "avatar");
              avatarFileID = uploaded.isLocalFallback ? "" : uploaded.fileID;
            }

            const didSyncRemote = await updateRemoteMyProfile({
              displayName: shouldBackfillNickName ? localUser.nickName.trim() : undefined,
              avatarUrl:
                !shouldBackfillAvatar &&
                (localUser.avatarUrl.startsWith("https://") ||
                  localUser.avatarUrl.startsWith("cloud://"))
                  ? localUser.avatarUrl
                  : undefined,
              avatarFileID,
            });

            if (!didSyncRemote) {
              return;
            }

            const confirmedProfile = await loadMyProfile().catch(() => undefined);
            if (!confirmedProfile) {
              return;
            }

            const confirmedUser = mergeProfileUser(localUser, {
              avatarUrl: confirmedProfile.avatarUrl || "",
              nickName: confirmedProfile.displayName || "",
            });
            saveProfileUser(confirmedUser);
            setProfileUser(confirmedUser);
          } catch {
            // Keep local profile when backfill fails.
          }
        })();
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

  const handleSaveProfile = async () =>
    submitGuardRef.current.run(async () => {
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
        Taro.showLoading({ title: "保存中", mask: true });

        let avatarFileID = "";

        if (shouldUploadAvatar(nextAvatarUrl)) {
          const uploaded = await uploadProfileAssetImage(nextAvatarUrl, "avatar");
          avatarFileID = uploaded.isLocalFallback ? "" : uploaded.fileID;
        }

        const didSyncRemote = await updateRemoteMyProfile({
          displayName: nextNickName,
          avatarUrl:
            !avatarFileID &&
            (nextAvatarUrl.startsWith("https://") || nextAvatarUrl.startsWith("cloud://"))
              ? nextAvatarUrl
              : undefined,
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
    });

  const handleMenuTap = (key: ProfileMenuItem["key"]) => {
    if (menuNavigationLockRef.current) {
      return;
    }

    const urlMap: Record<ProfileMenuItem["key"], string> = {
      "support-history": "/pages/profile/support-history/index",
      "contact-settings": "/pages/profile/contact-settings/index",
      guide: "/pages/profile/guide/index",
    };
    const nextUrl = urlMap[key];

    if (!nextUrl) {
      return;
    }

    menuNavigationLockRef.current = true;

    void Taro.navigateTo({
      url: nextUrl,
    }).finally(() => {
      setTimeout(() => {
        menuNavigationLockRef.current = false;
      }, 300);
    });
  };

  return (
    <PageShell className="profile-page">
      <NavBar title="我的" />

      <View className="profile-page__body">
        <ProfileUserEditor
          saving={savingProfile}
          user={profileUser}
          onChooseAvatar={handleChooseAvatar}
          onNickNameChange={(nickName) =>
            setProfileUser((current) => {
              const nextUser = mergeProfileUser(current, { nickName });
              saveProfileUser(nextUser);
              return nextUser;
            })
          }
          onSave={handleSaveProfile}
        />

        <ProfileMenuList items={MENU_ITEMS} onItemTap={handleMenuTap} />
      </View>

      <ProfileFooter />
    </PageShell>
  );
}
