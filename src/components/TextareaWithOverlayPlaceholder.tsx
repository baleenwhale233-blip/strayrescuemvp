import { Text, Textarea, View } from "@tarojs/components";

type TextareaWithOverlayPlaceholderProps = {
  wrapperClassName: string;
  textareaClassName: string;
  placeholderClassName: string;
  placeholder: string;
  value: string;
  maxlength?: number;
  onInput: (event: any) => void;
  onFocus?: (event: any) => void;
  onBlur?: (event: any) => void;
  cursorSpacing?: number;
};

export function TextareaWithOverlayPlaceholder({
  wrapperClassName,
  textareaClassName,
  placeholderClassName,
  placeholder,
  value,
  maxlength,
  onInput,
  onFocus,
  onBlur,
  cursorSpacing = 160,
}: TextareaWithOverlayPlaceholderProps) {
  return (
    <View className={wrapperClassName}>
      {!value ? <Text className={placeholderClassName}>{placeholder}</Text> : null}
      <Textarea
        adjustPosition
        className={textareaClassName}
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
