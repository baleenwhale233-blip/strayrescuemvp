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
        placeholder="请详细描述这条记录的最新进展"
        cursorSpacing={cursorSpacing}
        maxlength={800}
        value={value}
        onInput={(event) => onChange(event.detail.value)}
      />
    </FormField>
  );
}
