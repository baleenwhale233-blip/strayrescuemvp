import { Button, Image, Text, View } from "@tarojs/components";
import shareMutedIcon from "../../../../../assets/rescue-detail/share-muted-18.svg";

export function GuestActionBar({
  onClaim,
  onSupport,
}: {
  onClaim: () => void;
  onSupport: () => void;
}) {
  return (
    <View className="guest-bottom-bar">
      <View className="guest-bottom-bar__inner">
        <Button className="guest-bottom-bar__share" openType="share">
          <Image
            className="guest-bottom-bar__share-icon-image"
            mode="aspectFit"
            src={shareMutedIcon}
          />
          <Text className="guest-bottom-bar__share-text">分享</Text>
        </Button>
        <Button className="guest-bottom-bar__ghost" onTap={onClaim}>
          <Text>登记一笔</Text>
        </Button>
        <Button className="guest-bottom-bar__cta theme-button-primary" onTap={onSupport}>
          <Text>查看联系方式</Text>
        </Button>
      </View>
    </View>
  );
}
