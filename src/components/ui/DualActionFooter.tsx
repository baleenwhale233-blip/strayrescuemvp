import type { ReactNode } from "react";
import { AppButton } from "./AppButton";
import { BottomActionBar } from "./BottomActionBar";
import { cx } from "./classNames";
import "./ui.scss";

type DualActionFooterProps = {
  className?: string;
  primaryIconSrc?: string;
  primaryLabel: ReactNode;
  secondaryLabel: ReactNode;
  secondaryVariant?: "ghost" | "secondary";
  onPrimary: () => void;
  onSecondary: () => void;
};

export function DualActionFooter({
  className,
  primaryIconSrc,
  primaryLabel,
  secondaryLabel,
  secondaryVariant = "ghost",
  onPrimary,
  onSecondary,
}: DualActionFooterProps) {
  return (
    <BottomActionBar className={cx("ui-dual-action-footer", className)}>
      <AppButton
        className="ui-dual-action-footer__secondary"
        variant={secondaryVariant}
        onTap={onSecondary}
      >
        {secondaryLabel}
      </AppButton>
      <AppButton
        className="ui-dual-action-footer__primary"
        iconSrc={primaryIconSrc}
        onTap={onPrimary}
      >
        {primaryLabel}
      </AppButton>
    </BottomActionBar>
  );
}
