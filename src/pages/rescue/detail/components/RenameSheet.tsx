import { Input, Text, View } from "@tarojs/components";
import { useState } from "react";

export function RenameSheet({
  initialValue,
  onClose,
  onSave,
}: {
  initialValue: string;
  onClose: () => void;
  onSave: (value: string) => void;
}) {
  const [value, setValue] = useState(initialValue);

  return (
    <View className="detail-rename-sheet__overlay" onTap={onClose}>
      <View className="detail-rename-sheet" onTap={(event) => event.stopPropagation()}>
        <View className="detail-rename-sheet__handle">
          <View className="detail-rename-sheet__handle-bar" />
        </View>

        <Text className="detail-rename-sheet__title">修改代号</Text>

        <View className="detail-rename-sheet__field">
          <Text className="detail-rename-sheet__label">小家伙的代号</Text>
          <View className="detail-rename-sheet__input-card">
            <Input
              className="detail-rename-sheet__input"
              maxlength={24}
              placeholder="如：车祸三花 / 纸箱里的橘猫"
              value={value}
              onInput={(event) => setValue(event.detail.value)}
            />
          </View>
        </View>

        <View
          className="theme-button-primary detail-rename-sheet__button"
          onTap={() => onSave(value)}
        >
          <Text>保存代号</Text>
        </View>
      </View>
    </View>
  );
}
