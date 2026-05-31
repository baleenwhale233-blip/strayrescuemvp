import type { ReactNode } from "react";
import { Text, View } from "@tarojs/components";
import { cx } from "./classNames";
import { SurfaceCard } from "./SurfaceCard";
import "./ui.scss";

type ListEntryProps = {
  className?: string;
  interactive?: boolean;
  leading?: ReactNode;
  notice?: ReactNode;
  onTap?: () => void;
  subtitle?: ReactNode;
  title: ReactNode;
  trailing?: ReactNode;
};

export function ListEntry({
  className,
  interactive,
  leading,
  notice,
  onTap,
  subtitle,
  title,
  trailing,
}: ListEntryProps) {
  return (
    <SurfaceCard
      className={cx("ui-list-entry", className)}
      interactive={interactive ?? Boolean(onTap)}
      onTap={onTap}
    >
      <View className="ui-list-entry__main">
        {leading ? <View className="ui-list-entry__leading">{leading}</View> : null}
        <View className="ui-list-entry__content">
          <Text className="ui-list-entry__title">{title}</Text>
          {subtitle ? <Text className="ui-list-entry__subtitle">{subtitle}</Text> : null}
        </View>
        {trailing ? <View className="ui-list-entry__trailing">{trailing}</View> : null}
      </View>
      {notice ? <View className="ui-list-entry__notice">{notice}</View> : null}
    </SurfaceCard>
  );
}
