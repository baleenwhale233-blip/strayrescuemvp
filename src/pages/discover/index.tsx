import { Image, Input, Text, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useState } from "react";
import { NavBar } from "../../components/NavBar";
import {
  loadHomepageCaseCardVMs,
  searchCaseByPublicIdExact,
  type HomepageCaseCardVM,
} from "../../domain/canonical/repository";
import "./index.scss";

const evidenceCompleteIconUrl =
  "https://www.figma.com/api/mcp/asset/192bdfaa-4765-4ab1-993d-98cb5bda31d2";
const searchIconUrl =
  "https://www.figma.com/api/mcp/asset/669a994a-0897-4fa6-885f-ff10ac62a38f";

function getStatusEmoji(statusLabel: string) {
  if (statusLabel.includes("紧急送医")) {
    return "🚨";
  }

  if (statusLabel.includes("康复观察")) {
    return "🏡";
  }

  if (statusLabel.includes("寻找领养")) {
    return "💖";
  }

  if (statusLabel.includes("遗憾离世")) {
    return "🌈";
  }

  return "🏥";
}

function EvidenceLabel({ level }: { level: HomepageCaseCardVM["evidenceLevel"] }) {
  const labelMap = {
    complete: "证据链完整",
    basic: "仅基础证据链",
    needs_attention: "证据待补充",
  } as const;

  return (
    <View className="discover-card__evidence">
      {level === "complete" ? (
        <Image
          className="discover-card__evidence-icon"
          mode="aspectFit"
          src={evidenceCompleteIconUrl}
        />
      ) : (
        <View className="discover-card__evidence-dot" />
      )}
      <Text>{labelMap[level]}</Text>
    </View>
  );
}

function getFundingToneClass(fundingStatusSummary: string) {
  if (fundingStatusSummary === "当前垫付已覆盖") {
    return "discover-card__funding--covered";
  }

  if (fundingStatusSummary === "即将筹满") {
    return "discover-card__funding--almost";
  }

  return "discover-card__funding--pressure";
}

function getProgressWidth(percent: number) {
  return `${Math.min(Math.max(percent, 0), 100)}%`;
}

export default function DiscoverPage() {
  const [keyword, setKeyword] = useState("");
  const [cards, setCards] = useState<HomepageCaseCardVM[]>([]);
  const [loading, setLoading] = useState(true);

  useDidShow(() => {
    setLoading(true);
    loadHomepageCaseCardVMs()
      .then((nextCards) => {
        setCards(nextCards);
      })
      .catch(() => {
        Taro.showToast({
          title: "案例列表加载失败",
          icon: "none",
        });
      })
      .finally(() => {
        setLoading(false);
      });
  });

  const goToGuestDetail = (caseId: string) => {
    Taro.navigateTo({
      url: `/pages/rescue/detail/index?id=${caseId}&mode=guest`,
    });
  };

  const handleSearch = async () => {
    const value = keyword.trim();

    if (!value) {
      Taro.showToast({
        title: "请输入案例 ID",
        icon: "none",
      });
      return;
    }

    const bundle = await searchCaseByPublicIdExact(value);

    if (!bundle) {
      Taro.showToast({
        title: "没有找到这个案例 ID",
        icon: "none",
      });
      return;
    }

    goToGuestDetail(bundle.case.id);
  };

  return (
    <View className="page-shell discover-page">
      <NavBar title="救猫咪" />

      <View className="discover-page__search">
        <View className="discover-page__search-icon" onTap={handleSearch}>
          <Image
            className="discover-page__search-icon-image"
            mode="aspectFit"
            src={searchIconUrl}
          />
        </View>
        <Input
          className="discover-page__search-input"
          confirmType="search"
          maxlength={16}
          placeholder="搜索案例ID，如JM482731..."
          value={keyword}
          onConfirm={handleSearch}
          onInput={(event) => setKeyword(event.detail.value)}
        />
      </View>

      <View className="discover-page__list">
        {loading ? (
          <Text className="discover-page__empty">正在加载案例...</Text>
        ) : null}

        {cards.map((item) => (
          <View
            key={item.caseId}
            className="discover-card theme-card"
            onTap={() => goToGuestDetail(item.caseId)}
          >
              <View className="discover-card__cover">
              {item.coverImageUrl ? (
                <Image
                  className="discover-card__cover-image"
                  mode="aspectFill"
                  src={item.coverImageUrl}
                />
              ) : null}
              <View className="discover-card__status">
                <Text className="discover-card__status-emoji">
                  {getStatusEmoji(item.statusLabel)}
                </Text>
                <Text className="discover-card__status-text">{item.statusLabel}</Text>
              </View>
            </View>

            <View className="discover-card__body">
              <View className="discover-card__title-row">
                <Text className="discover-card__title">{item.title}</Text>
                <Text className="discover-card__id">ID: {item.publicCaseId}</Text>
              </View>

              <View className="discover-card__copy-group">
                <Text className="discover-card__line">
                  <Text className="discover-card__line-label">关于我：</Text>
                  <Text>{item.aboutSummary}</Text>
                </Text>

                <Text className="discover-card__line">
                  <Text className="discover-card__line-label">当前进展：</Text>
                  <Text>{item.latestStatusSummary}</Text>
                </Text>
              </View>

              <View className="discover-card__ledger-head">
                <Text className="discover-card__budget">总预算 {item.targetAmountLabel}</Text>
                <Text
                  className={`discover-card__funding ${getFundingToneClass(item.fundingStatusSummary)}`}
                >
                  {item.fundingStatusSummary}
                </Text>
              </View>

              <View className="discover-card__progress">
                <View
                  className="discover-card__progress-advance"
                  style={{
                    width: getProgressWidth(
                      item.supportedProgressPercent + item.rescuerAdvanceProgressPercent,
                    ),
                  }}
                />
                <View
                  className="discover-card__progress-fill"
                  style={{ width: getProgressWidth(item.supportedProgressPercent) }}
                />
              </View>

              <View className="discover-card__ledger-meta">
                <View className="discover-card__ledger-meta-item">
                  <View className="discover-card__ledger-meta-dot discover-card__ledger-meta-dot--brand" />
                  <Text className="discover-card__ledger-meta-label">已确认支持</Text>
                  <Text className="discover-card__ledger-meta-value">{item.supportedAmountLabel}</Text>
                </View>
                <View className="discover-card__ledger-meta-item discover-card__ledger-meta-item--end">
                  <View className="discover-card__ledger-meta-dot discover-card__ledger-meta-dot--slate" />
                  <Text className="discover-card__ledger-meta-label">已确认垫付</Text>
                  <Text className="discover-card__ledger-meta-value">{item.rescuerAdvanceAmountLabel}</Text>
                </View>
              </View>

              <View className="discover-card__footer">
                <EvidenceLabel level={item.evidenceLevel} />
                <Text className="discover-card__updated">{item.updatedAtLabel}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
