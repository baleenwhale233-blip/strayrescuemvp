import { Image, Text, View } from "@tarojs/components";
import { useDidShow } from "@tarojs/taro";
import { useState } from "react";
import { NavBar } from "../../../components/NavBar";
import {
  getStoredReadonlyRecordDetail,
  type RescueReadonlyRecordDetail,
} from "../../../components/RescueTimelineShared";
import "./index.scss";

function getPageTitle(kind?: RescueReadonlyRecordDetail["kind"]) {
  if (kind === "status") {
    return "进展更新";
  }

  if (kind === "expense") {
    return "支出详情";
  }

  if (kind === "budget") {
    return "预算调整";
  }

  return "记录详情";
}

function getImmutableCopy(kind?: RescueReadonlyRecordDetail["kind"]) {
  if (kind === "expense") {
    return "支出记录提交后不可修改，避免账目对不上。若后续金额或用途发生变化，请新增一条更正记录。";
  }

  if (kind === "status") {
    return "进展更新提交后不可修改。救助过程会按时间留下痕迹，后续变化请继续发布新的更新。";
  }

  return "这条记录提交后不可修改，后续变化请新增记录保留完整轨迹。";
}

export default function RescueReadonlyRecordDetailPage() {
  const [record, setRecord] = useState<RescueReadonlyRecordDetail | undefined>();

  useDidShow(() => {
    setRecord(getStoredReadonlyRecordDetail());
  });

  if (!record) {
    return (
      <View className="page-shell record-detail-page">
        <NavBar showBack title="记录详情" />
        <View className="record-detail-page__empty">
          <Text className="record-detail-page__empty-title">暂未找到记录</Text>
          <Text className="record-detail-page__empty-copy">请返回救助详情后重新打开。</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="page-shell record-detail-page">
      <NavBar showBack title={getPageTitle(record.kind)} />

      <View className="record-detail-page__notice">
        <Text className="record-detail-page__notice-title">透明账本记录</Text>
        <Text className="record-detail-page__notice-copy">
          {getImmutableCopy(record.kind)}
        </Text>
      </View>

      <View className="record-detail-page__card">
        <View className="record-detail-page__header">
          <View className={`record-detail-page__badge record-detail-page__badge--${record.kind}`}>
            <Text>{record.badgeLabel}</Text>
          </View>
          {record.statusLabel ? (
            <View className="record-detail-page__badge record-detail-page__badge--case">
              <Text>{record.statusLabel}</Text>
            </View>
          ) : null}
          <Text className="record-detail-page__time">{record.timestamp}</Text>
        </View>

        <Text className="record-detail-page__title">{record.title}</Text>

        {record.description ? (
          <Text className="record-detail-page__description">{record.description}</Text>
        ) : null}

        {record.amountLabel ? (
          <View className="record-detail-page__row">
            <Text className="record-detail-page__label">金额</Text>
            <Text className="record-detail-page__amount">{record.amountLabel}</Text>
          </View>
        ) : null}

        {record.budgetPreviousLabel && record.budgetCurrentLabel ? (
          <View className="record-detail-page__budget">
            <View className="record-detail-page__budget-column">
              <Text className="record-detail-page__label">原预算总计</Text>
              <Text className="record-detail-page__budget-old">
                {record.budgetPreviousLabel}
              </Text>
            </View>
            <View className="record-detail-page__budget-column">
              <Text className="record-detail-page__label">现预算总计</Text>
              <Text className="record-detail-page__budget-new">
                {record.budgetCurrentLabel}
              </Text>
            </View>
          </View>
        ) : null}

        {record.images?.length ? (
          <View
            className={`record-detail-page__images ${
              record.images.length === 1 ? "record-detail-page__images--single" : ""
            }`}
          >
            {record.images.map((src) => (
              <View key={src} className="record-detail-page__image-wrap">
                <Image className="record-detail-page__image" mode="aspectFill" src={src} />
                <Text className="record-detail-page__watermark">透明账本·严禁盗用</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}
