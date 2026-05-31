import { Text, View } from "@tarojs/components";
import type { ReactNode } from "react";
import "./PreviewSheetFrame.scss";

export function PreviewSheetFrame({
  children,
  title,
  onClose,
}: {
  children: ReactNode;
  title: string;
  onClose: () => void;
}) {
  return (
    <View className="rescue-preview__sheet-overlay" onTap={onClose}>
      <View className="rescue-preview__sheet" onTap={(event) => event.stopPropagation()}>
        <View className="rescue-preview__sheet-handle">
          <View className="rescue-preview__sheet-handle-bar" />
        </View>

        <Text className="rescue-preview__sheet-title">{title}</Text>

        {children}
      </View>
    </View>
  );
}
