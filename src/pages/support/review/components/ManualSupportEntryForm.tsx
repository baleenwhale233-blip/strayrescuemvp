import { Input, View } from "@tarojs/components";
import submitArrowIcon from "../../../../assets/support-claim/submit-arrow-19.svg";
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
      <FormField className="support-review-page__field" label="登记金额">
        <MoneyInput value={amount} onValueChange={onAmountChange} />
      </FormField>

      <FormField className="support-review-page__field" label="登记人称呼">
        <Input
          className="support-review-page__input"
          placeholder="微信 ID / 昵称等"
          value={supporter}
          onInput={(event) => onSupporterChange(event.detail.value)}
        />
      </FormField>

      <SubmitActionBar iconSrc={submitArrowIcon} onTap={onSubmit}>
        提交登记
      </SubmitActionBar>
    </View>
  );
}
