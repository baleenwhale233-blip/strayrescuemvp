import { Input, Text, View } from "@tarojs/components";
import { cx } from "./classNames";
import "./ui.scss";

type MoneyInputProps = {
  className?: string;
  disabled?: boolean;
  maxlength?: number;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  placeholderStyle?: string;
  prefix?: string;
  value: string;
};

export function MoneyInput({
  className,
  disabled,
  maxlength,
  onValueChange,
  placeholder = "0.00",
  placeholderStyle,
  prefix = "¥",
  value,
}: MoneyInputProps) {
  return (
    <View className={cx("ui-money-input", className)}>
      <Text className="ui-money-input__prefix">{prefix}</Text>
      <Input
        className="ui-money-input__control"
        disabled={disabled}
        maxlength={maxlength}
        placeholder={placeholder}
        placeholderStyle={placeholderStyle}
        type="digit"
        value={value}
        onInput={(event) => onValueChange?.(event.detail.value)}
      />
    </View>
  );
}
