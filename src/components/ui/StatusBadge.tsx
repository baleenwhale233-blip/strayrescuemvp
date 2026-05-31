import type { ReactNode } from "react";
import { Text, View } from "@tarojs/components";
import { cx } from "./classNames";
import "./ui.scss";

export type StatusBadgeTone =
  | "neutral"
  | "brand"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "draft";

type StatusBadgeProps = {
  children: ReactNode;
  className?: string;
  tone?: StatusBadgeTone;
};

export function StatusBadge({ children, className, tone = "neutral" }: StatusBadgeProps) {
  return (
    <View className={cx("ui-status-badge", `ui-status-badge--${tone}`, className)}>
      <Text>{children}</Text>
    </View>
  );
}
