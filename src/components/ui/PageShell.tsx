import type { CSSProperties, ReactNode } from "react";
import { View } from "@tarojs/components";
import { cx } from "./classNames";
import "./ui.scss";

type PageShellProps = {
  children: ReactNode;
  centered?: boolean;
  className?: string;
  safeBottom?: boolean;
  style?: CSSProperties;
};

export function PageShell({
  children,
  centered = false,
  className,
  safeBottom,
  style,
}: PageShellProps) {
  return (
    <View
      className={cx(
        "ui-page-shell",
        centered && "ui-page-shell--centered",
        safeBottom && "ui-page-shell--safe-bottom",
        className,
      )}
      style={style}
    >
      {children}
    </View>
  );
}
