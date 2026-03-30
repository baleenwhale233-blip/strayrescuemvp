import { Image, Input, Text, Textarea, View } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { useEffect, useMemo, useState } from "react";
import { AppIcon } from "../../../../components/AppIcon";
import { NavBar } from "../../../../components/NavBar";
import coverFallback from "../../../../assets/detail/guest-hero-cat.png";
import {
  appendEntryToDraft,
  calculateDraftLedger,
  formatTimelineTimestamp,
  getCurrentDraftSession,
  getSavedDraftById,
  replaceDraftById,
  saveCurrentDraft,
  setCurrentDraftSession,
  type RescueCreateDraft,
  type RescueCreateEntryTone,
} from "../../../../data/rescueCreateStore";
import "./index.scss";

type ActionType = RescueCreateEntryTone | "copy" | null;

type ActionConfig = {
  key: ActionType;
  label: string;
  icon: "camera" | "fileText" | "handCoins" | "sparkles" | "plusCircle";
};

const actionConfigs: ActionConfig[] = [
  { key: "expense", label: "记一笔支出", icon: "camera" },
  { key: "status", label: "写进展更新", icon: "fileText" },
  { key: "income", label: "记场外收入", icon: "handCoins" },
  { key: "budget", label: "追加预算", icon: "plusCircle" },
  { key: "copy", label: "生成文案", icon: "sparkles" },
];

function formatCurrency(value: number) {
  return `¥${value.toLocaleString("zh-CN")}`;
}

