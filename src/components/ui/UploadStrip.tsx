import { Image, ScrollView, Text, View } from "@tarojs/components";
import type { ReactNode } from "react";
import { cx } from "./classNames";
import "./ui.scss";

type UploadStripProps = {
  addIcon?: ReactNode;
  addLabel?: string;
  addIconSrc?: string;
  className?: string;
  images: string[];
  maxImages?: number;
  onAdd: () => void;
  onPreview?: (src: string, index: number) => void;
  onRemove?: (index: number) => void;
  removeIconSrc?: string;
  variant?: "strip" | "cover";
};

export function UploadStrip({
  addIcon,
  addLabel = "添加图片",
  addIconSrc,
  className,
  images,
  maxImages,
  onAdd,
  onPreview,
  onRemove,
  removeIconSrc,
  variant = "strip",
}: UploadStripProps) {
  const canAdd = maxImages === undefined || images.length < maxImages;

  const renderAddIcon = (classNameValue: string) => {
    if (addIcon) {
      return <View className={classNameValue}>{addIcon}</View>;
    }

    if (addIconSrc) {
      return <Image className={classNameValue} mode="aspectFit" src={addIconSrc} />;
    }

    return null;
  };

  if (variant === "cover") {
    const cover = images[0];
    const coverAddIcon = renderAddIcon("ui-upload-strip__cover-add-icon");

    return (
      <View className={cx("ui-upload-strip", "ui-upload-strip--cover", className)}>
        {cover ? (
          <View className="ui-upload-strip__cover" onTap={() => onPreview?.(cover, 0)}>
            <Image className="ui-upload-strip__image" mode="aspectFill" src={cover} />
            {onRemove ? (
              <View
                className="ui-upload-strip__cover-remove"
                onTap={(event) => {
                  event.stopPropagation();
                  onRemove(0);
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
        ) : (
          <View className="ui-upload-strip__cover-add" onTap={onAdd}>
            {coverAddIcon ? (
              <View className="ui-upload-strip__cover-add-button">{coverAddIcon}</View>
            ) : null}
            <Text className="ui-upload-strip__cover-add-copy">{addLabel}</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View className={cx("ui-upload-strip", className)}>
      <ScrollView className="ui-upload-strip__scroll" scrollX showScrollbar={false}>
        <View className="ui-upload-strip__content">
          {canAdd ? (
            <View className="ui-upload-strip__add" onTap={onAdd}>
              {renderAddIcon("ui-upload-strip__add-icon")}
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
