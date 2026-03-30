import { Image, Input, Text, Textarea, View } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useEffect, useState } from "react";
import { AppIcon } from "../../../../components/AppIcon";
import { NavBar } from "../../../../components/NavBar";
import coverFallback from "../../../../assets/detail/guest-hero-cat.png";
import {
  getCurrentDraftSession,
  patchCurrentDraftSession,
} from "../../../../data/rescueCreateStore";
import "./index.scss";

function formatBudgetText(value: string) {
  if (!value) {
    return "待定";
  }

  return `¥${Number(value || 0).toLocaleString("zh-CN")}`;
}

export default function RescueCreateBudgetPage() {
  const [coverPath, setCoverPath] = useState("");
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const [budgetNote, setBudgetNote] = useState("");

  useEffect(() => {
    const draft = getCurrentDraftSession();

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

    patchCurrentDraftSession({
      budget: numericBudget,
      budgetNote: budgetNote.trim(),
    });

    Taro.navigateTo({
      url: "/pages/rescue/create/preview/index",
    });
  };

  return (
    <View className="page-shell rescue-budget-page">
      <NavBar showBack title="新建救助" />

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
          <View className="rescue-budget-page__avatar-badge">
            <AppIcon name="circleCheck" size={24} variant="brand" />
          </View>
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
              value={budget}
              onInput={(event) => setBudget(event.detail.value)}
            />
          </View>
        </View>

        <View className="rescue-budget-page__field">
          <Text className="rescue-budget-page__label">预估说明 (选填)</Text>
          <View className="rescue-budget-page__textarea-wrap">
            <Textarea
              className="rescue-budget-page__textarea"
              maxlength={160}
              placeholder="请简要说明这笔预估费用将用于哪些方面？(如：后续3天住院费、特配处方粮、第2次复查化验等)"
              value={budgetNote}
              onInput={(event) => setBudgetNote(event.detail.value)}
            />
          </View>
        </View>
      </View>

      <View className="rescue-budget-page__preview">
        <Text className="rescue-budget-page__preview-title">账本预览</Text>
        <View className="rescue-budget-page__preview-card">
          <View className="rescue-budget-page__preview-head">
            <Text className="rescue-budget-page__preview-meta">
              已支出: 0.00
            </Text>
            <Text className="rescue-budget-page__preview-meta">
              目标预估: {formatBudgetText(budget)}
            </Text>
          </View>

          <View className="rescue-budget-page__preview-bar">
            <View className="rescue-budget-page__preview-segment" />
            <View className="rescue-budget-page__preview-segment rescue-budget-page__preview-segment--light" />
            <View className="rescue-budget-page__preview-segment" />
          </View>

          <View className="rescue-budget-page__preview-tip">
            <Text className="rescue-budget-page__preview-tip-icon">i</Text>
            <Text className="rescue-budget-page__preview-tip-text">
              进度条：已支出、结余/缺口、整体预估费用
            </Text>
          </View>
        </View>
      </View>

      <View className="rescue-budget-page__footer">
        <View className="theme-button-primary rescue-budget-page__button" onTap={handleNext}>
          <Text>进入救助页面</Text>
          <View className="rescue-budget-page__button-icon">
            <AppIcon name="plusCircle" size={24} variant="inverse" />
          </View>
        </View>
        <Text className="rescue-budget-page__footer-hint">
          稍后您可以在工作台随时调整此预估金额
        </Text>
      </View>
    </View>
  );
}
