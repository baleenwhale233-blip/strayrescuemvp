import { View } from "@tarojs/components";
import { cx } from "./classNames";
import "./ui.scss";

type StepIndicatorProps = {
  activeIndex: number;
  className?: string;
  total: number;
};

export function StepIndicator({ activeIndex, className, total }: StepIndicatorProps) {
  return (
    <View className={cx("ui-step-indicator", className)}>
      {Array.from({ length: total }, (_, index) => (
        <View
          key={index}
          className={cx(
            "ui-step-indicator__item",
            index === activeIndex && "ui-step-indicator__item--active",
          )}
        />
      ))}
    </View>
  );
}
