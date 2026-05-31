import { Text, Textarea, View } from "@tarojs/components";
import { cx } from "./classNames";
import "./ui.scss";

type TextareaFieldProps = {
  className?: string;
  cursorSpacing?: number;
  maxlength?: number;
  onBlur?: (event: any) => void;
  onFocus?: (event: any) => void;
  onInput: (event: any) => void;
  placeholder: string;
  value: string;
};

export function TextareaField({
  className,
  cursorSpacing = 160,
  maxlength,
  onBlur,
  onFocus,
  onInput,
  placeholder,
  value,
}: TextareaFieldProps) {
  return (
    <View className={cx("ui-textarea-field", className)}>
      {!value ? <Text className="ui-textarea-field__placeholder">{placeholder}</Text> : null}
      <Textarea
        adjustPosition
        className="ui-textarea-field__control"
        cursorSpacing={cursorSpacing}
        maxlength={maxlength}
        value={value}
        onBlur={onBlur}
        onFocus={onFocus}
        onInput={onInput}
      />
    </View>
  );
}
