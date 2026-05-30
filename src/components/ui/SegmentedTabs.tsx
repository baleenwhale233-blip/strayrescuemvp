import { Text, View } from "@tarojs/components";
import { cx } from "./classNames";
import "./ui.scss";

export type SegmentedTabItem = {
  badge?: string;
  label: string;
  value: string;
};

type SegmentedTabsProps = {
  className?: string;
  items: SegmentedTabItem[];
  onChange: (value: string) => void;
  value: string;
};

export function SegmentedTabs({ className, items, onChange, value }: SegmentedTabsProps) {
  return (
    <View className={cx("ui-segmented-tabs", className)}>
      {items.map((item) => {
        const active = item.value === value;

        return (
          <View
            key={item.value}
            className={cx("ui-segmented-tabs__item", active && "ui-segmented-tabs__item--active")}
            onTap={() => onChange(item.value)}
          >
            <Text>{item.label}</Text>
            {item.badge ? <Text className="ui-segmented-tabs__badge">{item.badge}</Text> : null}
          </View>
        );
      })}
    </View>
  );
}
