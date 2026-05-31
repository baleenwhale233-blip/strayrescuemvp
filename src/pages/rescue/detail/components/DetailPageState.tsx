import { View } from "@tarojs/components";
import { NavBar } from "../../../../components/NavBar";
import { AppButton, EmptyState } from "../../../../components/ui";
import "./DetailPageState.scss";

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
        <EmptyState
          className="detail-state__empty"
          iconName={loading ? "sparkles" : "fileText"}
          title={title}
          description={description}
        />
        {actionText && onAction ? (
          <AppButton className="detail-state__action" size="md" onTap={onAction}>
            {actionText}
          </AppButton>
        ) : null}
      </View>
    </View>
  );
}
