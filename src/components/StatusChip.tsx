import { View, Text } from "@tarojs/components";

type Tone = "urgent" | "active" | "progress" | "done" | "draft";

type StatusChipProps = {
  label: string;
  tone: Tone;
};

export function StatusChip({ label, tone }: StatusChipProps) {
  return (
    <View className={`status-chip tone-${tone}`}>
      <Text>{label}</Text>
    </View>
  );
}
