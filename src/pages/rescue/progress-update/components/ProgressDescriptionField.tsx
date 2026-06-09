import { FormField, TextareaField } from "../../../../components/ui";
import "./ProgressDescriptionField.scss";

export function ProgressDescriptionField({
  cursorSpacing,
  value,
  onChange,
}: {
  cursorSpacing: number;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <FormField className="rescue-update-page__field" label="进展详情描述">
      <TextareaField
        className="rescue-update-page__textarea"
        placeholder="写清目前状态、处理结果或下一步安排"
        cursorSpacing={cursorSpacing}
        maxlength={800}
        value={value}
        onInput={(event) => onChange(event.detail.value)}
      />
    </FormField>
  );
}
