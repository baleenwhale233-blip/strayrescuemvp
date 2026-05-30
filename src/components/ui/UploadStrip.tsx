import { Image, ScrollView, Text, View } from "@tarojs/components";
import { cx } from "./classNames";
import "./ui.scss";

type UploadStripProps = {
  addLabel?: string;
  addIconSrc?: string;
  className?: string;
  images: string[];
  maxImages?: number;
  onAdd: () => void;
  onPreview?: (src: string, index: number) => void;
  onRemove?: (index: number) => void;
  removeIconSrc?: string;
};

export function UploadStrip({
  addLabel = "添加图片",
  addIconSrc,
  className,
  images,
  maxImages,
  onAdd,
  onPreview,
  onRemove,
  removeIconSrc,
}: UploadStripProps) {
  const canAdd = maxImages === undefined || images.length < maxImages;

  return (
    <View className={cx("ui-upload-strip", className)}>
      <ScrollView className="ui-upload-strip__scroll" scrollX showScrollbar={false}>
        <View className="ui-upload-strip__content">
          {canAdd ? (
            <View className="ui-upload-strip__add" onTap={onAdd}>
              {addIconSrc ? (
                <Image className="ui-upload-strip__add-icon" mode="aspectFit" src={addIconSrc} />
              ) : null}
              <Text className="ui-upload-strip__add-copy">{addLabel}</Text>
            </View>
          ) : null}
          {images.map((src, index) => (
            <View
              key={`${src}-${index}`}
              className="ui-upload-strip__item"
              onTap={() => onPreview?.(src, index)}
            >
              <Image className="ui-upload-strip__image" mode="aspectFill" src={src} />
              {onRemove ? (
                <View
                  className="ui-upload-strip__remove"
                  onTap={(event) => {
                    event.stopPropagation();
                    onRemove(index);
                  }}
                >
                  {removeIconSrc ? (
                    <Image
                      className="ui-upload-strip__remove-icon"
                      mode="aspectFit"
                      src={removeIconSrc}
                    />
                  ) : (
                    <Text>×</Text>
                  )}
                </View>
              ) : null}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
