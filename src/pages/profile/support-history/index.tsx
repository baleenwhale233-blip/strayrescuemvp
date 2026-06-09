import { Text, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useState } from "react";
import { AppIcon } from "../../../components/AppIcon";
import { NavBar } from "../../../components/NavBar";
import {
  Avatar,
  EmptyState,
  ListEntry,
  PageShell,
  SectionHeader,
  SurfaceCard,
} from "../../../components/ui";
import fallbackCoverImage from "../../../assets/detail/guest-hero-cat.png";
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
      url: `/pages/rescue/detail/index?id=${caseId}`,
    });
  };

  return (
    <PageShell className="support-history-page">
      <NavBar showBack title="我的支持登记" />

      <SurfaceCard className="support-history-page__summary">
        <Text className="support-history-page__summary-label">已确认支持合计</Text>
        <Text className="support-history-page__summary-value">{formatCurrency(totalAmount)}</Text>
      </SurfaceCard>

      <SectionHeader
        className="support-history-page__section-title"
        title={`支持登记（${items.length}）`}
      />

      <View className="support-history-page__list">
        {items.length ? (
          items.map((item) => (
            <ListEntry
              key={item.caseId}
              className="support-history-page__item"
              leading={
                <Avatar
                  className="support-history-page__avatar"
                  fallbackSrc={fallbackCoverImage}
                  src={item.coverImageUrl}
                />
              }
              onTap={() => handleOpenCase(item.caseId)}
              subtitle={`已确认支持 ${item.amountLabel}`}
              title={item.title}
              trailing={
                <AppIcon
                  className="support-history-page__chevron"
                  name="chevronRight"
                  size={12}
                  variant="muted"
                />
              }
            />
          ))
        ) : (
          <EmptyState
            className="support-history-page__empty"
            title="还没有已确认支持"
            description="登记支持后，等待档案维护者确认，就会出现在这里。"
          />
        )}
      </View>
    </PageShell>
  );
}
