import type { ReactNode } from "react";
import { Image, Text, View } from "@tarojs/components";
import { cx } from "./classNames";
import "./ui.scss";

type AppButtonProps = {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  iconSrc?: string;
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
  iconSrc,
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
      {loading || typeof children === "string" || typeof children === "number" ? (
        <Text>{loading ? loadingText : children}</Text>
      ) : (
        children
      )}
      {iconSrc && !loading ? (
        <Image className="ui-button__icon" mode="aspectFit" src={iconSrc} />
      ) : null}
    </View>
  );
}
