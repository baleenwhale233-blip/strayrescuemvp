import { View } from "@tarojs/components";
import {
  RescueOwnerTimeline,
  type RescueOwnerTimelineItem,
} from "../../../../../components/RescueOwnerShared";

export function OwnerDetailSection({ items }: { items: RescueOwnerTimelineItem[] }) {
  return (
    <View className="owner-tab-content owner-tab-content--timeline">
      <RescueOwnerTimeline items={items} />
    </View>
  );
}
