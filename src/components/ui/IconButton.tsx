import type { ReactNode } from "react";
import { View } from "@tarojs/components";
import { AppIcon, type IconName, type IconVariant } from "../AppIcon";
import { cx } from "./classNames";
import "./ui.scss";

type IconButtonProps = {
  children?: ReactNode;
  className?: string;
  iconName?: IconName;
  iconVariant?: IconVariant;
  label?: string;
  onTap?: () => void;
  size?: "sm" | "md" | "lg";
  variant?: "plain" | "soft" | "brand";
};

export function IconButton({
  children,
  className,
  iconName,
  iconVariant = "default",
  onTap,
  size = "md",
  variant = "plain",
}: IconButtonProps) {
  const iconSize = size === "sm" ? 16 : 24;

  return (
    <View
      className={cx(
        "ui-icon-button",
        `ui-icon-button--${size}`,
        `ui-icon-button--${variant}`,
        className,
      )}
      onTap={onTap}
    >
      {children ||
        (iconName ? <AppIcon name={iconName} size={iconSize} variant={iconVariant} /> : null)}
    </View>
  );
}
