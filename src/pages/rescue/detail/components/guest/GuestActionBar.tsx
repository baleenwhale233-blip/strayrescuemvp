import { Button, Image, Text } from "@tarojs/components";
import { AppButton, BottomActionBar } from "../../../../../components/ui";
import shareMutedIcon from "../../../../../assets/rescue-detail/share-muted-18.svg";

export function GuestActionBar({
  onClaim,
  onSupport,
}: {
  onClaim: () => void;
  onSupport: () => void;
}) {
  return (
    <BottomActionBar className="guest-bottom-bar">
      <Button className="guest-bottom-bar__share" openType="share">
        <Image
          className="guest-bottom-bar__share-icon-image"
          mode="aspectFit"
          src={shareMutedIcon}
        />
        <Text className="guest-bottom-bar__share-text">分享</Text>
      </Button>
      <AppButton className="guest-bottom-bar__ghost" onTap={onClaim} variant="ghost">
        登记一笔
      </AppButton>
      <AppButton className="guest-bottom-bar__cta" onTap={onSupport}>
        查看联系方式
      </AppButton>
    </BottomActionBar>
  );
}
