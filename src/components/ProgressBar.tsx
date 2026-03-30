import { View, Text } from "@tarojs/components";

type Segment = {
  key: string;
  label: string;
  value: number;
  color: string;
};

type ProgressBarProps = {
  segments: Segment[];
  large?: boolean;
};

export function ProgressBar({ segments, large = false }: ProgressBarProps) {
  return (
    <View>
      <View className={`progress ${large ? "progress--lg" : ""}`}>
        {segments.map((segment) => (
          <View
            key={segment.key}
            className="progress__segment"
            style={{
              width: `${segment.value}%`,
              background: segment.color,
            }}
          />
        ))}
      </View>
      <View className="progress__legend">
        {segments.map((segment) => (
          <View key={segment.key} className="progress__legend-item">
            <View
              className="progress__legend-dot"
              style={{ background: segment.color }}
            />
            <Text>{segment.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
