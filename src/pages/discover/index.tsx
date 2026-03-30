import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { NavBar } from "../../components/NavBar";
import { StatusChip } from "../../components/StatusChip";
import {
  discoverCases,
  discoverCategories,
} from "../../data/mock";
import "./index.scss";

export default function DiscoverPage() {
  const handleNavigateToGuestDetail = (detailId: string) => {
    Taro.navigateTo({
      url: `/pages/rescue/detail/index?id=${detailId}&mode=guest`,
    });
  };

  return (
    <View className="page-shell discover-page">
      <NavBar title="救猫咪" />

      <View className="discover-page__chips">
        {discoverCategories.map((category) => (
          <View
            key={category.key}
            className={`theme-chip ${category.active ? "theme-chip--active" : ""}`}
          >
            <Text>{category.label}</Text>
          </View>
        ))}
      </View>

      <View className="discover-page__list">
        {discoverCases.map((item) => (
          <View
            key={item.id}
            className="discover-card theme-card"
            onTap={() => handleNavigateToGuestDetail(item.detailId)}
          >
            <View
              className="discover-card__cover"
              style={{
                background: `linear-gradient(135deg, ${item.coverStart}, ${item.coverEnd})`,
              }}
            >
              <StatusChip label={item.statusLabel} tone={item.statusTone} />
              <Text className="discover-card__cover-label">{item.coverLabel}</Text>
            </View>

            <View className="discover-card__body">
              <View className="discover-card__title-row">
                <Text className="theme-text-card-title">{item.title}</Text>
                <Text className="discover-card__updated-at">{item.updatedAt}</Text>
              </View>

              <View className="discover-card__meta-row">
                <Text className="discover-card__meta">{item.subtitle}</Text>
                <Text className="discover-card__amount">{item.amountText}</Text>
              </View>

              <View className="discover-card__progress">
                <View className="progress">
                  <View
                    className="progress__segment"
                    style={{
                      width: `${item.progress}%`,
                      background: "var(--color-ledger-spent)",
                    }}
                  />
                </View>
              </View>

              <Text className="discover-card__latest">{item.latest}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
