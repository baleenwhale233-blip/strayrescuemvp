import { Button, Image, Text, View } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useState } from "react";
import { NavBar } from "../../../../components/NavBar";
import copyWhiteIcon from "../../../../assets/rescue-detail/copy-white-12.svg";
import evidenceCompleteOrangeIcon from "../../../../assets/rescue-detail/evidence-complete-orange-14.svg";
import infoMutedIcon from "../../../../assets/rescue-detail/info-muted-13.svg";
import shareMutedIcon from "../../../../assets/rescue-detail/share-muted-18.svg";
import type { PublicDetailVM } from "../../../../domain/canonical/types";
import { getFundingStatusText, getHeroImage, getRescuerAvatar } from "../detailViewModels";
import type { DetailTab } from "../types";
import { GuestDetailTimeline } from "./GuestDetailTimeline";
import { GuestOverview } from "./GuestOverview";

export function GuestDetail({
  detail,
  onSupport,
  onClaim,
}: {
  detail: PublicDetailVM;
  onSupport: () => void;
  onClaim: () => void;
}) {
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");

  return (
    <View className="detail-page detail-page--guest">
      <NavBar showBack title="记录明细" />

      <View className="guest-hero">
        <Image className="guest-hero__image" mode="aspectFill" src={getHeroImage(detail)} />
        <View className="guest-hero__mask" />
        <View className="guest-hero__content">
          <View className="guest-hero__status">
            <View className="guest-hero__status-icon">
              <Text className="guest-hero__status-emoji">🏥</Text>
            </View>
            <Text className="guest-hero__status-text">{detail.statusLabel}</Text>
          </View>
          <Text className="guest-hero__title">{detail.title}</Text>
          <View className="guest-hero__id-row">
            <Text className="guest-hero__id">ID: {detail.publicCaseId}</Text>
            <View
              className="guest-hero__copy"
              onTap={() => {
                Taro.setClipboardData({ data: detail.publicCaseId });
              }}
            >
              <Image className="guest-hero__copy-icon" mode="aspectFit" src={copyWhiteIcon} />
            </View>
          </View>
          <View className="guest-hero__evidence">
            <Image
              className="guest-hero__evidence-icon"
              mode="aspectFit"
              src={evidenceCompleteOrangeIcon}
            />
            <Text>记录和凭证较齐</Text>
          </View>
        </View>
      </View>

      <View className="detail-page__body">
        <View className="detail-card theme-card">
          <View className="detail-card__head">
            <Text className="detail-card__title">记录资金状态</Text>
            <Image className="detail-card__info-icon" mode="aspectFit" src={infoMutedIcon} />
          </View>

          <View className="detail-card__budget-row">
            <Text className="detail-card__budget-text">
              总预算 {detail.ledger.targetAmountLabel}
            </Text>
          </View>

          <View className="detail-card__progress">
            <View
              className="detail-card__progress-fill"
              style={{ width: `${Math.min(detail.ledger.progressPercent, 100)}%` }}
            />
          </View>

          <View className="detail-card__metric">
            <View className="detail-card__metric-label">
              <View className="detail-card__metric-dot detail-card__metric-dot--slate" />
              <Text>当前垫付</Text>
            </View>
            <Text className="detail-card__metric-value">
              {detail.ledger.confirmedExpenseAmountLabel}
            </Text>
          </View>
          <View className="detail-card__metric">
            <View className="detail-card__metric-label">
              <View className="detail-card__metric-dot detail-card__metric-dot--brand" />
              <Text>已确认登记</Text>
            </View>
            <Text className="detail-card__metric-value detail-card__metric-value--brand">
              {detail.ledger.supportedAmountLabel}
            </Text>
          </View>
          <View className="detail-card__metric">
            <View className="detail-card__metric-label">
              <View className="detail-card__metric-dot detail-card__metric-dot--danger" />
              <Text>当前差额</Text>
            </View>
            <Text className="detail-card__metric-value detail-card__metric-value--danger">
              {detail.ledger.verifiedGapAmountLabel}
            </Text>
          </View>

          <View className="detail-card__notice">
            <Text>{getFundingStatusText(detail)}</Text>
          </View>
        </View>

        <View className="rescuer-card theme-card">
          <Image
            className="rescuer-card__avatar"
            mode="aspectFill"
            src={getRescuerAvatar(detail)}
          />
          <View className="rescuer-card__body">
            <Text className="rescuer-card__name">{detail.rescuer.name}</Text>
            <Text className="rescuer-card__meta">
              已建立 {detail.rescuer.stats.publishedCaseCount} 份记录档案 ·{" "}
              {detail.rescuer.stats.verifiedReceiptCount} 张真实凭证
            </Text>
          </View>
          {detail.rescuer.profileEntryEnabled ? (
            <View
              className="rescuer-card__link"
              onTap={() =>
                Taro.navigateTo({
                  url: `/pages/rescuer/home/index?rescuerId=${detail.rescuer.id}&caseId=${detail.caseId}`,
                })
              }
            >
              <Text>查看主页</Text>
            </View>
          ) : null}
        </View>

        <View className="detail-tabs">
          <View
            className={`detail-tabs__item ${
              activeTab === "overview" ? "detail-tabs__item--active" : ""
            }`}
            onTap={() => setActiveTab("overview")}
          >
            <Text>记录摘要</Text>
          </View>
          <View
            className={`detail-tabs__item ${
              activeTab === "detail" ? "detail-tabs__item--active" : ""
            }`}
            onTap={() => setActiveTab("detail")}
          >
            <Text>记录详情</Text>
          </View>
        </View>

        {activeTab === "overview" ? (
          <GuestOverview detail={detail} />
        ) : (
          <GuestDetailTimeline detail={detail} />
        )}
      </View>

      <View className="guest-bottom-bar">
        <View className="guest-bottom-bar__inner">
          <Button className="guest-bottom-bar__share" openType="share">
            <Image
              className="guest-bottom-bar__share-icon-image"
              mode="aspectFit"
              src={shareMutedIcon}
            />
            <Text className="guest-bottom-bar__share-text">分享</Text>
          </Button>
          <Button className="guest-bottom-bar__ghost" onTap={onClaim}>
            <Text>登记一笔</Text>
          </Button>
          <Button className="guest-bottom-bar__cta theme-button-primary" onTap={onSupport}>
            <Text>查看联系方式</Text>
          </Button>
        </View>
      </View>
    </View>
  );
}
