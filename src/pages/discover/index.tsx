import { Image, View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { NavBar } from "../../components/NavBar";
import { StatusChip } from "../../components/StatusChip";
import {
  getDiscoverCardVMs,
} from "../../domain/canonical/repository/localRepository";
import "./index.scss";

const discoverCategories = [
  { key: "all", label: "全部", active: true },
  { key: "urgent", label: "紧急", active: false },
  { key: "active", label: "进行中", active: false },
  { key: "done", label: "完成", active: false },
] as const;

export default function DiscoverPage() {
  const discoverCards = getDiscoverCardVMs();

  const handleNavigateToGuestDetail = (caseId: string) => {
    Taro.navigateTo({
      url: `/pages/rescue/detail/index?id=${caseId}&mode=guest`,
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
        {discoverCards.map((item) => (
          <View
            key={item.caseId}
            className="discover-card theme-card"
            onTap={() => handleNavigateToGuestDetail(item.caseId)}
          >
            <View className="discover-card__cover">
              {item.coverImageUrl ? (
                <Image
                  className="discover-card__cover-image"
                  mode="aspectFill"
                  src={item.coverImageUrl}
                />
              ) : null}
              <StatusChip label={item.statusLabel} tone={item.statusTone} />
              {!item.coverImageUrl ? (
                <Text className="discover-card__cover-label">
                  {item.title.slice(0, 2)}
                </Text>
              ) : null}
            </View>

            <View className="discover-card__body">
              <View className="discover-card__title-row">
                <Text className="theme-text-card-title">{item.title}</Text>
                <Text className="discover-card__updated-at">{item.updatedAtLabel}</Text>
              </View>

              <View className="discover-card__meta-row">
                <Text className="discover-card__meta">{item.subtitle}</Text>
                <Text className="discover-card__amount">{item.amountLabel}</Text>
              </View>

              <View className="discover-card__progress">
                <View className="progress">
                  <View
                    className="progress__segment"
                    style={{
                      width: `${item.progressPercent}%`,
                      background: "var(--color-ledger-spent)",
                    }}
                  />
                </View>
              </View>

              <Text className="discover-card__latest">
                {item.latestTimelineSummary || "暂无公开动态"}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
