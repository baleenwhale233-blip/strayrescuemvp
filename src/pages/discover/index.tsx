import { Input, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useState } from "react";
import { AppIcon } from "../../components/AppIcon";
import { DiscoverCaseCard } from "../../components/rescue";
import { NavBar } from "../../components/NavBar";
import { EmptyState, PageShell } from "../../components/ui";
import {
  loadHomepageCaseCardVMs,
  searchCaseByPublicIdExact,
  type HomepageCaseCardVM,
} from "../../domain/canonical/repository";
import "./index.scss";

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
    <PageShell className="discover-page">
      <NavBar title="发现" />

      <View className="discover-page__search">
        <View className="discover-page__search-icon" onTap={handleSearch}>
          <AppIcon
            className="discover-page__search-icon-image"
            name="search"
            size={18}
            variant="muted"
          />
        </View>
        <Input
          className="discover-page__search-input"
          confirmType="search"
          maxlength={16}
          placeholder="输入案例 ID，如 JM482731"
          value={keyword}
          onConfirm={handleSearch}
          onInput={(event) => setKeyword(event.detail.value)}
        />
      </View>

      <View className="discover-page__list">
        {loading ? (
          <EmptyState
            className="discover-page__empty"
            iconName="fileText"
            title="正在加载记录"
            description="正在整理可以公开查看的救助档案。"
          />
        ) : null}

        {cards.map((item) => (
          <DiscoverCaseCard
            key={item.caseId}
            item={item}
            onTap={() => goToGuestDetail(item.caseId)}
          />
        ))}
      </View>
    </PageShell>
  );
}
