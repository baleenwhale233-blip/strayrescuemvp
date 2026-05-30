import type { ReactNode } from "react";
import { View } from "@tarojs/components";
import { cx } from "./classNames";
import "./ui.scss";

type SurfaceCardProps = {
  active?: boolean;
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  onTap?: () => void;
  variant?: "default" | "subtle";
};

export function SurfaceCard({
  active,
  children,
  className,
  interactive,
  onTap,
  variant = "default",
}: SurfaceCardProps) {
  return (
    <View
      className={cx(
        "ui-surface-card",
        variant === "subtle" && "ui-surface-card--subtle",
        interactive && "ui-surface-card--interactive",
        active && "ui-surface-card--active",
        className,
      )}
      onTap={onTap}
    >
      {children}
    </View>
  );
}
