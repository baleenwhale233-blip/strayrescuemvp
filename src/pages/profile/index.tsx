import { View, Text } from "@tarojs/components";
import { NavBar } from "../../components/NavBar";

export default function ProfilePage() {
  return (
    <View className="page-shell">
      <NavBar title="我的" />

      <View className="theme-card" style={{ padding: "24px" }}>
        <Text className="theme-text-section-title">页面占位</Text>
        <Text className="theme-text-body-secondary" style={{ display: "block", marginTop: "12px" }}>
          后续这里可以接入我的救助记录、我的支持足迹和平台规则。
        </Text>
      </View>
    </View>
  );
}
