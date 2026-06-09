import { Text, View } from "@tarojs/components";
import { AppIcon } from "../../../components/AppIcon";
import { AppButton } from "../../../components/ui";
import "./WorkbenchCreateAction.scss";

export function WorkbenchCreateAction({ onTap }: { onTap: () => void }) {
  return (
    <AppButton className="rescue-page__primary-action" onTap={onTap}>
      <View className="rescue-page__primary-action-icon">
        <AppIcon name="plusCircle" size={24} variant="inverse" />
      </View>
      <Text>新建档案</Text>
    </AppButton>
  );
}
