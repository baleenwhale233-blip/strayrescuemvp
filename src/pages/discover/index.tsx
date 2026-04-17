import { Image, Input, Text, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useState } from "react";
import { DiscoverCaseCard } from "../../components/DiscoverCaseCard";
import { NavBar } from "../../components/NavBar";
import searchIcon from "../../assets/icons/search-muted-18.svg";
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
    <View className="page-shell discover-page">
      <NavBar title="救猫咪" />

      <View className="discover-page__search">
        <View className="discover-page__search-icon" onTap={handleSearch}>
          <Image
            className="discover-page__search-icon-image"
            mode="aspectFit"
            src={searchIcon}
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
          <DiscoverCaseCard
            key={item.caseId}
            item={item}
            onTap={() => goToGuestDetail(item.caseId)}
          />
        ))}
      </View>
    </View>
  );
}
