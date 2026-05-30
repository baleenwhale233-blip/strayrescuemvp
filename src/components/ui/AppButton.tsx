import type { ReactNode } from "react";
import { Text, View } from "@tarojs/components";
import { cx } from "./classNames";
import "./ui.scss";

type AppButtonProps = {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  onTap?: () => void;
  size?: "md" | "lg";
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export function AppButton({
  children,
  className,
  disabled = false,
  loading = false,
  loadingText = "处理中",
  onTap,
  size = "lg",
  variant = "primary",
}: AppButtonProps) {
  const locked = disabled || loading;

  return (
    <View
      className={cx(
        "ui-button",
        `ui-button--${variant}`,
        `ui-button--${size}`,
        locked && "ui-button--disabled",
        className,
      )}
      onTap={locked ? undefined : onTap}
    >
      <Text>{loading ? loadingText : children}</Text>
    </View>
  );
}
