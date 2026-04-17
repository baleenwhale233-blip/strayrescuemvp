import { Text, Textarea, View } from "@tarojs/components";

type TextareaWithOverlayPlaceholderProps = {
  wrapperClassName: string;
  textareaClassName: string;
  placeholderClassName: string;
  placeholder: string;
  value: string;
  maxlength?: number;
  onInput: (event: any) => void;
};

export function TextareaWithOverlayPlaceholder({
  wrapperClassName,
  textareaClassName,
  placeholderClassName,
  placeholder,
  value,
  maxlength,
  onInput,
}: TextareaWithOverlayPlaceholderProps) {
  return (
    <View className={wrapperClassName}>
      {!value ? <Text className={placeholderClassName}>{placeholder}</Text> : null}
      <Textarea
        className={textareaClassName}
        maxlength={maxlength}
        value={value}
        onInput={onInput}
      />
    </View>
  );
}