function Timeline({ draft }: { draft: RescueCreateDraft }) {
  const timeline = draft.timeline;

  return (
    <View className="rescue-preview__timeline-block">
      <View className="rescue-preview__section-header">
        <Text className="rescue-preview__section-title">救助动态</Text>
        <Text className="rescue-preview__section-hint">数据实时更新</Text>
      </View>

      {timeline.length === 0 ? (
        <View className="rescue-preview__empty-card theme-card">
          <Text className="rescue-preview__empty-title">还没有第一条记录</Text>
          <Text className="rescue-preview__empty-copy">
            可以先用上方快捷动作记录一笔支出、近况更新或场外收入。
          </Text>
        </View>
      ) : (
        <View className="rescue-preview__timeline">
          <View className="rescue-preview__timeline-line" />

          {timeline.map((entry) => (
            <View key={entry.id} className="rescue-preview__timeline-item">
              <View
                className={`rescue-preview__timeline-node rescue-preview__timeline-node--${entry.tone}`}
              />

              <View className="rescue-preview__timeline-card theme-card">
                <View className="rescue-preview__timeline-header">
                  <Text
                    className={`rescue-preview__timeline-badge rescue-preview__timeline-badge--${entry.tone}`}
                  >
                    {entry.label}
                  </Text>
                  <Text className="rescue-preview__timeline-time">
                    {entry.timestamp}
                  </Text>
                </View>

                <Text className="rescue-preview__timeline-title">
                  {entry.title}
                </Text>

                {entry.description ? (
                  <Text className="rescue-preview__timeline-description">
                    {entry.description}
                  </Text>
                ) : null}

                {typeof entry.amount === "number" ? (
                  <Text className="rescue-preview__timeline-amount">
                    {entry.tone === "income" ? "+ " : "- "}
                    {formatCurrency(entry.amount)}
                  </Text>
                ) : null}

                {entry.images?.length ? (
                  <View
                    className={`rescue-preview__timeline-images ${
                      entry.images.length === 1
                        ? "rescue-preview__timeline-images--single"
                        : ""
                    }`}
                  >
                    {entry.images.map((src, index) => (
                      <View
                        key={`${entry.id}-${index}`}
                        className="rescue-preview__timeline-image-card"
                      >
                        <Image
                          className="rescue-preview__timeline-image"
                          mode="aspectFill"
                          src={src}
                        />
                        <Text className="rescue-preview__timeline-watermark">
                          透明账本·严禁盗用
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                {typeof entry.budgetPrevious === "number" &&
                typeof entry.budgetCurrent === "number" ? (
                  <View className="rescue-preview__budget-summary">
                    <View className="rescue-preview__budget-row">
                      <Text className="rescue-preview__budget-label">
                        原预算总计
                      </Text>
                      <Text className="rescue-preview__budget-label">
                        现预算总计
                      </Text>
                    </View>
                    <View className="rescue-preview__budget-row">
                      <Text className="rescue-preview__budget-old">
                        {formatCurrency(entry.budgetPrevious)}
                      </Text>
                      <Text className="rescue-preview__budget-new">
                        {formatCurrency(entry.budgetCurrent)}
                      </Text>
                    </View>
                  </View>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function ActionSheet({
  action,
  onClose,
  onSave,
}: {
  action: Exclude<ActionType, "copy" | null>;
  onClose: () => void;
  onSave: (values: {
    title: string;
    description: string;
    amount: string;
  }) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  const copy = {
    expense: {
      title: "记一笔支出",
      titlePlaceholder: "如：清创手术费 + 抗生素",
      descriptionPlaceholder: "补充票据说明或支出背景",
      amountPlaceholder: "850.00",
      amountLabel: "支出金额",
    },
    status: {
      title: "写进展更新",
      titlePlaceholder: "如：完成首次清创，精神状态尚可",
      descriptionPlaceholder: "补充医生建议、恢复情况或下一步安排",
      amountPlaceholder: "",
      amountLabel: "",
    },
    income: {
      title: "记录场外收入",
      titlePlaceholder: "如：爱心人士支持到账",
      descriptionPlaceholder: "可补充来源、留言或对账说明",
      amountPlaceholder: "200.00",
      amountLabel: "收入金额",
    },
    budget: {
      title: "修改预算",
      titlePlaceholder: "如：新增后期康复理疗预算",
      descriptionPlaceholder: "说明为什么需要提高预算或调整阶段目标",
      amountPlaceholder: "5250.00",
      amountLabel: "新预算金额",
    },
  }[action];

  return (
    <View className="rescue-preview__sheet-overlay" onTap={onClose}>
      <View
        className="rescue-preview__sheet"
        onTap={(event) => event.stopPropagation()}
      >
        <View className="rescue-preview__sheet-handle">
          <View className="rescue-preview__sheet-handle-bar" />
        </View>

        <Text className="rescue-preview__sheet-title">{copy.title}</Text>

        <View className="rescue-preview__sheet-field">
          <Text className="rescue-preview__sheet-label">标题</Text>
          <View className="rescue-preview__sheet-input-card">
            <Input
              className="rescue-preview__sheet-input"
              maxlength={40}
              placeholder={copy.titlePlaceholder}
              value={title}
              onInput={(event) => setTitle(event.detail.value)}
            />
          </View>
        </View>

        {copy.amountLabel ? (
          <View className="rescue-preview__sheet-field">
            <Text className="rescue-preview__sheet-label">
              {copy.amountLabel}
            </Text>
            <View className="rescue-preview__sheet-input-card">
              <Input
                className="rescue-preview__sheet-input"
                type="digit"
                placeholder={copy.amountPlaceholder}
                value={amount}
                onInput={(event) => setAmount(event.detail.value)}
              />
            </View>
          </View>
        ) : null}

        <View className="rescue-preview__sheet-field">
          <Text className="rescue-preview__sheet-label">补充说明</Text>
          <View className="rescue-preview__sheet-textarea-card">
            <Textarea
              className="rescue-preview__sheet-textarea"
              maxlength={160}
              placeholder={copy.descriptionPlaceholder}
              value={description}
              onInput={(event) => setDescription(event.detail.value)}
            />
          </View>
        </View>

        <View
          className="theme-button-primary rescue-preview__sheet-button"
          onTap={() => onSave({ title, description, amount })}
        >
          <Text>保存记录</Text>
        </View>
      </View>
    </View>
  );
}

export default function RescueCreatePreviewPage() {
  const router = useRouter();
  const [draft, setDraft] = useState<RescueCreateDraft | null>(null);
  const [activeAction, setActiveAction] = useState<ActionType>(null);

  useEffect(() => {
    const savedDraft = getSavedDraftById(router.params?.id);
    const currentDraft = getCurrentDraftSession();
    const nextDraft = savedDraft ?? currentDraft;

    if (!nextDraft) {
      Taro.redirectTo({
        url: "/pages/rescue/create/basic/index",
      });
      return;
    }

    if (nextDraft.status === "published") {
      Taro.redirectTo({
        url: `/pages/rescue/detail/index?id=${nextDraft.id}&mode=owner&source=custom`,
      });
      return;
    }

    setCurrentDraftSession(nextDraft);
    setDraft(nextDraft);
  }, [router.params?.id]);

  const ledger = useMemo(
    () => (draft ? calculateDraftLedger(draft) : null),
    [draft],
  );

  if (!draft || !ledger) {
    return null;
  }

  const budget = draft.budget || 0;
  const previewSegments = [
    {
      key: "expense",
      color: "var(--color-ledger-spent)",
      width: budget > 0 ? `${(ledger.expense / budget) * 100}%` : "0%",
    },
    {
      key: "balance",
      color: "var(--color-ledger-balance)",
      width: budget > 0 ? `${(ledger.balance / budget) * 100}%` : "0%",
    },
    {
      key: "pending",
      color: "var(--color-ledger-pending)",
      width: budget > 0 ? `${(ledger.pending / budget) * 100}%` : "100%",
    },
  ];

  const handleActionTap = (action: ActionType) => {
    if (action === "copy") {
      Taro.showToast({
        title: "生成文案能力待下一步接入",
        icon: "none",
      });
      return;
    }

    setActiveAction(action);
  };

  const handleSaveAction = (values: {
    title: string;
    description: string;
    amount: string;
  }) => {
    if (!activeAction || activeAction === "copy") {
      return;
    }

    if (!values.title.trim()) {
      Taro.showToast({
        title: "请先填写标题",
        icon: "none",
      });
      return;
    }

    const numericAmount = Number(values.amount || 0);
    if (
      (activeAction === "expense" ||
        activeAction === "income" ||
        activeAction === "budget") &&
      (!numericAmount || Number.isNaN(numericAmount))
    ) {
      Taro.showToast({
        title: "请填写有效金额",
        icon: "none",
      });
      return;
    }

    let nextDraft = draft;

    if (activeAction === "budget") {
      nextDraft = replaceDraftById({
        ...draft,
        budget: numericAmount,
      });

      const entry = {
        id: `entry-${Date.now()}`,
        tone: "budget" as const,
        label: "预算调整",
        title: values.title.trim(),
        description: values.description.trim(),
        timestamp: formatTimelineTimestamp(),
        budgetPrevious: draft.budget,
        budgetCurrent: numericAmount,
      };

      nextDraft = appendEntryToDraft(nextDraft, entry);
    } else {
      const entry = {
        id: `entry-${Date.now()}`,
        tone: activeAction,
        label:
          activeAction === "expense"
            ? "支出记录"
            : activeAction === "income"
              ? "场外收入"
              : "状态更新",
        title: values.title.trim(),
        description: values.description.trim(),
        timestamp: formatTimelineTimestamp(),
        amount:
          activeAction === "expense" || activeAction === "income"
            ? numericAmount
            : undefined,
        images:
          activeAction === "status" || activeAction === "expense"
            ? [draft.coverPath || coverFallback]
            : undefined,
      };

      nextDraft = appendEntryToDraft(draft, entry);
    }

    setDraft(nextDraft);
    setActiveAction(null);
    Taro.showToast({
      title: "已写入预览时间线",
      icon: "none",
    });
  };

  const handleSaveDraft = () => {
    const saved = saveCurrentDraft("draft");
    setDraft(saved);

    Taro.showToast({
      title: "草稿已保存",
      icon: "none",
    });

    setTimeout(() => {
      Taro.switchTab({
        url: "/pages/rescue/index",
      });
    }, 300);
  };

  const handlePublish = () => {
    const saved = saveCurrentDraft("published");
    setDraft(saved);

    Taro.showToast({
      title: saved.status === "published" ? "救助已发布" : "已更新",
      icon: "none",
    });

    setTimeout(() => {
      Taro.switchTab({
        url: "/pages/rescue/index",
      });
    }, 300);
  };

  return (
    <View className="page-shell rescue-preview-page">
      <NavBar showBack title="救助记录预览" />

      <View className="rescue-preview__card theme-card">
        <View className="rescue-preview__summary-top">
          <Image
            className="rescue-preview__cover"
            mode="aspectFill"
            src={draft.coverPath || coverFallback}
          />
          <View className="rescue-preview__summary-copy">
            <View className="rescue-preview__title-row">
              <Text className="rescue-preview__title">
                {draft.name || "未命名救助"}
              </Text>
              <Text className="rescue-preview__state-chip">医疗救助中</Text>
            </View>
            <Text className="rescue-preview__goal-text">
              预估目标：{budget > 0 ? formatCurrency(budget) : "待设定"}
            </Text>
          </View>
        </View>

        <View className="rescue-preview__progress-head">
          <Text className="rescue-preview__progress-meta">
            当前筹集: {formatCurrency(ledger.income)}
          </Text>
          <Text className="rescue-preview__progress-meta">
            {ledger.progress}%
          </Text>
        </View>

        <View className="rescue-preview__bar">
          {previewSegments.map((segment) => (
            <View
              key={segment.key}
              className="rescue-preview__bar-segment"
              style={{
                width: segment.width,
                background: segment.color,
              }}
            />
          ))}
        </View>

        <View className="rescue-preview__legend">
          <View className="rescue-preview__legend-item">
            <View
              className="rescue-preview__legend-dot"
              style={{ background: "var(--color-ledger-spent)" }}
            />
            <Text className="rescue-preview__legend-label">
              已支出 {formatCurrency(ledger.expense)}
            </Text>
          </View>
          <View className="rescue-preview__legend-item">
            <View
              className="rescue-preview__legend-dot"
              style={{ background: "var(--color-ledger-balance)" }}
            />
            <Text className="rescue-preview__legend-label">
              结余 {formatCurrency(ledger.balance)}
            </Text>
          </View>
          <View className="rescue-preview__legend-item">
            <View
              className="rescue-preview__legend-dot"
              style={{ background: "var(--color-ledger-pending)" }}
            />
            <Text className="rescue-preview__legend-label">
              待筹 {formatCurrency(ledger.pending)}
            </Text>
          </View>
        </View>
      </View>

      <View className="rescue-preview__actions">
        {actionConfigs.map((action) => (
          <View
            key={action.key ?? "none"}
            className="rescue-preview__action-card theme-card"
            onTap={() => handleActionTap(action.key)}
          >
            <View
              className={`rescue-preview__action-icon ${
                action.icon === "plusCircle"
                  ? "rescue-preview__action-icon--solid"
                  : ""
              }`}
            >
              <AppIcon
                name={action.icon}
                size={24}
                variant={action.icon === "plusCircle" ? "inverse" : "default"}
              />
            </View>
            <Text className="rescue-preview__action-label">{action.label}</Text>
          </View>
        ))}
      </View>

      <Timeline draft={draft} />

      <View className="rescue-preview__footer">
        <View
          className="theme-button-secondary rescue-preview__footer-secondary"
          onTap={handleSaveDraft}
        >
          <Text>保存草稿</Text>
        </View>
        <View
          className="theme-button-primary rescue-preview__footer-primary"
          onTap={handlePublish}
        >
          <Text>发布救助</Text>
          <View className="rescue-preview__footer-arrow">
            <AppIcon name="plusCircle" size={24} variant="inverse" />
          </View>
        </View>
      </View>

      {activeAction && activeAction !== "copy" ? (
        <ActionSheet
          action={activeAction}
          onClose={() => setActiveAction(null)}
          onSave={handleSaveAction}
        />
      ) : null}
    </View>
  );
}
