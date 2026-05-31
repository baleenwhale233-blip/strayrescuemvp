import type { ReactNode } from "react";
import { Image, Text, View } from "@tarojs/components";
import { AppIcon, type IconName, type IconVariant } from "../AppIcon";
import { cx } from "./classNames";
import "./ui.scss";

type AppButtonProps = {
  children: ReactNode;
  className?: string;
  iconName?: IconName;
  disabled?: boolean;
  iconSrc?: string;
  iconVariant?: IconVariant;
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
  iconName,
  iconSrc,
  iconVariant = "inverse",
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
      {iconName && !loading ? (
        <AppIcon className="ui-button__icon" name={iconName} size={16} variant={iconVariant} />
      ) : iconSrc && !loading ? (
        <Image className="ui-button__icon" mode="aspectFit" src={iconSrc} />
      ) : null}
    </View>
  );
}
