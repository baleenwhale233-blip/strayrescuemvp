import { Image, Input, Text, View } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useEffect, useState } from "react";
import { NavBar } from "../../../../components/NavBar";
import { TextareaWithOverlayPlaceholder } from "../../../../components/TextareaWithOverlayPlaceholder";
import coverFallback from "../../../../assets/detail/guest-hero-cat.png";
import enterRescueIcon from "../../../../assets/rescue-create/step2-enter-icon.svg";
import {
  getCurrentDraft,
  updateCurrentDraft,
} from "../../../../domain/canonical/repository/localRepository";
import "./index.scss";

export default function RescueCreateBudgetPage() {
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
    <View className="page-shell rescue-budget-page">
      <NavBar showBack title="新建救助" onBack={handleBack} />

      <View className="rescue-budget-page__steps">
        <View className="rescue-budget-page__step" />
        <View className="rescue-budget-page__step rescue-budget-page__step--active" />
        <View className="rescue-budget-page__step" />
      </View>

      <View className="rescue-budget-page__profile">
        <View className="rescue-budget-page__avatar-wrap">
          <Image
            className="rescue-budget-page__avatar"
            mode="aspectFill"
            src={coverPath || coverFallback}
          />
        </View>
        <Text className="rescue-budget-page__name">{name || "未命名救助"}</Text>
      </View>

      <View className="rescue-budget-page__card theme-card">
        <Text className="rescue-budget-page__title">设定预估金额</Text>
        <Text className="rescue-budget-page__subtitle">
          请预估一下救治大概需要多少钱？
        </Text>

        <View className="rescue-budget-page__field">
          <Text className="rescue-budget-page__label">预估费用 (元)</Text>
          <View className="rescue-budget-page__money-input">
            <Text className="rescue-budget-page__money-prefix">¥</Text>
            <Input
              className="rescue-budget-page__money-control"
              type="digit"
              placeholder="0.00"
              placeholderStyle="color:#CBD5E1;"
              value={budget}
              onInput={(event) => setBudget(event.detail.value)}
            />
          </View>
        </View>

        <View className="rescue-budget-page__field">
          <Text className="rescue-budget-page__label">预估说明 (选填)</Text>
          <TextareaWithOverlayPlaceholder
            wrapperClassName="rescue-budget-page__textarea-wrap"
            textareaClassName="rescue-budget-page__textarea"
            placeholderClassName="rescue-budget-page__textarea-placeholder"
            placeholder="请简要说明这笔预估费用将用于哪些方面？(如：后续3天住院费、特配处方粮、第2次复查化验等)"
            maxlength={160}
            value={budgetNote}
            onInput={(event) => setBudgetNote(event.detail.value)}
          />
        </View>
      </View>

      <View className="rescue-budget-page__footer">
        <View className="theme-button-primary rescue-budget-page__button" onTap={handleNext}>
          <Text>进入救助页面</Text>
          <Image
            className="rescue-budget-page__button-icon"
            mode="aspectFit"
            src={enterRescueIcon}
          />
        </View>
        <Text className="rescue-budget-page__footer-hint">
          稍后您可以在工作台随时调整此预估金额
        </Text>
      </View>
    </View>
  );
}
