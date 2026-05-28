import { Text, View } from "@tarojs/components";
import type { DetailTab } from "../../types";

export function GuestTabs({
  activeTab,
  onChange,
}: {
  activeTab: DetailTab;
  onChange: (tab: DetailTab) => void;
}) {
  return (
    <View className="detail-tabs">
      <View
        className={`detail-tabs__item ${
          activeTab === "overview" ? "detail-tabs__item--active" : ""
        }`}
        onTap={() => onChange("overview")}
      >
        <Text>记录摘要</Text>
      </View>
      <View
        className={`detail-tabs__item ${activeTab === "detail" ? "detail-tabs__item--active" : ""}`}
        onTap={() => onChange("detail")}
      >
        <Text>记录详情</Text>
      </View>
    </View>
  );
}
