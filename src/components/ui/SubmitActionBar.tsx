import type { ReactNode } from "react";
import type { IconName, IconVariant } from "../AppIcon";
import { AppButton } from "./AppButton";
import { BottomActionBar } from "./BottomActionBar";
import { cx } from "./classNames";
import "./ui.scss";

type SubmitActionBarProps = {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  iconName?: IconName;
  iconSrc?: string;
  iconVariant?: IconVariant;
  loading?: boolean;
  loadingText?: string;
  onTap?: () => void;
};

export function SubmitActionBar({
  children,
  className,
  disabled,
  iconName,
  iconSrc,
  iconVariant,
  loading,
  loadingText,
  onTap,
}: SubmitActionBarProps) {
  return (
    <BottomActionBar className={cx("ui-submit-action-bar", className)}>
      <AppButton
        className="ui-submit-action-bar__button"
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
    </BottomActionBar>
  );
}
