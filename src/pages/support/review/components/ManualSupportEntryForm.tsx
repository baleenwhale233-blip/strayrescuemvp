import { Input, View } from "@tarojs/components";
import { FormField, MoneyInput, SubmitActionBar } from "../../../../components/ui";
import "./ManualSupportEntryForm.scss";

export function ManualSupportEntryForm({
  amount,
  supporter,
  onAmountChange,
  onSubmit,
  onSupporterChange,
}: {
  amount: string;
  supporter: string;
  onAmountChange: (value: string) => void;
  onSubmit: () => void;
  onSupporterChange: (value: string) => void;
}) {
  return (
    <View className="support-review-page__manual">
      <FormField className="support-review-page__field" label="支持金额">
        <MoneyInput value={amount} onValueChange={onAmountChange} />
      </FormField>

      <FormField className="support-review-page__field" label="支持人称呼">
        <Input
          className="support-review-page__input"
          placeholder="微信 ID、昵称等"
          value={supporter}
          onInput={(event) => onSupporterChange(event.detail.value)}
        />
      </FormField>

      <SubmitActionBar iconName="send" onTap={onSubmit}>
        登记支持
      </SubmitActionBar>
    </View>
  );
}
