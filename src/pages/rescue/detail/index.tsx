import { Image, Input, Text, Textarea, View } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { useEffect, useState } from "react";
import { AppIcon } from "../../../components/AppIcon";
import { NavBar } from "../../../components/NavBar";
import { SupportSheet } from "../../../components/SupportSheet";
import {
  appendDraftEntry,
  formatTimelineTimestamp,
  getDraftByCaseId,
  getOwnerDetailVMByCaseId,
  getPublicDetailVMByCaseId,
  getSupportSheetDataByCaseId,
  persistDraft,
  replaceDraft,
  syncCurrentDraft,
  toOwnerActionTimelineEntry,
  type OwnerDetailActionKey,
  type OwnerDetailVM,
  type RescueCreateDraft,
} from "../../../domain/canonical/repository/localRepository";
import type {
  PublicDetailVM,
  PublicTimelineItemVM,
} from "../../../domain/canonical/types";
import { StatusChip } from "../../../components/StatusChip";
import "./index.scss";

type ActiveOwnerAction = Exclude<OwnerDetailActionKey, "copy"> | null;

function formatCurrency(valueLabel: string) {
  return valueLabel;
}

function buildOwnerSegments(detail: OwnerDetailVM) {
  const total =
    detail.ledger.confirmedExpenseAmount +
      detail.ledger.verifiedGapAmount +
      detail.ledger.remainingTargetAmount || 1;

  return {
    expenseWidth: `${(detail.ledger.confirmedExpenseAmount / total) * 100}%`,
    gapWidth: `${(detail.ledger.verifiedGapAmount / total) * 100}%`,
    remainingWidth: `${(detail.ledger.remainingTargetAmount / total) * 100}%`,
  };
}

