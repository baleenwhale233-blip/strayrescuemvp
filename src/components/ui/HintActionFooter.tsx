import type { ReactNode } from "react";
import { Text, View } from "@tarojs/components";
import { AppButton } from "./AppButton";
import { cx } from "./classNames";
import "./ui.scss";

type HintActionFooterProps = {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  hint: ReactNode;
  iconSrc?: string;
  loading?: boolean;
  loadingText?: string;
  onTap?: () => void;
};

export function HintActionFooter({
  children,
  className,
  disabled,
  hint,
  iconSrc,
  loading,
  loadingText,
  onTap,
}: HintActionFooterProps) {
  return (
    <View className={cx("ui-hint-action-footer", className)}>
      <AppButton
        className="ui-hint-action-footer__button"
        disabled={disabled}
        iconSrc={iconSrc}
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
