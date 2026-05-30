import { Image, ScrollView, Text, View } from "@tarojs/components";
import { cx } from "./classNames";
import "./ui.scss";

type UploadStripProps = {
  addLabel?: string;
  className?: string;
  images: string[];
  onAdd: () => void;
  onRemove?: (index: number) => void;
};

export function UploadStrip({
  addLabel = "添加图片",
  className,
  images,
  onAdd,
  onRemove,
}: UploadStripProps) {
  return (
    <View className={cx("ui-upload-strip", className)}>
      <ScrollView className="ui-upload-strip__scroll" scrollX showScrollbar={false}>
        <View className="ui-upload-strip__content">
          <View className="ui-upload-strip__add" onTap={onAdd}>
            <Text className="ui-upload-strip__add-copy">{addLabel}</Text>
          </View>
          {images.map((src, index) => (
            <View key={`${src}-${index}`} className="ui-upload-strip__item">
              <Image className="ui-upload-strip__image" mode="aspectFill" src={src} />
              {onRemove ? (
                <View className="ui-upload-strip__remove" onTap={() => onRemove(index)}>
                  <Text>×</Text>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
