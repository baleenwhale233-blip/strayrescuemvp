import { Text, View } from "@tarojs/components";
import Taro, { useDidShow, useRouter } from "@tarojs/taro";
import { useState } from "react";
import { NavBar } from "../../../components/NavBar";
import {
  loadPublicDetailVMByCaseId,
  reviewRemoteSupportEntryByCaseId,
} from "../../../domain/canonical/repository";
import type { PublicDetailVM } from "../../../domain/canonical/types";
import "./index.scss";

export default function SupportReviewPage() {
  const router = useRouter();
  const caseId = router.params?.id || router.params?.caseId;
  const [reloadSeed, setReloadSeed] = useState(0);
  const [detail, setDetail] = useState<PublicDetailVM | undefined>();

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
      Taro.showToast({ title: "已确认到账", icon: "none" });
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
      Taro.showToast({ title: "已标记为未匹配", icon: "none" });
      await reloadDetail();
      setReloadSeed((value) => value + 1);
    } catch {
      Taro.showToast({ title: "标记失败，请稍后重试", icon: "none" });
    }
  };

  return (
    <View key={reloadSeed} className="page-shell support-review-page">
      <NavBar showBack title="待确认支持" />

      <View className="support-review-page__tabs">
        <View className="support-review-page__tab support-review-page__tab--active">
          <Text>待确认支持</Text>
          <View className="support-review-page__badge">
            <Text>{detail.supportSummary.pendingSupportEntryCount}</Text>
          </View>
        </View>
        <View
          className="support-review-page__tab"
          onTap={() => Taro.showToast({ title: "手动记一笔待接入", icon: "none" })}
        >
          <Text>手动记一笔</Text>
        </View>
      </View>

      <View className="support-review-page__list">
        {detail.supportSummary.threads.flatMap((thread) =>
          thread.entries
            .filter((entry) => entry.status === "pending")
            .map((entry) => (
              <View key={entry.id} className="support-review-page__card theme-card">
                <View className="support-review-page__card-top">
                  <View className="support-review-page__proof">
                    <View className="support-review-page__proof-screen">
                      <Text className="support-review-page__proof-screen-title">Successful</Text>
                    </View>
                  </View>

                  <View className="support-review-page__card-copy">
                    <View className="support-review-page__card-head">
                      <Text className="support-review-page__card-name">
                        {thread.supporterNameMasked || "爱心人士"}
                      </Text>
                      <Text className="support-review-page__card-time">
                        {thread.latestEntryAtLabel}
                      </Text>
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
                    <Text>疑似重复</Text>
                  </View>
                  <View
                    className="support-review-page__button support-review-page__button--ghost"
                    onTap={() => handleUnmatched(entry.id, "other")}
                  >
                    <Text>暂未匹配</Text>
                  </View>
                  <View
                    className="support-review-page__button support-review-page__button--primary"
                    onTap={() => handleConfirm(entry.id)}
                  >
                    <Text>确认收到</Text>
                  </View>
                </View>
              </View>
            )),
        )}
      </View>
    </View>
  );
}
