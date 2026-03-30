import { Image, Input, Text, Textarea, View } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { useEffect, useMemo, useState } from "react";
import { AppIcon } from "../../../components/AppIcon";
import { NavBar } from "../../../components/NavBar";
import { SupportSheet } from "../../../components/SupportSheet";
import coverFallback from "../../../assets/detail/guest-hero-cat.png";
import {
  appendEntryToDraft,
  calculateDraftLedger,
  formatTimelineTimestamp,
  getSavedDraftById,
  replaceDraftById,
  saveCurrentDraft,
  setCurrentDraftSession,
  type RescueCreateDraft,
  type RescueCreateEntryTone,
} from "../../../data/rescueCreateStore";
import { StatusChip } from "../../../components/StatusChip";
import {
  getGuestRescueDetail,
  getOwnerRescueDetail,
  type RescueGuestDetail,
  type RescueOwnerDetail,
  type RescueTimelineEntry,
} from "../../../data/rescueDetails";
import "./index.scss";

type OwnerActionType = RescueCreateEntryTone | "copy" | null;

function formatCurrency(value: number) {
  return `¥${value.toLocaleString("zh-CN")}`;
}

function buildLedgerSegments(ledger: {
  supported: number;
  verifiedGap: number;
  pending: number;
}, labels = ["已获支持", "已核验票据缺口", "预估后续缺口"]) {
  const total = ledger.supported + ledger.verifiedGap + ledger.pending || 1;

  return [
    {
      key: "supported",
      label: labels[0],
      value: ledger.supported,
      width: `${(ledger.supported / total) * 100}%`,
      color: "var(--color-ledger-spent)",
    },
    {
      key: "verifiedGap",
      label: labels[1],
      value: ledger.verifiedGap,
      width: `${(ledger.verifiedGap / total) * 100}%`,
      color: "var(--color-ledger-balance)",
    },
    {
      key: "pending",
      label: labels[2],
      value: ledger.pending,
      width: `${(ledger.pending / total) * 100}%`,
      color: "var(--color-ledger-pending)",
    },
  ];
}

function toCustomTimelineEntry(
  entry: RescueCreateDraft["timeline"][number],
): RescueTimelineEntry {
  return {
    id: entry.id,
    tone: entry.tone === "income" ? "support" : entry.tone,
    label: entry.label,
    title: entry.title,
    description: entry.description,
    timestamp: entry.timestamp,
    amount:
      typeof entry.amount === "number"
        ? `${entry.tone === "income" ? "+" : "-"} ${formatCurrency(entry.amount)}`
        : undefined,
    linkLabel: entry.tone === "expense" ? "查看回执" : undefined,
    images: entry.images?.map((src, index) => ({
      id: `${entry.id}-${index}`,
      src,
      alt: `custom-entry-${entry.id}-${index}`,
    })),
    budgetSummary:
      typeof entry.budgetPrevious === "number" &&
      typeof entry.budgetCurrent === "number"
        ? {
            previousLabel: "原预算总计",
            previousValue: formatCurrency(entry.budgetPrevious),
            currentLabel: "现预算总计",
            currentValue: formatCurrency(entry.budgetCurrent),
          }
        : undefined,
  };
}

function buildCustomOwnerDetail(draft: RescueCreateDraft): RescueOwnerDetail {
  const ledger = calculateDraftLedger(draft);

  return {
    id: draft.id,
    title: draft.name || "未命名救助",
    navTitle: "救助记录管理",
    state: "医疗救助中",
    coverImage: draft.coverPath || coverFallback,
    statusLabel: "医疗救助中",
    statusTone: "active",
    goalAmount: draft.budget > 0 ? formatCurrency(draft.budget) : "待设定",
    currentAmount: formatCurrency(ledger.income),
    progressPercent: ledger.progress,
    ledger: {
      supported: ledger.expense,
      verifiedGap: ledger.balance,
      pending: ledger.pending,
    },
    rescuer: {
      name: "当前救助人",
      credential: "本地草稿转正式救助",
      stats: "后续可接入真实身份与凭证数",
      avatarSrc: "",
      badge: "已发布",
    },
    timeline: draft.timeline.map(toCustomTimelineEntry),
    support: {
      wechatId: "wxid_rescuer_99",
      contactHint: "长按图片保存到相册，打开微信扫一扫添加好友",
      directHint: "长按图片保存到相册，打开微信/支付宝扫码转账",
      contactTip: "添加救助人后，可通过微信直接沟通救助细节。",
      directTip:
        "支持完成后，请回到页面点击“我已支持，去认领”以更新透明账本。",
    },
    timelineHint: "数据实时更新",
    quickActions: [
      { key: "receipt", label: "记一笔支出", icon: "camera" },
      { key: "update", label: "写进展更新", icon: "fileText" },
      { key: "income", label: "记场外收入", icon: "handCoins" },
      { key: "budget", label: "追加预算", icon: "plusCircle" },
      { key: "copy", label: "生成文案", icon: "sparkles" },
    ],
  };
}

