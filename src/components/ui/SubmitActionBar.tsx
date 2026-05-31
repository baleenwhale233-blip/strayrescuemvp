import type { ReactNode } from "react";
import { AppButton } from "./AppButton";
import { BottomActionBar } from "./BottomActionBar";
import { cx } from "./classNames";
import "./ui.scss";

type SubmitActionBarProps = {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  iconSrc?: string;
  loading?: boolean;
  loadingText?: string;
  onTap?: () => void;
};

export function SubmitActionBar({
  children,
  className,
  disabled,
  iconSrc,
  loading,
  loadingText,
  onTap,
}: SubmitActionBarProps) {
  return (
    <BottomActionBar className={cx("ui-submit-action-bar", className)}>
      <AppButton
        className="ui-submit-action-bar__button"
        disabled={disabled}
        iconSrc={iconSrc}
        loading={loading}
        loadingText={loadingText}
        onTap={onTap}
      >
        {children}
      </AppButton>
    </BottomActionBar>
  );
}
