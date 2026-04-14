import { Image, Text, View } from "@tarojs/components";
import Taro, { useDidShow, useRouter } from "@tarojs/taro";
import { useState } from "react";
import { NavBar } from "../../../components/NavBar";
import { SupportSheet } from "../../../components/SupportSheet";
import {
  loadOwnerDetailVMByCaseId,
  loadPublicDetailVMByCaseId,
  loadSupportSheetDataByCaseId,
  type OwnerDetailVM,
} from "../../../domain/canonical/repository";
import type {
  PublicDetailVM,
  PublicTimelineItemVM,
  SupportSheetData,
} from "../../../domain/canonical/types";
import "./index.scss";

function getFundingStatusText(detail: PublicDetailVM) {
  const confirmedExpenseAmount = detail.ledger.confirmedExpenseAmount;
  const confirmedSupportAmount = detail.ledger.supportedAmount;

  if (confirmedSupportAmount >= confirmedExpenseAmount) {
    return "当前垫付已覆盖";
  }

  if (confirmedExpenseAmount - confirmedSupportAmount <= 2000) {
    return "即将筹满";
  }

  return "‼️ 救助人垫付较多";
}

function TimelineCard({ item }: { item: PublicTimelineItemVM }) {
  return (
    <View className="timeline-card">
      <View className={`timeline-card__dot timeline-card__dot--${item.tone}`} />
      <View className="timeline-card__content theme-card">
        <View className="timeline-card__head">
          <View className={`timeline-card__badge timeline-card__badge--${item.tone}`}>
            <Text>{item.label}</Text>
          </View>
          <Text className="timeline-card__time">{item.timestampLabel}</Text>
        </View>

        <Text className="timeline-card__title">{item.title}</Text>

        {item.description ? (
          <Text className="timeline-card__description">{item.description}</Text>
        ) : null}

        {item.amountLabel ? (
          <View className="timeline-card__amount-row">
            <Text
              className={`timeline-card__amount ${
                item.type === "support" ? "timeline-card__amount--income" : ""
              }`}
            >
              {item.type === "support" ? "+" : "-"}
              {item.amountLabel}
            </Text>
            {item.type === "expense" ? (
              <View className="timeline-card__link">
                <Text>查看详情</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {item.assetUrls.length ? (
          <View
            className={`timeline-card__images ${
              item.assetUrls.length === 1 ? "timeline-card__images--single" : ""
            }`}
          >
            {item.assetUrls.slice(0, 2).map((asset) => (
              <View key={asset} className="timeline-card__image-wrap">
                <Image className="timeline-card__image" mode="aspectFill" src={asset} />
                <Text className="timeline-card__watermark">透明账本·严禁盗用</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function GuestDetail({
  detail,
  onSupport,
  onClaim,
}: {
  detail: PublicDetailVM;
  onSupport: () => void;
  onClaim: () => void;
}) {
  return (
    <View className="detail-page detail-page--guest">
      <NavBar showBack title="救助详情" />

      <View className="guest-hero">
        {detail.heroImageUrl ? (
          <Image className="guest-hero__image" mode="aspectFill" src={detail.heroImageUrl} />
        ) : null}
        <View className="guest-hero__mask" />
        <View className="guest-hero__content">
          <View className="guest-hero__status">
            <Text className="guest-hero__status-emoji">🏥</Text>
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
              <Text>复制</Text>
            </View>
          </View>
          <View className="guest-hero__evidence">
            <Text className="guest-hero__evidence-dot">•</Text>
            <Text>证据链完整</Text>
          </View>
        </View>
      </View>

      <View className="detail-card theme-card">
        <View className="detail-card__head">
          <Text className="detail-card__title">救助资金状态</Text>
          <Text className="detail-card__info">i</Text>
        </View>

        <View className="detail-card__budget-row">
          <Text className="detail-card__budget-text">总预算 {detail.ledger.targetAmountLabel}</Text>
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
            <Text>已确认支出</Text>
          </View>
          <Text className="detail-card__metric-value">
            {detail.ledger.confirmedExpenseAmountLabel}
          </Text>
        </View>
        <View className="detail-card__metric">
          <View className="detail-card__metric-label">
            <View className="detail-card__metric-dot detail-card__metric-dot--brand" />
            <Text>已确认支持</Text>
          </View>
          <Text className="detail-card__metric-value detail-card__metric-value--brand">
            {detail.ledger.supportedAmountLabel}
          </Text>
        </View>
        <View className="detail-card__metric">
          <View className="detail-card__metric-label">
            <View className="detail-card__metric-dot detail-card__metric-dot--danger" />
            <Text>当前缺口</Text>
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
        {detail.rescuer.avatarUrl ? (
          <Image className="rescuer-card__avatar" mode="aspectFill" src={detail.rescuer.avatarUrl} />
        ) : null}
        <View className="rescuer-card__body">
          <Text className="rescuer-card__name">{detail.rescuer.name}</Text>
          <Text className="rescuer-card__meta">
            已建立 {detail.rescuer.stats.publishedCaseCount} 份透明账本 ·
            {detail.rescuer.stats.verifiedReceiptCount} 张真实凭证
          </Text>
        </View>
        <View
          className="rescuer-card__link"
          onTap={() => Taro.showToast({ title: "救助人主页暂未开放", icon: "none" })}
        >
          <Text>查看主页</Text>
        </View>
      </View>

      <View className="detail-card theme-card">
        <View className="detail-card__head">
          <Text className="detail-card__title">支持记录摘要</Text>
        </View>
        <View className="detail-card__metric">
          <View className="detail-card__metric-label">
            <View className="detail-card__metric-dot detail-card__metric-dot--brand" />
            <Text>已确认支持</Text>
          </View>
          <Text className="detail-card__metric-value detail-card__metric-value--brand">
            {detail.supportSummary.confirmedSupportAmountLabel}
          </Text>
        </View>
        <View className="detail-card__summary-row">
          <Text className="detail-card__summary-label">待处理支持登记</Text>
          <Text className="detail-card__summary-value">
            {detail.supportSummary.pendingSupportEntryCount} 条
          </Text>
        </View>
        <View className="detail-card__summary-row">
          <Text className="detail-card__summary-label">未匹配</Text>
          <Text className="detail-card__summary-value">
            {detail.supportSummary.unmatchedSupportEntryCount} 条
          </Text>
        </View>
      </View>

      <View className="detail-tabs">
        <View className="detail-tabs__item detail-tabs__item--active">
          <Text>救助摘要</Text>
        </View>
        <View className="detail-tabs__item">
          <Text>救助详情</Text>
        </View>
      </View>

      <View className="timeline-list">
        {detail.timeline.map((item) => (
          <TimelineCard key={item.id} item={item} />
        ))}
      </View>

      <View className="guest-bottom-bar">
        <View
          className="guest-bottom-bar__share"
          onTap={() => Taro.showToast({ title: "分享链路待接入", icon: "none" })}
        >
          <Text className="guest-bottom-bar__share-icon">↗</Text>
          <Text className="guest-bottom-bar__share-text">分享</Text>
        </View>
        <View className="guest-bottom-bar__ghost" onTap={onClaim}>
          <Text>我已支持</Text>
        </View>
        <View className="guest-bottom-bar__cta theme-button-primary" onTap={onSupport}>
          <Text>我要支持</Text>
        </View>
      </View>
    </View>
  );
}

function OwnerDetail({
  ownerDetail,
  publicDetail,
}: {
  ownerDetail: OwnerDetailVM;
  publicDetail: PublicDetailVM;
}) {
  const goToManage = () => {
    Taro.navigateTo({
      url: `/pages/support/review/index?id=${ownerDetail.caseId}`,
    });
  };

  return (
    <View className="detail-page detail-page--owner">
      <NavBar showBack title="救助记录管理" />

      <View className="owner-summary theme-card">
        <View className="owner-summary__top">
          {publicDetail.heroImageUrl ? (
            <Image className="owner-summary__cover" mode="aspectFill" src={publicDetail.heroImageUrl} />
          ) : null}
          <View className="owner-summary__copy">
            <View className="owner-summary__title-row">
              <Text className="owner-summary__title">{ownerDetail.title}</Text>
              <Text className="owner-summary__status">{ownerDetail.statusLabel}</Text>
            </View>
            <View className="owner-summary__id-row">
              <Text>ID: {ownerDetail.publicCaseId}</Text>
              <Text>复制</Text>
            </View>
          </View>
        </View>

        <View className="owner-summary__metrics">
          <Text>总预算 {ownerDetail.ledger.targetAmountLabel}</Text>
          <Text>已确认支出 {ownerDetail.ledger.confirmedExpenseAmountLabel}</Text>
          <Text>已确认支持 {ownerDetail.ledger.supportedAmountLabel}</Text>
        </View>
        <View className="detail-card__progress">
          <View
            className="detail-card__progress-fill"
            style={{ width: `${Math.min(publicDetail.ledger.progressPercent, 100)}%` }}
          />
        </View>
        <View className="owner-summary__meta-list">
          <Text>ID: {ownerDetail.publicCaseId}</Text>
          {ownerDetail.homepageEligibilityReason ? (
            <Text>首页资格：{ownerDetail.homepageEligibilityReason}</Text>
          ) : null}
          <Text>待处理支持：{ownerDetail.pendingSupportEntryCount || 0} 条</Text>
          <Text>未匹配：{ownerDetail.unmatchedSupportEntryCount || 0} 条</Text>
        </View>
      </View>

      <View className="owner-actions">
        <View className="owner-actions__primary" onTap={() => Taro.showToast({ title: "记一笔支出待接入", icon: "none" })}>
          <Text className="owner-actions__primary-title">记一笔支出</Text>
        </View>
        <View className="owner-actions__grid">
          <View className="owner-actions__card" onTap={() => Taro.showToast({ title: "写进展更新待接入", icon: "none" })}>
            <Text className="owner-actions__card-title">写进展更新</Text>
            <Text className="owner-actions__card-subtitle">添加照片及阶段状态</Text>
          </View>
          <View className="owner-actions__card owner-actions__card--purple" onTap={goToManage}>
            <Text className="owner-actions__card-title">记场外收入</Text>
            <Text className="owner-actions__card-subtitle">审核支持者私下转账</Text>
          </View>
          <View className="owner-actions__wide" onTap={() => Taro.showToast({ title: "追加预算待接入", icon: "none" })}>
            <Text className="owner-actions__card-title">追加预算</Text>
          </View>
        </View>
      </View>

      <View className="detail-tabs">
        <View className="detail-tabs__item">
          <Text>救助摘要</Text>
        </View>
        <View className="detail-tabs__item detail-tabs__item--active">
          <Text>救助详情</Text>
        </View>
      </View>

      <View className="timeline-list">
        {publicDetail.timeline.map((item) => (
          <TimelineCard key={item.id} item={item} />
        ))}
      </View>

      <View className="owner-finish">
        <View className="owner-finish__swipe">
          <View className="owner-finish__handle">
            <Text>›</Text>
          </View>
          <Text className="owner-finish__swipe-text">右滑结束求助</Text>
        </View>
        <Text className="owner-finish__hint">
          确认已被领养或救助已完成时，请滑动结束项目
        </Text>
      </View>
    </View>
  );
}

export default function RescueDetailPage() {
  const router = useRouter();
  const [supportOpen, setSupportOpen] = useState(false);
  const [reloadSeed, setReloadSeed] = useState(0);
  const [publicDetail, setPublicDetail] = useState<PublicDetailVM | undefined>();
  const [ownerDetail, setOwnerDetail] = useState<OwnerDetailVM | undefined>();
  const [supportData, setSupportData] = useState<SupportSheetData | undefined>();
  const mode = router.params?.mode === "guest" ? "guest" : "owner";
  const caseId = router.params?.id;

  useDidShow(() => {
    setReloadSeed((value) => value + 1);
    Promise.all([
      loadPublicDetailVMByCaseId(caseId),
      mode === "owner" ? loadOwnerDetailVMByCaseId(caseId) : Promise.resolve(undefined),
      loadSupportSheetDataByCaseId(caseId),
    ])
      .then(([nextPublicDetail, nextOwnerDetail, nextSupportData]) => {
        setPublicDetail(nextPublicDetail);
        setOwnerDetail(nextOwnerDetail);
        setSupportData(nextSupportData);
      })
      .catch(() => {
        Taro.showToast({
          title: "详情加载失败",
          icon: "none",
        });
      });
  });

  if (!publicDetail) {
    return null;
  }

  return (
    <View key={reloadSeed} className="page-shell detail-page-shell">
      {mode === "guest" ? (
        <GuestDetail
          detail={publicDetail}
          onSupport={() => setSupportOpen(true)}
          onClaim={() =>
            Taro.navigateTo({
              url: `/pages/support/claim/index?id=${publicDetail.caseId}`,
            })
          }
        />
      ) : ownerDetail ? (
        <OwnerDetail ownerDetail={ownerDetail} publicDetail={publicDetail} />
      ) : null}

      {supportData ? (
        <SupportSheet
          visible={supportOpen}
          support={supportData}
          onClose={() => setSupportOpen(false)}
        />
      ) : null}
    </View>
  );
}
