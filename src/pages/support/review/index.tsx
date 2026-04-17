import { Image, Input, Text, View } from "@tarojs/components";
import Taro, { useDidShow, useRouter } from "@tarojs/taro";
import { useEffect, useState } from "react";
import { NavBar } from "../../../components/NavBar";
import { showSuccessFeedback } from "../../../utils/successFeedback";
import paymentReceiptExact from "../../../assets/support-review/payment-receipt-exact.png";
import submitArrowIcon from "../../../assets/support-claim/submit-arrow-19.svg";
import { markCaseDetailRefresh } from "../../../data/caseDetailRefresh";
import {
  createRemoteManualSupportEntryByCaseId,
  loadPublicDetailVMByCaseId,
  reviewRemoteSupportEntryByCaseId,
} from "../../../domain/canonical/repository";
import type { PublicDetailVM } from "../../../domain/canonical/types";
import "./index.scss";

type ReviewTab = "pending" | "manual";

export default function SupportReviewPage() {
  const router = useRouter();
  const caseId = router.params?.id || router.params?.caseId;
  const requestedTab = router.params?.tab === "manual" ? "manual" : "pending";
  const [reloadSeed, setReloadSeed] = useState(0);
  const [detail, setDetail] = useState<PublicDetailVM | undefined>();
  const [activeTab, setActiveTab] = useState<ReviewTab>(requestedTab);
  const [manualAmount, setManualAmount] = useState("");
  const [manualSupporter, setManualSupporter] = useState("");

  useEffect(() => {
    setActiveTab(requestedTab);
  }, [requestedTab]);

  const reloadDetail = async () => {
    const nextDetail = await loadPublicDetailVMByCaseId(caseId);
    setDetail(nextDetail);
  };

  useDidShow(() => {
    setReloadSeed((value) => value + 1);
    reloadDetail().catch(() => {
      Taro.showToast({
        title: "待确认支持加载失败",
        icon: "none",
      });
    });
  });

  if (!detail || !caseId) {
    return null;
  }

  const handleConfirm = async (entryId: string) => {
    try {
      await reviewRemoteSupportEntryByCaseId(caseId, {
        entryId,
        status: "confirmed",
      });
      markCaseDetailRefresh(caseId);
      showSuccessFeedback({
        title: "已确认到账",
        navigateBack: false,
      });
      await reloadDetail();
      setReloadSeed((value) => value + 1);
    } catch {
      Taro.showToast({ title: "确认失败，请稍后重试", icon: "none" });
    }
  };

  const handleUnmatched = async (
    entryId: string,
    reason: "duplicate_submission" | "other",
  ) => {
    try {
      await reviewRemoteSupportEntryByCaseId(caseId, {
        entryId,
        status: "unmatched",
        reason,
        note: reason === "duplicate_submission" ? "疑似重复提交" : "暂未匹配",
      });
      markCaseDetailRefresh(caseId);
      showSuccessFeedback({
        title: "已标记未匹配",
        navigateBack: false,
      });
      await reloadDetail();
      setReloadSeed((value) => value + 1);
    } catch {
      Taro.showToast({ title: "标记失败，请稍后重试", icon: "none" });
    }
  };

  const handleSubmitManual = async () => {
    const numericAmount = Number(manualAmount);

    if (!numericAmount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      Taro.showToast({ title: "请填写支持金额", icon: "none" });
      return;
    }

    try {
      Taro.showLoading({ title: "提交中" });
      await createRemoteManualSupportEntryByCaseId(caseId, {
        supporterNameMasked: manualSupporter.trim() || "线下支持",
        amount: numericAmount,
        supportedAt: new Date().toISOString(),
        note: "救助人手动记一笔",
      });
      markCaseDetailRefresh(caseId);
      Taro.hideLoading();
      showSuccessFeedback({
        title: "收入已记入账本",
      });
      setManualAmount("");
      setManualSupporter("");
    } catch {
      Taro.hideLoading();
      Taro.showToast({ title: "提交失败，请稍后重试", icon: "none" });
    }
  };

  const pendingEntries = detail.supportSummary.threads.flatMap((thread) =>
    thread.entries
      .filter((entry) => entry.status === "pending")
      .map((entry) => ({
        threadId: thread.id,
        supporterName: thread.supporterNameMasked || "爱心人士",
        latestEntryAtLabel: thread.latestEntryAtLabel,
        entry,
      })),
  );

  return (
    <View key={reloadSeed} className="page-shell support-review-page">
      <NavBar showBack title="记场外收入" />

      <View className="support-review-page__tabs">
        <View
          className={`support-review-page__tab ${
            activeTab === "pending" ? "support-review-page__tab--active" : ""
          }`}
          onTap={() => setActiveTab("pending")}
        >
          <Text>待确认认领</Text>
          {activeTab === "pending" ? (
            <View className="support-review-page__badge">
              <Text>{detail.supportSummary.pendingSupportEntryCount}</Text>
            </View>
          ) : null}
        </View>
        <View
          className={`support-review-page__tab ${
            activeTab === "manual" ? "support-review-page__tab--active" : ""
          }`}
          onTap={() => setActiveTab("manual")}
        >
          <Text>手动记一笔</Text>
        </View>
      </View>

      {activeTab === "pending" ? (
        <View className="support-review-page__list">
          {pendingEntries.map(({ supporterName, latestEntryAtLabel, entry }) => (
            <View key={entry.id} className="support-review-page__card theme-card">
              <View className="support-review-page__card-top">
                <View className="support-review-page__proof">
                  <Image
                    className="support-review-page__proof-image"
                    mode="aspectFill"
                    src={paymentReceiptExact}
                  />
                </View>

                <View className="support-review-page__card-copy">
                  <View className="support-review-page__card-head">
                    <Text className="support-review-page__card-name">{supporterName}</Text>
                    <Text className="support-review-page__card-time">{latestEntryAtLabel}</Text>
                  </View>
                  <Text className="support-review-page__card-amount">{entry.amountLabel}</Text>
                  <Text className="support-review-page__card-note">
                    “{entry.note || "给流浪猫猫买点好罐头..."}”
                  </Text>
                </View>
              </View>

              <View className="support-review-page__actions">
                <View
                  className="support-review-page__button support-review-page__button--ghost"
                  onTap={() => handleUnmatched(entry.id, "duplicate_submission")}
                >
                  <Text>标记重复</Text>
                </View>
                <View className="support-review-page__actions-right">
                  <View
                    className="support-review-page__button support-review-page__button--ghost"
                    onTap={() => handleUnmatched(entry.id, "other")}
                  >
                    <Text>驳回</Text>
                  </View>
                  <View
                    className="support-review-page__button support-review-page__button--primary"
                    onTap={() => handleConfirm(entry.id)}
                  >
                    <Text>确认到账</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}

          {!pendingEntries.length ? (
            <View className="support-review-page__empty theme-card">
              <Text className="support-review-page__empty-title">暂时没有待确认认领</Text>
              <Text className="support-review-page__empty-copy">
                新的支持登记提交后，会先出现在这里等待你确认。
              </Text>
            </View>
          ) : null}
        </View>
      ) : (
        <View className="support-review-page__manual">
          <View className="support-review-page__field">
            <Text className="support-review-page__label">支持金额</Text>
            <View className="support-review-page__amount-wrap">
              <Text className="support-review-page__currency">¥</Text>
              <Input
                className="support-review-page__input support-review-page__input--amount"
                type="digit"
                placeholder="0.00"
                value={manualAmount}
                onInput={(event) => setManualAmount(event.detail.value)}
              />
            </View>
          </View>

          <View className="support-review-page__field">
            <Text className="support-review-page__label">支持者称呼</Text>
            <Input
              className="support-review-page__input"
              placeholder="微信ID/昵称等"
              value={manualSupporter}
              onInput={(event) => setManualSupporter(event.detail.value)}
            />
          </View>

          <View className="support-review-page__manual-bottom">
            <View
              className="support-review-page__submit theme-button-primary"
              onTap={handleSubmitManual}
            >
              <Text>提交支持</Text>
              <Image
                className="support-review-page__submit-arrow"
                mode="aspectFit"
                src={submitArrowIcon}
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
