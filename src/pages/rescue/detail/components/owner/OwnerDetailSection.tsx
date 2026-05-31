import { View } from "@tarojs/components";
import {
  RescueOwnerTimeline,
  type RescueReadonlyRecordDetail,
  type RescueOwnerTimelineItem,
} from "../../../../../components/rescue";

export function OwnerDetailSection({
  items,
  onReadonlyRecordTap,
}: {
  items: RescueOwnerTimelineItem[];
  onReadonlyRecordTap: (item: RescueReadonlyRecordDetail) => void;
}) {
  return (
    <View className="owner-tab-content owner-tab-content--timeline">
      <RescueOwnerTimeline items={items} onReadonlyRecordTap={onReadonlyRecordTap} />
    </View>
  );
}
