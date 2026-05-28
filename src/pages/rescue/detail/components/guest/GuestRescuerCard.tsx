import { Image, Text, View } from "@tarojs/components";
import type { PublicDetailVM } from "../../../../../domain/canonical/types";
import { getRescuerAvatar } from "../../detailViewModels";

export function GuestRescuerCard({
  detail,
  onOpenHomepage,
}: {
  detail: PublicDetailVM;
  onOpenHomepage: () => void;
}) {
  return (
    <View className="rescuer-card theme-card">
      <Image className="rescuer-card__avatar" mode="aspectFill" src={getRescuerAvatar(detail)} />
      <View className="rescuer-card__body">
        <Text className="rescuer-card__name">{detail.rescuer.name}</Text>
        <Text className="rescuer-card__meta">
          已建立 {detail.rescuer.stats.publishedCaseCount} 份记录档案 ·{" "}
          {detail.rescuer.stats.verifiedReceiptCount} 张真实凭证
        </Text>
      </View>
      {detail.rescuer.profileEntryEnabled ? (
        <View className="rescuer-card__link" onTap={onOpenHomepage}>
          <Text>查看主页</Text>
        </View>
      ) : null}
    </View>
  );
}
