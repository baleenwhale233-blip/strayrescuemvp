import type { ReactNode } from "react";
import { Text, View } from "@tarojs/components";
import type { IconName, IconVariant } from "../AppIcon";
import { AppButton } from "./AppButton";
import { cx } from "./classNames";
import "./ui.scss";

type HintActionFooterProps = {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  hint: ReactNode;
  iconName?: IconName;
  iconSrc?: string;
  iconVariant?: IconVariant;
  loading?: boolean;
  loadingText?: string;
  onTap?: () => void;
};

export function HintActionFooter({
  children,
  className,
  disabled,
  hint,
  iconName,
  iconSrc,
  iconVariant,
  loading,
  loadingText,
  onTap,
}: HintActionFooterProps) {
  return (
    <View className={cx("ui-hint-action-footer", className)}>
      <AppButton
        className="ui-hint-action-footer__button"
        disabled={disabled}
        iconName={iconName}
        iconSrc={iconSrc}
        iconVariant={iconVariant}
        loading={loading}
        loadingText={loadingText}
        onTap={onTap}
      >
        {children}
      </AppButton>
      <Text className="ui-hint-action-footer__hint">{hint}</Text>
    </View>
  );
}
