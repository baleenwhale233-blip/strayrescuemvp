import { Image, Text, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useState } from "react";
import { NavBar } from "../../../components/NavBar";
import fallbackCoverImage from "../../../assets/detail/guest-hero-cat.png";
import chevronIcon from "../../../assets/rescue-detail/owner/action-chevron.svg";
import { loadMySupportHistory } from "../../../domain/canonical/repository";
import "./index.scss";

type SupportHistoryItem = {
  caseId: string;
  title: string;
  coverImageUrl: string;
  amount: number;
  amountLabel: string;
};

function formatCurrency(value: number) {
  return `¥${value.toLocaleString("zh-CN")}`;
}

export default function SupportHistoryPage() {
  const [items, setItems] = useState<SupportHistoryItem[]>([]);

  useDidShow(() => {
    loadMySupportHistory()
      .then((summary) => {
        setItems(
          (summary?.supportCases || []).map((item) => ({
            caseId: item.caseId,
            title: item.animalName,
            coverImageUrl: item.animalCoverImageUrl || fallbackCoverImage,
            amount: item.myTotalSupportedAmount,
            amountLabel: item.myTotalSupportedAmountLabel,
          })),
        );
      })
      .catch(() => {
        setItems([]);
      });
  });

  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  const handleOpenCase = (caseId: string) => {
    Taro.navigateTo({
      url: `/pages/rescue/detail/index?id=${caseId}&mode=guest`,
    });
  };

  return (
    <View className="page-shell support-history-page">
      <NavBar showBack title="我的登记记录" />

      <View className="support-history-page__summary">
        <Text className="support-history-page__summary-label">总计登记</Text>
        <Text className="support-history-page__summary-value">
          {formatCurrency(totalAmount)}
        </Text>
      </View>

      <Text className="support-history-page__section-title">
        登记记录（{items.length}）
      </Text>

      <View className="support-history-page__list">
        {items.length ? (
          items.map((item) => (
            <View
              key={item.caseId}
              className="support-history-page__item"
              onTap={() => handleOpenCase(item.caseId)}
            >
              <Image
                className="support-history-page__avatar"
                mode="aspectFill"
                src={item.coverImageUrl}
              />
              <View className="support-history-page__item-copy">
                <Text className="support-history-page__item-title">{item.title}</Text>
                <Text className="support-history-page__item-meta">
                  登记 {item.amountLabel}
                </Text>
              </View>
              <Image
                className="support-history-page__chevron"
                mode="aspectFit"
                src={chevronIcon}
              />
            </View>
          ))
        ) : (
          <View className="support-history-page__empty">
            <Text className="support-history-page__empty-title">还没有已确认登记</Text>
            <Text className="support-history-page__empty-copy">
              提交登记后，等待记录维护者处理，就会出现在这里。
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
