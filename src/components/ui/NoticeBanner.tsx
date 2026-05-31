import type { ReactNode } from "react";
import { Image, Text, View } from "@tarojs/components";
import { cx } from "./classNames";
import "./ui.scss";

type NoticeBannerProps = {
  children: ReactNode;
  className?: string;
  iconSrc?: string;
};

export function NoticeBanner({ children, className, iconSrc }: NoticeBannerProps) {
  return (
    <View className={cx("ui-notice-banner", className)}>
      {iconSrc ? <Image className="ui-notice-banner__icon" mode="aspectFit" src={iconSrc} /> : null}
      <Text className="ui-notice-banner__copy">{children}</Text>
    </View>
  );
}
