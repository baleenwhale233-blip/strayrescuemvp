import type { ReactNode } from "react";
import { Image, Text, View } from "@tarojs/components";
import { cx } from "./classNames";
import "./ui.scss";

type SectionHeaderProps = {
  aside?: ReactNode;
  badge?: ReactNode;
  className?: string;
  description?: ReactNode;
  iconSrc?: string;
  title: ReactNode;
};

export function SectionHeader({
  aside,
  badge,
  className,
  description,
  iconSrc,
  title,
}: SectionHeaderProps) {
  const trailing =
    aside || (badge ? <Text className="ui-section-header__badge">{badge}</Text> : null);

  return (
    <View className={cx("ui-section-header", className)}>
      <View className="ui-section-header__main">
        <View className="ui-section-header__title-row">
          {iconSrc ? (
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
