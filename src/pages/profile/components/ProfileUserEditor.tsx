import { Button, Input, View } from "@tarojs/components";
import { AppButton, Avatar, SurfaceCard } from "../../../components/ui";
import type { ProfileUser } from "../types";
import "./ProfileUserEditor.scss";

export function ProfileUserEditor({
  saving,
  user,
  onChooseAvatar,
  onNickNameChange,
  onSave,
}: {
  saving: boolean;
  user: ProfileUser;
  onChooseAvatar: (event: { detail?: { avatarUrl?: string } }) => void;
  onNickNameChange: (nickName: string) => void;
  onSave: () => void;
}) {
  return (
    <View className="profile-page__user">
      <Button
        className="profile-page__avatar-button"
        openType="chooseAvatar"
        onChooseAvatar={onChooseAvatar}
      >
        <Avatar className="profile-page__avatar" size="lg" src={user.avatarUrl} variant="framed" />
      </Button>
      <SurfaceCard className="profile-page__name-card">
        <Input
          className="profile-page__name-input"
          type="nickname"
          maxlength={24}
          placeholder="填写你的昵称"
          placeholderStyle="color:var(--color-text-tertiary);"
          value={user.nickName}
          onInput={(event) => onNickNameChange(event.detail.value)}
        />
      </SurfaceCard>
      <AppButton
        className="profile-page__save-button"
        loading={saving}
        loadingText="保存中"
        onTap={onSave}
      >
        保存头像昵称
      </AppButton>
    </View>
  );
}
