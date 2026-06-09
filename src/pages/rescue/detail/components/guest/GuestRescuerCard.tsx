import { Text, View } from "@tarojs/components";
import { Avatar, SurfaceCard } from "../../../../../components/ui";
import type { PublicDetailVM } from "../../../../../domain/canonical/types";
import { getRescuerAvatar } from "../../detailViewModels";
import "./GuestRescuerCard.scss";

export function GuestRescuerCard({
  detail,
  onOpenHomepage,
}: {
  detail: PublicDetailVM;
  onOpenHomepage: () => void;
}) {
  return (
    <SurfaceCard className="rescuer-card">
      <Avatar className="rescuer-card__avatar" src={getRescuerAvatar(detail)} variant="raised" />
      <View className="rescuer-card__body">
        <Text className="rescuer-card__name">{detail.rescuer.name}</Text>
        <Text className="rescuer-card__meta">
          已建立 {detail.rescuer.stats.publishedCaseCount} 份记录档案 ·{" "}
          {detail.rescuer.stats.verifiedReceiptCount} 张已上传凭证
        </Text>
      </View>
      {detail.rescuer.profileEntryEnabled ? (
        <View className="rescuer-card__link" onTap={onOpenHomepage}>
          <Text>查看主页</Text>
        </View>
      ) : null}
    </SurfaceCard>
  );
}
