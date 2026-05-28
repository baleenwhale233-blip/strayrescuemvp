import { Text, View } from "@tarojs/components";
import { AppIcon } from "../../../../components/AppIcon";
import { NavBar } from "../../../../components/NavBar";

export function DetailPageState({
  title,
  description,
  actionText,
  onAction,
  loading = false,
}: {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  loading?: boolean;
}) {
  return (
    <View className="detail-state">
      <NavBar showBack title="记录明细" />
      <View className="detail-state__content">
        <View className={`detail-state__icon ${loading ? "detail-state__icon--loading" : ""}`}>
          <AppIcon name={loading ? "sparkles" : "fileText"} size={24} />
        </View>
        <Text className="detail-state__title">{title}</Text>
        <Text className="detail-state__description">{description}</Text>
        {actionText && onAction ? (
          <View className="detail-state__action theme-button-primary" onTap={onAction}>
            <Text>{actionText}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