function OwnerActionSheet({
  action,
  onClose,
  onSave,
}: {
  action: Exclude<OwnerActionType, "copy" | null>;
  onClose: () => void;
  onSave: (values: { title: string; description: string; amount: string }) => void;
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
    <View className="detail-page__sheet-overlay" onTap={onClose}>
      <View className="detail-page__sheet" onTap={(event) => event.stopPropagation()}>
        <View className="detail-page__sheet-handle">
          <View className="detail-page__sheet-handle-bar" />
        </View>

        <Text className="detail-page__sheet-title">{copy.title}</Text>

        <View className="detail-page__sheet-field">
          <Text className="detail-page__sheet-label">标题</Text>
          <View className="detail-page__sheet-input-card">
            <Input
              className="detail-page__sheet-input"
              maxlength={40}
              placeholder={copy.titlePlaceholder}
              value={title}
              onInput={(event) => setTitle(event.detail.value)}
            />
          </View>
        </View>

        {copy.amountLabel ? (
          <View className="detail-page__sheet-field">
            <Text className="detail-page__sheet-label">{copy.amountLabel}</Text>
            <View className="detail-page__sheet-input-card">
              <Input
                className="detail-page__sheet-input"
                type="digit"
                placeholder={copy.amountPlaceholder}
                value={amount}
                onInput={(event) => setAmount(event.detail.value)}
              />
            </View>
          </View>
        ) : null}

        <View className="detail-page__sheet-field">
          <Text className="detail-page__sheet-label">补充说明</Text>
          <View className="detail-page__sheet-textarea-card">
            <Textarea
              className="detail-page__sheet-textarea"
              maxlength={160}
              placeholder={copy.descriptionPlaceholder}
              value={description}
              onInput={(event) => setDescription(event.detail.value)}
            />
          </View>
        </View>

        <View
          className="theme-button-primary detail-page__sheet-button"
          onTap={() => onSave({ title, description, amount })}
        >
          <Text>保存记录</Text>
        </View>
      </View>
    </View>
  );
}

