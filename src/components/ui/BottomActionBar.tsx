import type { ReactNode } from "react";
import { View } from "@tarojs/components";
import { cx } from "./classNames";
import "./ui.scss";

type BottomActionBarProps = {
  children: ReactNode;
  className?: string;
};

export function BottomActionBar({ children, className }: BottomActionBarProps) {
  return (
    <View className={cx("ui-bottom-action-bar", className)}>
      <View className="ui-bottom-action-bar__inner">{children}</View>
    </View>
  );
}
