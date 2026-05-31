import { View } from "@tarojs/components";
import { cx } from "./classNames";
import { getProgressWidth } from "./progressBarUtils";
import "./ui.scss";

type ProgressBarProps = {
  className?: string;
  secondaryValue?: number;
  value: number;
};

export function ProgressBar({ className, secondaryValue = 0, value }: ProgressBarProps) {
  return (
    <View className={cx("ui-progress-bar", className)}>
      {secondaryValue > 0 ? (
        <View
          className="ui-progress-bar__secondary"
          style={{ width: getProgressWidth(secondaryValue) }}
        />
      ) : null}
      <View className="ui-progress-bar__value" style={{ width: getProgressWidth(value) }} />
    </View>
  );
}
