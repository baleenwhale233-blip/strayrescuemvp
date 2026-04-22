import { Image, Text, View } from "@tarojs/components";
import Taro, { useDidShow, useRouter } from "@tarojs/taro";
import { useState } from "react";
import { NavBar } from "../../../components/NavBar";
import {
  getStoredReadonlyRecordDetail,
  type RescueReadonlyRecordDetail,
} from "../../../components/RescueTimelineShared";
import {
  loadCaseRecordDetail,
  type CaseRecordDetailVM,
} from "../../../domain/canonical/repository";
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
    return "进展发布后不可修改。记录过程会按时间留下痕迹，后续变化请继续发布新的更新。";
  }

  return "这条记录提交后不可修改，后续变化请新增记录保留完整轨迹。";
}

function formatItemAmount(amount?: number) {
  return typeof amount === "number" ? `¥${amount.toLocaleString("zh-CN")}` : undefined;
}

function mapRemoteRecordToReadonly(record: CaseRecordDetailVM): RescueReadonlyRecordDetail {
  const kindMap = {
    expense: "expense",
    progress_update: "status",
    budget_adjustment: "budget",
    support: "support",
  } as const;

  return {
    id: record.id,
    caseId: record.caseId,
    recordType: record.recordType,
    recordId: record.id,
    kind: kindMap[record.recordType],
    badgeLabel:
      record.recordType === "expense"
        ? "支出记录"
        : record.recordType === "progress_update"
          ? "状态更新"
          : record.recordType === "budget_adjustment"
            ? "预算调整"
            : "场外收入",
    timestamp: record.occurredAtLabel,
    title: record.title,
    description: record.description,
    amountLabel: record.amountLabel,
    expenseItems: record.expenseItems?.map((item) => ({
      description: item.description,
      amountLabel: formatItemAmount(item.amount),
    })),
    images: record.images.map((image) => image.url).filter(Boolean).slice(0, 9),
    budgetPreviousLabel: record.budgetPreviousLabel,
    budgetCurrentLabel: record.budgetCurrentLabel,
  };
}

function getExpenseItems(record: RescueReadonlyRecordDetail) {
  if (record.expenseItems?.length) {
    return record.expenseItems;
  }

  const title = record.title;
  const normalized = title.replace(/^支付[:：]\s*/, "").trim();
  if (!normalized) {
    return [];
  }

  return normalized
    .split(/\s+\+\s+|[+＋]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function RescueReadonlyRecordDetailPage() {
  const router = useRouter();
  const [record, setRecord] = useState<RescueReadonlyRecordDetail | undefined>();

  useDidShow(() => {
    const { caseId, recordType, id } = router.params;
    const stored = getStoredReadonlyRecordDetail();

    if (caseId && recordType && id) {
      loadCaseRecordDetail({
        caseId,
        recordType: recordType as CaseRecordDetailVM["recordType"],
        recordId: id,
      })
        .then((remoteRecord) => {
          setRecord(remoteRecord ? mapRemoteRecordToReadonly(remoteRecord) : stored);
        })
        .catch((error) => {
          if (error instanceof Error && error.message === "FORBIDDEN") {
            setRecord(undefined);
            return;
          }

          setRecord(stored);
        });
      return;
    }

    setRecord(stored);
  });

  const handlePreviewImage = (current: string) => {
    if (!record?.images?.length) {
      return;
    }

    Taro.previewImage({
      current,
      urls: record.images,
    });
  };

  if (!record) {
    return (
      <View className="page-shell record-detail-page">
        <NavBar showBack title="记录详情" />
        <View className="record-detail-page__empty">
          <Text className="record-detail-page__empty-title">暂未找到记录</Text>
          <Text className="record-detail-page__empty-copy">请返回记录明细后重新打开。</Text>
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

        {record.kind === "expense" ? (
          <View className="record-detail-page__expense-lines">
            {getExpenseItems(record).map((item, index) => (
              <View
                key={`${typeof item === "string" ? item : item.description}-${index}`}
                className="record-detail-page__expense-line"
              >
                <Text className="record-detail-page__expense-index">
                  支出 {String(index + 1).padStart(2, "0")}
                </Text>
                <Text className="record-detail-page__expense-title">
                  {typeof item === "string" ? item : item.description}
                </Text>
                {typeof item !== "string" && item.amountLabel ? (
                  <Text className="record-detail-page__expense-index">{item.amountLabel}</Text>
                ) : null}
              </View>
            ))}
          </View>
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
            {record.images.map((src, index) => (
              <View
                key={`${src}-${index}`}
                className="record-detail-page__image-wrap"
                onTap={() => handlePreviewImage(src)}
              >
                <Image className="record-detail-page__image" mode="aspectFill" src={src} />
                <Text className="record-detail-page__image-count">
                  {index + 1}/{record.images?.length || 1}
                </Text>
                <Text className="record-detail-page__watermark">透明账本·严禁盗用</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}
