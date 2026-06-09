import { Image, Text, View } from "@tarojs/components";
import coverFallback from "../../../../../assets/detail/guest-hero-cat.png";
import {
  HintActionFooter,
  MoneyInput,
  StepIndicator,
  SurfaceCard,
  TextareaField,
} from "../../../../../components/ui";
import "./CreateBudgetForm.scss";

export function CreateBudgetForm({
  budget,
  budgetNote,
  coverPath,
  cursorSpacing,
  name,
  onBudgetChange,
  onBudgetNoteChange,
  onNext,
}: {
  budget: string;
  budgetNote: string;
  coverPath: string;
  cursorSpacing: number;
  name: string;
  onBudgetChange: (value: string) => void;
  onBudgetNoteChange: (value: string) => void;
  onNext: () => void;
}) {
  return (
    <>
      <StepIndicator activeIndex={1} total={3} />

      <View className="rescue-budget-page__profile">
        <View className="rescue-budget-page__avatar-wrap">
          <Image
            className="rescue-budget-page__avatar"
            mode="aspectFill"
            src={coverPath || coverFallback}
          />
        </View>
        <Text className="rescue-budget-page__name">{name || "未命名档案"}</Text>
      </View>

      <SurfaceCard className="rescue-budget-page__card">
        <Text className="rescue-budget-page__title">设定预估金额</Text>
        <Text className="rescue-budget-page__subtitle">预估后续救助大概会涉及多少费用。</Text>

        <View className="rescue-budget-page__field">
          <Text className="rescue-budget-page__label">预估费用 (元)</Text>
          <MoneyInput
            className="rescue-budget-page__money-input"
            placeholderStyle="color:var(--color-text-tertiary);"
            value={budget}
            onValueChange={onBudgetChange}
          />
        </View>

        <View className="rescue-budget-page__field">
          <Text className="rescue-budget-page__label">预估说明 (选填)</Text>
          <TextareaField
            className="rescue-budget-page__textarea"
            placeholder="说明预估费用会用在哪里，如：后续 3 天住院费、特配处方粮、第 2 次复查化验等"
            cursorSpacing={cursorSpacing}
            maxlength={160}
            value={budgetNote}
            onInput={(event) => onBudgetNoteChange(event.detail.value)}
          />
        </View>
      </SurfaceCard>

      <HintActionFooter
        className="rescue-budget-page__footer"
        hint="稍后你可以在“我的记录”里调整预估金额"
        iconName="arrowRight"
        onTap={onNext}
      >
        进入记录页
      </HintActionFooter>
    </>
  );
}
