import type { ReactNode } from "react";
import { Text, View } from "@tarojs/components";
import { cx } from "./classNames";
import "./ui.scss";

type FormFieldProps = {
  children: ReactNode;
  className?: string;
  description?: string;
  label: string;
  required?: boolean;
};

export function FormField({ children, className, description, label, required }: FormFieldProps) {
  return (
    <View className={cx("ui-form-field", className)}>
      <View className="ui-form-field__head">
        <Text className="ui-form-field__label">
          {label}
          {required ? <Text className="ui-form-field__required"> *</Text> : null}
        </Text>
      </View>
      {description ? <Text className="ui-form-field__description">{description}</Text> : null}
      <View className="ui-form-field__control">{children}</View>
    </View>
  );
}
