import type { ReactNode } from "react";
import { Image, Text, View } from "@tarojs/components";
import { AppIcon, type IconName, type IconVariant } from "../AppIcon";
import { cx } from "./classNames";
import "./ui.scss";

type SectionHeaderProps = {
  aside?: ReactNode;
  badge?: ReactNode;
  className?: string;
  description?: ReactNode;
  iconName?: IconName;
  iconSrc?: string;
  iconVariant?: IconVariant;
  title: ReactNode;
};

export function SectionHeader({
  aside,
  badge,
  className,
  description,
  iconName,
  iconSrc,
  iconVariant = "brand",
  title,
}: SectionHeaderProps) {
  const trailing =
    aside || (badge ? <Text className="ui-section-header__badge">{badge}</Text> : null);

  return (
    <View className={cx("ui-section-header", className)}>
      <View className="ui-section-header__main">
        <View className="ui-section-header__title-row">
          {iconName ? (
            <AppIcon
              className="ui-section-header__icon"
              name={iconName}
              size={16}
              variant={iconVariant}
            />
          ) : iconSrc ? (
            <Image className="ui-section-header__icon" mode="aspectFit" src={iconSrc} />
          ) : null}
          <Text className="ui-section-header__title">{title}</Text>
        </View>
        {description ? <Text className="ui-section-header__description">{description}</Text> : null}
      </View>
      {trailing ? <View className="ui-section-header__aside">{trailing}</View> : null}
    </View>
  );
}
