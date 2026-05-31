import { Text, View } from "@tarojs/components";
import { AppIcon, type IconName } from "../AppIcon";
import { cx } from "./classNames";
import "./ui.scss";

type EmptyStateProps = {
  className?: string;
  description?: string;
  iconName?: IconName;
  title: string;
};

export function EmptyState({
  className,
  description,
  iconName = "fileText",
  title,
}: EmptyStateProps) {
  return (
    <View className={cx("ui-empty-state", "ui-surface-card", className)}>
      <View className="ui-empty-state__icon">
        <AppIcon name={iconName} size={24} />
      </View>
      <Text className="ui-empty-state__title">{title}</Text>
      {description ? <Text className="ui-empty-state__description">{description}</Text> : null}
    </View>
  );
}
