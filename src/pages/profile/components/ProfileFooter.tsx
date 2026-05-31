import { Text, View } from "@tarojs/components";
import "./ProfileFooter.scss";

export function ProfileFooter() {
  return (
    <View className="profile-page__footer">
      <Text className="profile-page__powered">Powered by</Text>
      <Text className="profile-page__brand">God/1000 Lab · Druid Project</Text>
    </View>
  );
}
