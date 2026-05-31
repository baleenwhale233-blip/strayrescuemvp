import { Image, Text, View } from "@tarojs/components";
import enterRescueIcon from "../../../../../assets/rescue-create/step2-enter-icon.svg";
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
        <Text className="rescue-budget-page__subtitle">
          请预估一下后续记录里大概会涉及多少费用？
        </Text>

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
            placeholder="请简要说明这笔预估费用将用于哪些方面？(如：后续3天住院费、特配处方粮、第2次复查化验等)"
            cursorSpacing={cursorSpacing}
            maxlength={160}
            value={budgetNote}
            onInput={(event) => onBudgetNoteChange(event.detail.value)}
          />
        </View>
      </SurfaceCard>

      <HintActionFooter
        className="rescue-budget-page__footer"
        hint="稍后您可以在“我的记录”里随时调整此预估金额"
        iconSrc={enterRescueIcon}
        onTap={onNext}
      >
        进入记录页
      </HintActionFooter>
    </>
  );
}