function Timeline({
  entries,
  hint,
}: {
  entries: RescueTimelineEntry[];
  hint: string;
}) {
  return (
    <View className="detail-page__section">
      <View className="detail-page__section-header">
        <Text className="detail-page__section-title">救助动态</Text>
        <Text className="detail-page__section-hint">{hint}</Text>
      </View>

      <View className="detail-page__timeline">
        <View className="detail-page__timeline-line" />

        {entries.map((entry) => (
          <View key={entry.id} className="detail-page__timeline-item">
            <View
              className={`detail-page__timeline-node detail-page__timeline-node--${entry.tone}`}
            />

            <View className="detail-page__timeline-card theme-card">
              <View className="detail-page__timeline-header">
                <Text
                  className={`detail-page__timeline-badge detail-page__timeline-badge--${entry.tone}`}
                >
                  {entry.label}
                </Text>
                <Text className="detail-page__timeline-time">
                  {entry.timestamp}
                </Text>
              </View>

              <Text className="detail-page__timeline-title">{entry.title}</Text>

              {entry.description ? (
                <Text className="detail-page__timeline-description">
                  {entry.description}
                </Text>
              ) : null}

              {entry.amount || entry.linkLabel ? (
                <View className="detail-page__timeline-meta">
                  {entry.amount ? (
                    <Text className="detail-page__timeline-amount">
                      {entry.amount}
                    </Text>
                  ) : (
                    <View />
                  )}

                  {entry.linkLabel ? (
                    <View
                      className="detail-page__timeline-link"
                      onTap={() =>
                        Taro.showToast({
                          title: "回执预览待接入",
                          icon: "none",
                        })
                      }
                    >
                      <Text>{entry.linkLabel}</Text>
                      <View className="detail-page__timeline-link-arrow">
                        <AppIcon
                          name="chevronRight"
                          size={16}
                          variant="muted"
                        />
                      </View>
                    </View>
                  ) : null}
                </View>
              ) : null}

              {entry.images?.length ? (
                <View
                  className={`detail-page__timeline-images ${
                    entry.images.length === 1
                      ? "detail-page__timeline-images--single"
                      : ""
                  }`}
                >
                  {entry.images.map((image) => (
                    <View
                      key={image.id}
                      className="detail-page__timeline-image-card"
                    >
                      <Image
                        className="detail-page__timeline-image"
                        mode="aspectFill"
                        src={image.src}
                      />
                      <Text className="detail-page__timeline-watermark">
                        透明账本·严禁盗用
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {entry.budgetSummary ? (
                <View className="detail-page__timeline-budget-card">
                  <View className="detail-page__timeline-budget-row">
                    <Text className="detail-page__timeline-budget-label">
                      {entry.budgetSummary.previousLabel}
                    </Text>
                    <Text className="detail-page__timeline-budget-label">
                      {entry.budgetSummary.currentLabel}
                    </Text>
                  </View>
                  <View className="detail-page__timeline-budget-row">
                    <Text className="detail-page__timeline-budget-previous">
                      {entry.budgetSummary.previousValue}
                    </Text>
                    <Text className="detail-page__timeline-budget-current">
                      {entry.budgetSummary.currentValue}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function GuestDetail({
  detail,
  onSupport,
}: {
  detail: RescueGuestDetail;
  onSupport: () => void;
}) {
  const ledgerSegments = buildLedgerSegments(detail.ledger);

  return (
    <View className="detail-page detail-page--guest">
      <NavBar showBack title={detail.navTitle} />

      <View className="guest-detail__hero">
        <Image className="guest-detail__hero-image" mode="aspectFill" src={detail.heroImage} />
        <View className="guest-detail__hero-overlay">
          <StatusChip label={detail.statusLabel} tone={detail.statusTone} />
          <Text className="guest-detail__hero-summary">{detail.heroSummary}</Text>
        </View>
      </View>

      <View className="guest-detail__ledger-card theme-card">
        <View className="guest-detail__ledger-header">
          <Text className="guest-detail__ledger-title">资金筹集进度</Text>
          <Text className="guest-detail__ledger-help">?</Text>
        </View>

        <View className="detail-page__segmented-bar">
          {ledgerSegments.map((segment) => (
            <View
              key={segment.key}
              className="detail-page__segmented-bar-item"
              style={{
                width: segment.width,
                background: segment.color,
              }}
            />
          ))}
        </View>

        <View className="guest-detail__ledger-list">
          {ledgerSegments.map((segment) => (
            <View key={segment.key} className="guest-detail__ledger-row">
              <View className="guest-detail__ledger-row-left">
                <View
                  className="guest-detail__ledger-dot"
                  style={{ background: segment.color }}
                />
                <Text className="guest-detail__ledger-label">{segment.label}</Text>
              </View>
              <Text className="guest-detail__ledger-value">
                {formatCurrency(segment.value)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View className="guest-detail__rescuer-card theme-card">
        <Image className="guest-detail__rescuer-avatar" mode="aspectFill" src={detail.rescuer.avatarSrc} />
        <View className="guest-detail__rescuer-copy">
          <View className="guest-detail__rescuer-name-row">
            <Text className="guest-detail__rescuer-name">{detail.rescuer.name}</Text>
            <Text className="guest-detail__rescuer-badge">{detail.rescuer.badge}</Text>
          </View>
          <Text className="guest-detail__rescuer-meta">{detail.rescuer.credential}</Text>
          <Text className="guest-detail__rescuer-meta">{detail.rescuer.stats}</Text>
        </View>
        <View
          className="guest-detail__rescuer-link"
          onTap={() =>
            Taro.showToast({
              title: "救助人主页待接入",
              icon: "none",
            })
          }
        >
          <Text>查看主页</Text>
        </View>
      </View>

      <Timeline entries={detail.timeline} hint={detail.timelineHint} />

      <View className="guest-detail__sticky-bar">
        <View
          className="guest-detail__share"
          onTap={() =>
            Taro.showToast({
              title: "分享链路待接入",
              icon: "none",
            })
          }
        >
          <Text className="guest-detail__share-icon">↗</Text>
          <Text className="guest-detail__share-text">分享</Text>
        </View>

        <View
          className="theme-button-secondary guest-detail__claim-button"
          onTap={() =>
            Taro.showToast({
              title: "认领支持流程待接入",
              icon: "none",
            })
          }
        >
          <Text>认领支持</Text>
        </View>

        <View
          className="theme-button-primary guest-detail__support-button"
          onTap={onSupport}
        >
          <Text>我要支持</Text>
        </View>
      </View>
    </View>
  );
}

function OwnerDetail({
  detail,
  onActionTap,
}: {
  detail: RescueOwnerDetail;
  onActionTap?: (actionKey: string, actionLabel: string) => void;
}) {
  const ledgerSegments = buildLedgerSegments(detail.ledger, [
    "已支出",
    "结余",
    "待筹",
  ]);

  return (
    <View className="detail-page detail-page--owner">
      <NavBar showBack title={detail.navTitle} />

      <View className="owner-detail__summary theme-card">
        <View className="owner-detail__summary-top">
          <Image className="owner-detail__summary-cover" mode="aspectFill" src={detail.coverImage} />

          <View className="owner-detail__summary-copy">
            <View className="owner-detail__summary-title-row">
              <Text className="owner-detail__summary-title">{detail.title}</Text>
              <StatusChip label={detail.statusLabel} tone={detail.statusTone} />
            </View>
            <Text className="owner-detail__summary-goal">
              预估目标：{detail.goalAmount}
            </Text>
          </View>
        </View>

        <View className="owner-detail__summary-progress-head">
          <Text className="owner-detail__summary-current">
            当前集资: {detail.currentAmount}
          </Text>
          <Text className="owner-detail__summary-percent">
            {detail.progressPercent}%
          </Text>
        </View>

        <View className="detail-page__segmented-bar">
          {ledgerSegments.map((segment) => (
            <View
              key={segment.key}
              className="detail-page__segmented-bar-item"
              style={{
                width: segment.width,
                background: segment.color,
              }}
            />
          ))}
        </View>

        <View className="owner-detail__legend">
          {ledgerSegments.map((segment) => (
            <View key={segment.key} className="owner-detail__legend-item">
              <View
                className="owner-detail__legend-dot"
                style={{ background: segment.color }}
              />
              <Text className="owner-detail__legend-label">
                {segment.label}
              </Text>
              <Text className="owner-detail__legend-value">
                {formatCurrency(segment.value)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View className="owner-detail__actions">
        {detail.quickActions.map((action) => (
          <View
            key={action.key}
            className="owner-detail__action-card theme-card"
            onTap={() => {
              if (onActionTap) {
                onActionTap(action.key, action.label);
                return;
              }

              Taro.showToast({
                title: `${action.label}待接入`,
                icon: "none",
              });
            }}
          >
            <View
              className={`owner-detail__action-icon ${
                action.icon === "plusCircle"
                  ? "owner-detail__action-icon--solid"
                  : ""
              }`}
            >
              <AppIcon
                name={action.icon}
                size={24}
                variant={action.icon === "plusCircle" ? "inverse" : "default"}
              />
            </View>
            <Text className="owner-detail__action-label">{action.label}</Text>
          </View>
        ))}
      </View>

      <Timeline entries={detail.timeline} hint={detail.timelineHint} />

      <View className="owner-detail__sticky">
        <View
          className="owner-detail__swipe"
          onTap={() =>
            Taro.showToast({
              title: "结束救助流程待接入",
              icon: "none",
            })
          }
        >
          <View className="owner-detail__swipe-handle">
            <View className="owner-detail__swipe-arrow">
              <AppIcon name="chevronRight" size={16} variant="muted" />
            </View>
          </View>
          <Text className="owner-detail__swipe-text">右滑结束救助</Text>
        </View>
        <Text className="owner-detail__swipe-hint">
          确认大黄已被领养或救助已完成时，请滑动结束项目
        </Text>
      </View>
    </View>
  );
}

export default function RescueDetailPage() {
  const router = useRouter();
  const [supportOpen, setSupportOpen] = useState(false);
  const [customDraft, setCustomDraft] = useState<RescueCreateDraft | null>(null);
  const [activeAction, setActiveAction] = useState<OwnerActionType>(null);
  const mode = router.params?.mode === "guest" ? "guest" : "owner";
  const detailId = router.params?.id;
  const isCustomOwner = mode === "owner" && router.params?.source === "custom";

  useEffect(() => {
    if (!isCustomOwner) {
      return;
    }

    const savedDraft = getSavedDraftById(detailId);
    if (!savedDraft) {
      Taro.redirectTo({
        url: "/pages/rescue/index",
      });
      return;
    }

    setCurrentDraftSession(savedDraft);
    setCustomDraft(savedDraft);
  }, [detailId, isCustomOwner]);

  const guestDetail = getGuestRescueDetail(detailId);
  const ownerDetail = getOwnerRescueDetail(detailId);
  const customOwnerDetail = useMemo(
    () => (customDraft ? buildCustomOwnerDetail(customDraft) : null),
    [customDraft],
  );

  const handleCustomActionTap = (actionKey: string, actionLabel: string) => {
    if (actionKey === "copy") {
      Taro.showToast({
        title: `${actionLabel}待接入`,
        icon: "none",
      });
      return;
    }

    const mappedAction =
      actionKey === "receipt"
        ? "expense"
        : actionKey === "update"
          ? "status"
          : actionKey === "income"
            ? "income"
            : actionKey === "budget"
              ? "budget"
              : null;

    setActiveAction(mappedAction);
  };

  const handleCustomActionSave = (values: {
    title: string;
    description: string;
    amount: string;
  }) => {
    if (!customDraft || !activeAction || activeAction === "copy") {
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

    let nextDraft = customDraft;

    if (activeAction === "budget") {
      nextDraft = replaceDraftById({
        ...customDraft,
        budget: numericAmount,
      });

      nextDraft = appendEntryToDraft(nextDraft, {
        id: `entry-${Date.now()}`,
        tone: "budget",
        label: "预算调整",
        title: values.title.trim(),
        description: values.description.trim(),
        timestamp: formatTimelineTimestamp(),
        budgetPrevious: customDraft.budget,
        budgetCurrent: numericAmount,
      });
    } else {
      nextDraft = appendEntryToDraft(customDraft, {
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
          activeAction === "expense" || activeAction === "status"
            ? [customDraft.coverPath || coverFallback]
            : undefined,
      });
    }

    const saved = saveCurrentDraft("published");
    setCustomDraft(saved);
    setActiveAction(null);
    Taro.showToast({
      title: "已写入时间线",
      icon: "none",
    });
  };

  return (
    <View className="page-shell detail-page-shell">
      {mode === "guest" ? (
        <>
          <GuestDetail detail={guestDetail} onSupport={() => setSupportOpen(true)} />
          <SupportSheet
            onClose={() => setSupportOpen(false)}
            project={{
              id: guestDetail.id,
              name: guestDetail.title,
              state: guestDetail.statusLabel,
              avatarLabel: guestDetail.title.slice(0, 2),
              avatarStart: "#DBD2B8",
              avatarEnd: "#6E6145",
              statusLabel: guestDetail.statusLabel,
              statusTone: guestDetail.statusTone,
              location: "",
              updatedAt: "",
              summary: guestDetail.heroSummary,
              ledger: guestDetail.ledger,
              rescuer: {
                name: guestDetail.rescuer.name,
                credential: guestDetail.rescuer.credential,
                stats: guestDetail.rescuer.stats,
              },
              timeline: [],
              proofs: [],
              support: guestDetail.support,
            }}
            visible={supportOpen}
          />
        </>
      ) : isCustomOwner && customOwnerDetail ? (
        <>
          <OwnerDetail
            detail={customOwnerDetail}
            onActionTap={handleCustomActionTap}
          />
          {activeAction && activeAction !== "copy" ? (
            <OwnerActionSheet
              action={activeAction}
              onClose={() => setActiveAction(null)}
              onSave={handleCustomActionSave}
            />
          ) : null}
        </>
      ) : (
        <OwnerDetail detail={ownerDetail} />
      )}
    </View>
  );
}
