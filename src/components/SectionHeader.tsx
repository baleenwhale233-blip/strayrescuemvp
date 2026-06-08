import { View, Text } from "@tarojs/components";

type SectionHeaderProps = {
  title: string;
  badge?: string;
};

export function SectionHeader({ title, badge }: SectionHeaderProps) {
  return (
    <View className="section-header">
      <Text className="section-header__title">{title}</Text>
      {badge ? <Text className="section-header__badge">{badge}</Text> : null}
    </View>
  );
}
