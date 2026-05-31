import type { ReactNode } from "react";
import { Image, Text, View } from "@tarojs/components";
import { AppIcon, type IconName, type IconVariant } from "../AppIcon";
import { cx } from "./classNames";
import "./ui.scss";

type NoticeBannerProps = {
  children: ReactNode;
  className?: string;
  iconName?: IconName;
  iconSrc?: string;
  iconVariant?: IconVariant;
};

export function NoticeBanner({
  children,
  className,
  iconName,
  iconSrc,
  iconVariant = "brand",
}: NoticeBannerProps) {
  return (
    <View className={cx("ui-notice-banner", className)}>
      {iconName ? (
        <AppIcon
          className="ui-notice-banner__icon"
          name={iconName}
          size={16}
          variant={iconVariant}
        />
      ) : iconSrc ? (
        <Image className="ui-notice-banner__icon" mode="aspectFit" src={iconSrc} />
      ) : null}
      <Text className="ui-notice-banner__copy">{children}</Text>
    </View>
  );
}
