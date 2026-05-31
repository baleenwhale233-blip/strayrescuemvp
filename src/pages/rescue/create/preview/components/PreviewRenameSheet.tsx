import { Input, Text, View } from "@tarojs/components";
import { useState } from "react";
import { AppButton } from "../../../../../components/ui";
import { PreviewSheetFrame } from "./PreviewSheetFrame";

export function PreviewRenameSheet({
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
    <PreviewSheetFrame title="修改代号" onClose={onClose}>
      <View className="rescue-preview__sheet-field">
        <Text className="rescue-preview__sheet-label">小家伙的代号</Text>
        <View className="rescue-preview__sheet-input-card">
          <Input
            className="rescue-preview__sheet-input"
            maxlength={24}
            placeholder="如：车祸三花 / 纸箱里的橘猫"
            value={value}
            onInput={(event) => setValue(event.detail.value)}
          />
        </View>
      </View>

      <AppButton className="rescue-preview__sheet-button" onTap={() => onSave(value)}>
        保存代号
      </AppButton>
    </PreviewSheetFrame>
  );
}
