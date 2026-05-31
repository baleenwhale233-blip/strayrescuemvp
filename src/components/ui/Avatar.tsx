import { Image, View } from "@tarojs/components";
import { cx } from "./classNames";
import "./ui.scss";

type AvatarProps = {
  className?: string;
  fallbackSrc?: string;
  size?: "sm" | "md" | "lg";
  src?: string;
  variant?: "plain" | "framed" | "raised";
};

export function Avatar({
  className,
  fallbackSrc,
  size = "md",
  src,
  variant = "plain",
}: AvatarProps) {
  const imageSrc = src || fallbackSrc;

  return (
    <View className={cx("ui-avatar", `ui-avatar--${size}`, `ui-avatar--${variant}`, className)}>
      {imageSrc ? (
        <Image className="ui-avatar__image" mode="aspectFill" src={imageSrc} />
      ) : (
        <View className="ui-avatar__placeholder">
          <View className="ui-avatar__placeholder-head" />
          <View className="ui-avatar__placeholder-body" />
        </View>
      )}
    </View>
  );
}
