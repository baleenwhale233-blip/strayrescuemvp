import { Image, Text, View } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useEffect, useState } from "react";
import { NavBar } from "../../../../components/NavBar";
import { useKeyboardBottomInset } from "../../../../components/useKeyboardBottomInset";
import {
  HintActionFooter,
  MoneyInput,
  PageShell,
  StepIndicator,
  SurfaceCard,
  TextareaField,
} from "../../../../components/ui";
import coverFallback from "../../../../assets/detail/guest-hero-cat.png";
import enterRescueIcon from "../../../../assets/rescue-create/step2-enter-icon.svg";
import { getCurrentDraft, updateCurrentDraft } from "../../../../domain/canonical/repository";
import "./index.scss";

export default function RescueCreateBudgetPage() {
  const keyboardBottomInset = useKeyboardBottomInset();
  const [coverPath, setCoverPath] = useState("");
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const [budgetNote, setBudgetNote] = useState("");

  useEffect(() => {
    const draft = getCurrentDraft();

    if (!draft) {
      Taro.redirectTo({
        url: "/pages/rescue/create/basic/index",
      });
      return;
    }

    setCoverPath(draft.coverPath);
    setName(draft.name);
    setBudget(draft.budget ? `${draft.budget}` : "");
    setBudgetNote(draft.budgetNote);
  }, []);

  const handleNext = () => {
    const numericBudget = Number(budget);

    if (!numericBudget || Number.isNaN(numericBudget) || numericBudget <= 0) {
      Taro.showToast({
        title: "请填写预估金额",
        icon: "none",
      });
      return;
    }

    updateCurrentDraft({
      budget: numericBudget,
      budgetNote: budgetNote.trim(),
    });

    Taro.navigateTo({
      url: "/pages/rescue/create/preview/index",
    });
  };

  const handleBack = () => {
    updateCurrentDraft({
      budget: Number(budget || 0),
      budgetNote: budgetNote.trim(),
    });
    Taro.navigateBack();
  };

  return (
    <PageShell
      className="rescue-budget-page"
      style={{ paddingBottom: `${164 + keyboardBottomInset}px` }}
    >
      <NavBar showBack title="新建记录" onBack={handleBack} />

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
            onValueChange={setBudget}
          />
        </View>

        <View className="rescue-budget-page__field">
          <Text className="rescue-budget-page__label">预估说明 (选填)</Text>
          <TextareaField
            className="rescue-budget-page__textarea"
            placeholder="请简要说明这笔预估费用将用于哪些方面？(如：后续3天住院费、特配处方粮、第2次复查化验等)"
            cursorSpacing={Math.max(180, keyboardBottomInset + 140)}
            maxlength={160}
            value={budgetNote}
            onInput={(event) => setBudgetNote(event.detail.value)}
          />
        </View>
      </SurfaceCard>

      <HintActionFooter
        className="rescue-budget-page__footer"
        hint="稍后您可以在“我的记录”里随时调整此预估金额"
        iconSrc={enterRescueIcon}
        onTap={handleNext}
      >
        进入记录页
      </HintActionFooter>
    </PageShell>
  );
}
