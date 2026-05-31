import { Text, View } from "@tarojs/components";
import { RescueCaseSummaryCard } from "../../../../components/rescue";
import {
  FormField,
  MoneyInput,
  NoticeBanner,
  SubmitActionBar,
  TextareaField,
} from "../../../../components/ui";
import "./BudgetUpdateForm.scss";

export interface BudgetUpdateContextCard {
  coverImage: string;
  previousBudget: number;
  publicCaseId: string;
  rescueStartedAtLabel: string;
  statusLabel: string;
  supportedAmountLabel: string;
  title: string;
}

export function BudgetUpdateForm({
  budget,
  contextCard,
  cursorSpacing,
  reason,
  onBudgetChange,
  onReasonChange,
  onSubmit,
}: {
  budget: string;
  contextCard: BudgetUpdateContextCard;
  cursorSpacing: number;
  reason: string;
  onBudgetChange: (value: string) => void;
  onReasonChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <>
      <View className="rescue-budget-update-page__body">
        <RescueCaseSummaryCard
          className="rescue-budget-update-page__case-summary"
          coverSrc={contextCard.coverImage}
          publicCaseId={contextCard.publicCaseId}
          rescueStartedAtLabel={contextCard.rescueStartedAtLabel}
          statusLabel={contextCard.statusLabel}
          title={contextCard.title}
        />

        <FormField className="rescue-budget-update-page__field" label="新预估总金额">
          <MoneyInput
            className="rescue-budget-update-page__amount-input"
            value={budget}
            onValueChange={onBudgetChange}
          />
          <Text className="rescue-budget-update-page__hint">
            当前已登记：{contextCard.supportedAmountLabel}
          </Text>
        </FormField>

        <FormField className="rescue-budget-update-page__field" label="追加原因/说明">
          <TextareaField
            className="rescue-budget-update-page__textarea"
            placeholder="请说明为什么要追加预算，如：病情反复需要额手术、住院时间延长等"
            cursorSpacing={cursorSpacing}
            maxlength={160}
            value={reason}
            onInput={(event) => onReasonChange(event.detail.value)}
          />
        </FormField>

        <NoticeBanner className="rescue-budget-update-page__notice" iconName="info">
          预算追加后将自动生成一条进展动态，并在这条记录的时间轴中公示。
        </NoticeBanner>
      </View>

      <SubmitActionBar
        className="rescue-budget-update-page__bottom"
        iconName="send"
        onTap={onSubmit}
      >
        确认追加并更新时间线
      </SubmitActionBar>
    </>
  );
}