function Timeline({
  entries,
  hint,
}: {
  entries: PublicTimelineItemVM[];
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
                  {entry.timestampLabel}
                </Text>
              </View>

              <Text className="detail-page__timeline-title">{entry.title}</Text>

              {entry.description ? (
                <Text className="detail-page__timeline-description">
                  {entry.description}
                </Text>
              ) : null}

              {entry.amountLabel ? (
                <View className="detail-page__timeline-meta">
                  <Text className="detail-page__timeline-amount">
                    {entry.amountLabel}
                  </Text>

                  {entry.type === "expense" ? (
                    <View
                      className="detail-page__timeline-link"
                      onTap={() =>
                        Taro.showToast({
                          title: "回执预览待接入",
                          icon: "none",
                        })
                      }
                    >
                      <Text>查看回执</Text>
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

              {entry.assetUrls.length ? (
                <View
                  className={`detail-page__timeline-images ${
                    entry.assetUrls.length === 1
                      ? "detail-page__timeline-images--single"
                      : ""
                  }`}
                >
                  {entry.assetUrls.map((imageUrl) => (
                    <View
                      key={imageUrl}
                      className="detail-page__timeline-image-card"
                    >
                      <Image
                        className="detail-page__timeline-image"
                        mode="aspectFill"
                        src={imageUrl}
                      />
                      <Text className="detail-page__timeline-watermark">
                        透明账本·严禁盗用
                      </Text>
                    </View>
                  ))}
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
  detail: PublicDetailVM;
  onSupport: () => void;
}) {
  return (
    <View className="detail-page detail-page--guest">
      <NavBar showBack title={detail.title} />

      <View className="guest-detail__hero">
        {detail.heroImageUrl ? (
          <Image
            className="guest-detail__hero-image"
            mode="aspectFill"
            src={detail.heroImageUrl}
          />
        ) : null}
        <View className="guest-detail__hero-overlay">
          <StatusChip label={detail.statusLabel} tone={detail.statusTone} />
          <Text className="guest-detail__hero-summary">{detail.summary}</Text>
        </View>
      </View>

      <View className="guest-detail__ledger-card theme-card">
        <View className="guest-detail__ledger-header">
          <Text className="guest-detail__ledger-title">资金筹集进度</Text>
          <Text className="guest-detail__ledger-help">?</Text>
        </View>

        <View className="detail-page__segmented-bar">
          <View
            className="detail-page__segmented-bar-item"
            style={{
              width: `${detail.ledger.supportedAmount ? (detail.ledger.supportedAmount / detail.ledger.targetAmount) * 100 : 0}%`,
              background: "var(--color-ledger-spent)",
            }}
          />
          <View
            className="detail-page__segmented-bar-item"
            style={{
              width: `${detail.ledger.verifiedGapAmount ? (detail.ledger.verifiedGapAmount / detail.ledger.targetAmount) * 100 : 0}%`,
              background: "var(--color-ledger-balance)",
            }}
          />
          <View
            className="detail-page__segmented-bar-item"
            style={{
              width: `${detail.ledger.remainingTargetAmount ? (detail.ledger.remainingTargetAmount / detail.ledger.targetAmount) * 100 : 100}%`,
              background: "var(--color-ledger-pending)",
            }}
          />
        </View>

        <View className="guest-detail__ledger-list">
          <View className="guest-detail__ledger-row">
            <View className="guest-detail__ledger-row-left">
              <View
                className="guest-detail__ledger-dot"
                style={{ background: "var(--color-ledger-spent)" }}
              />
              <Text className="guest-detail__ledger-label">已获支持</Text>
            </View>
            <Text className="guest-detail__ledger-value">
              {detail.ledger.supportedAmountLabel}
            </Text>
          </View>
          <View className="guest-detail__ledger-row">
            <View className="guest-detail__ledger-row-left">
              <View
                className="guest-detail__ledger-dot"
                style={{ background: "var(--color-ledger-balance)" }}
              />
              <Text className="guest-detail__ledger-label">已核验票据缺口</Text>
            </View>
            <Text className="guest-detail__ledger-value">
              {detail.ledger.verifiedGapAmountLabel}
            </Text>
          </View>
          <View className="guest-detail__ledger-row">
            <View className="guest-detail__ledger-row-left">
              <View
                className="guest-detail__ledger-dot"
                style={{ background: "var(--color-ledger-pending)" }}
              />
              <Text className="guest-detail__ledger-label">预估后续缺口</Text>
            </View>
            <Text className="guest-detail__ledger-value">
              {detail.ledger.remainingTargetAmountLabel}
            </Text>
          </View>
        </View>
      </View>

      <View className="guest-detail__rescuer-card theme-card">
        {detail.rescuer.avatarUrl ? (
          <Image
            className="guest-detail__rescuer-avatar"
            mode="aspectFill"
            src={detail.rescuer.avatarUrl}
          />
        ) : null}
        <View className="guest-detail__rescuer-copy">
          <View className="guest-detail__rescuer-name-row">
            <Text className="guest-detail__rescuer-name">
              {detail.rescuer.name}
            </Text>
            <Text className="guest-detail__rescuer-badge">
              {detail.rescuer.verifiedLabel}
            </Text>
          </View>
          <Text className="guest-detail__rescuer-meta">
            已建立 {detail.rescuer.stats.publishedCaseCount} 份透明账本 ·
            已核验 {detail.rescuer.stats.verifiedReceiptCount} 张票据
          </Text>
          <Text className="guest-detail__rescuer-meta">
            注册于 {detail.rescuer.joinedAtLabel}
          </Text>
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

      <Timeline entries={detail.timeline} hint="数据实时更新" />

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

function OwnerActionSheet({
  action,
  onClose,
  onSave,
}: {
  action: ActiveOwnerAction;
  onClose: () => void;
  onSave: (values: { title: string; description: string; amount: string }) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  if (!action) {
    return null;
  }

  const copy = {
    receipt: {
      title: "记一笔支出",
      titlePlaceholder: "如：清创手术费 + 抗生素",
      descriptionPlaceholder: "补充票据说明或支出背景",
      amountPlaceholder: "850.00",
      amountLabel: "支出金额",
    },
    update: {
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

function OwnerDetail({
  detail,
  onActionTap,
}: {
  detail: OwnerDetailVM;
  onActionTap?: (action: OwnerDetailActionKey) => void;
}) {
  const segments = buildOwnerSegments(detail);

  return (
    <View className="detail-page detail-page--owner">
      <NavBar showBack title={detail.navTitle} />

      <View className="owner-detail__summary theme-card">
        <View className="owner-detail__summary-top">
          {detail.coverImage ? (
            <Image
              className="owner-detail__summary-cover"
              mode="aspectFill"
              src={detail.coverImage}
            />
          ) : null}

          <View className="owner-detail__summary-copy">
            <View className="owner-detail__summary-title-row">
              <Text className="owner-detail__summary-title">{detail.title}</Text>
              <StatusChip label={detail.statusLabel} tone={detail.statusTone} />
            </View>
            <Text className="owner-detail__summary-goal">
              预估目标：{detail.goalAmountLabel}
            </Text>
          </View>
        </View>

        <View className="owner-detail__summary-progress-head">
          <Text className="owner-detail__summary-current">
            当前集资: {detail.currentAmountLabel}
          </Text>
          <Text className="owner-detail__summary-percent">
            {detail.progressPercent}%
          </Text>
        </View>

        <View className="detail-page__segmented-bar">
          <View
            className="detail-page__segmented-bar-item"
            style={{
              width: segments.expenseWidth,
              background: "var(--color-ledger-spent)",
            }}
          />
          <View
            className="detail-page__segmented-bar-item"
            style={{
              width: segments.gapWidth,
              background: "var(--color-ledger-balance)",
            }}
          />
          <View
            className="detail-page__segmented-bar-item"
            style={{
              width: segments.remainingWidth,
              background: "var(--color-ledger-pending)",
            }}
          />
        </View>

        <View className="owner-detail__legend">
          <View className="owner-detail__legend-item">
            <View
              className="owner-detail__legend-dot"
              style={{ background: "var(--color-ledger-spent)" }}
            />
            <Text className="owner-detail__legend-label">已支出</Text>
            <Text className="owner-detail__legend-value">
              {detail.ledger.confirmedExpenseAmountLabel}
            </Text>
          </View>
          <View className="owner-detail__legend-item">
            <View
              className="owner-detail__legend-dot"
              style={{ background: "var(--color-ledger-balance)" }}
            />
            <Text className="owner-detail__legend-label">缺口</Text>
            <Text className="owner-detail__legend-value">
              {detail.ledger.verifiedGapAmountLabel}
            </Text>
          </View>
          <View className="owner-detail__legend-item">
            <View
              className="owner-detail__legend-dot"
              style={{ background: "var(--color-ledger-pending)" }}
            />
            <Text className="owner-detail__legend-label">待筹</Text>
            <Text className="owner-detail__legend-value">
              {detail.ledger.remainingTargetAmountLabel}
            </Text>
          </View>
        </View>
      </View>

      <View className="owner-detail__actions">
        {detail.quickActions.map((action) => (
          <View
            key={action.key}
            className="owner-detail__action-card theme-card"
            onTap={() => {
              if (onActionTap) {
                onActionTap(action.key);
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
          确认项目已完成时，请滑动结束项目
        </Text>
      </View>
    </View>
  );
}

export default function RescueDetailPage() {
  const router = useRouter();
  const [supportOpen, setSupportOpen] = useState(false);
  const [customDraft, setCustomDraft] = useState<RescueCreateDraft | null>(null);
  const [activeAction, setActiveAction] = useState<ActiveOwnerAction>(null);
  const mode = router.params?.mode === "guest" ? "guest" : "owner";
  const caseId = router.params?.id;

  const publicDetail = getPublicDetailVMByCaseId(caseId);
  const ownerDetail = getOwnerDetailVMByCaseId(caseId);
  const support = getSupportSheetDataByCaseId(caseId);

  useEffect(() => {
    if (!ownerDetail || ownerDetail.sourceKind !== "local") {
      return;
    }

    const draft = getDraftByCaseId(caseId);
    if (draft) {
      syncCurrentDraft(draft);
      setCustomDraft(draft);
    }
  }, [caseId, ownerDetail]);

  if (mode === "guest") {
    if (!publicDetail || !support) {
      return null;
    }

    return (
      <View className="page-shell detail-page-shell">
        <GuestDetail detail={publicDetail} onSupport={() => setSupportOpen(true)} />
        <SupportSheet
          onClose={() => setSupportOpen(false)}
          support={support}
          visible={supportOpen}
        />
      </View>
    );
  }

  if (!ownerDetail) {
    return null;
  }

  const handleOwnerActionSave = (values: {
    title: string;
    description: string;
    amount: string;
  }) => {
    if (!customDraft || !activeAction) {
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
      (activeAction === "receipt" ||
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
      nextDraft = replaceDraft({
        ...customDraft,
        budget: numericAmount,
      });

      nextDraft = appendDraftEntry(
        nextDraft,
        toOwnerActionTimelineEntry({
          action: "budget",
          title: values.title.trim(),
          description: values.description.trim(),
          previousTargetAmount: customDraft.budget,
          currentTargetAmount: numericAmount,
          timestampLabel: formatTimelineTimestamp(),
        }),
      );
    } else {
      nextDraft = appendDraftEntry(
        customDraft,
        toOwnerActionTimelineEntry({
          action: activeAction,
          title: values.title.trim(),
          description: values.description.trim(),
          timestampLabel: formatTimelineTimestamp(),
          amount:
            activeAction === "receipt" || activeAction === "income"
              ? numericAmount
              : undefined,
          imageUrls:
            activeAction === "receipt" || activeAction === "update"
              ? customDraft.coverPath
                ? [customDraft.coverPath]
                : []
              : [],
        }),
      );
    }

    const saved = persistDraft("published");
    setCustomDraft(saved);
    setActiveAction(null);
    Taro.showToast({
      title: "已写入时间线",
      icon: "none",
    });
  };

  return (
    <View className="page-shell detail-page-shell">
      <OwnerDetail
        detail={ownerDetail}
        onActionTap={(action) => {
          if (action === "copy") {
            Taro.showToast({
              title: "生成文案能力待接入",
              icon: "none",
            });
            return;
          }

          if (ownerDetail.sourceKind !== "local") {
            Taro.showToast({
              title: "示例数据暂不支持编辑",
              icon: "none",
            });
            return;
          }

          setActiveAction(action);
        }}
      />

      {ownerDetail.sourceKind === "local" && activeAction ? (
        <OwnerActionSheet
          action={activeAction}
          onClose={() => setActiveAction(null)}
          onSave={handleOwnerActionSave}
        />
      ) : null}
    </View>
  );
}
