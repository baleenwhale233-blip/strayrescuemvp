import { View } from "@tarojs/components";
import {
  RescueOwnerOverview,
  type RescueOwnerOverviewProps,
} from "../../../../../components/rescue";

export function OwnerOverviewSection({ overview }: { overview: RescueOwnerOverviewProps }) {
  return (
    <View className="owner-tab-content">
      <RescueOwnerOverview {...overview} />
    </View>
  );
}
