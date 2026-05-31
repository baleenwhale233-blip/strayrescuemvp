import Taro, { useDidShow, useRouter } from "@tarojs/taro";
import { useState } from "react";
import { NavBar } from "../../../components/NavBar";
import { type RescueReadonlyRecordDetail } from "../../../components/rescue";
import { EmptyState, PageShell } from "../../../components/ui";
import {
  loadCaseRecordDetail,
  type CaseRecordDetailVM,
} from "../../../domain/canonical/repository";
import { RecordDetailCard } from "./components/RecordDetailCard";
import { RecordDetailNotice } from "./components/RecordDetailNotice";
import { getStoredReadonlyRecordDetail } from "./readonlyRecordDetail";
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
    images: record.images
      .map((image) => image.url)
      .filter(Boolean)
      .slice(0, 9),
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
      <PageShell className="record-detail-page">
        <NavBar showBack title="记录详情" />
        <EmptyState
          className="record-detail-page__empty"
          description="请返回记录明细后重新打开。"
          iconName="fileText"
          title="暂未找到记录"
        />
      </PageShell>
    );
  }

  return (
    <PageShell className="record-detail-page">
      <NavBar showBack title={getPageTitle(record.kind)} />

      <RecordDetailNotice description={getImmutableCopy(record.kind)} />
      <RecordDetailCard
        expenseItems={getExpenseItems(record)}
        record={record}
        onImageTap={handlePreviewImage}
      />
    </PageShell>
  );
}
