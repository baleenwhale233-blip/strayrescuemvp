import coverImage from "../../../assets/detail/guest-hero-cat.png";
import rescuerAvatar from "../../../assets/detail/rescuer-avatar.png";
import timelineReceipt from "../../../assets/detail/timeline-receipt.png";
import timelineStatus from "../../../assets/detail/timeline-status-cat.png";
import timelineTreatment from "../../../assets/detail/timeline-treatment.png";
import {
  getSavedDrafts,
  type RescueCreateDraft,
} from "../repository/localDraftPersistence.ts";
import type {
  CanonicalAsset,
  CanonicalCase,
  CanonicalCaseBundle,
  CanonicalCaseCreatedEvent,
  CanonicalDataset,
  CanonicalEvent,
  CanonicalExpenseEvent,
  CanonicalProgressUpdateEvent,
  CanonicalRescuer,
  CanonicalSupportEvent,
  CaseCurrentStatus,
  CurrencyCode,
  VerificationStatus,
  Visibility,
} from "../types.ts";
import {
  legacyRescueProjectDetails as rescueProjectDetails,
  type LegacyRescueProjectDetail as RescueProjectDetail,
  type LegacyStatusTone as StatusTone,
} from "../fixtures/legacyRescueProjectDetails.ts";

function formatIndex(index: number) {
  return `${index + 1}`.padStart(3, "0");
}

function parseCurrencyLabel(value?: string) {
  if (!value) {
    return 0;
  }

  const numeric = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isNaN(numeric) ? 0 : numeric;
}

function toVerificationStatus(tone: string): VerificationStatus {
  if (tone === "support") {
    return "confirmed";
  }

  if (tone === "expense") {
    return "confirmed";
  }

  return "manual";
}

function mapStatusToCurrentStatus(
  tone: StatusTone,
  label: string,
): CaseCurrentStatus {
  if (tone === "draft") {
    return "draft";
  }

  if (tone === "urgent" || tone === "active") {
    return "medical";
  }

  if (tone === "progress") {
    return "recovery";
  }

  if (tone === "done") {
    if (label.includes("领养")) {
      return "rehoming";
    }
    return "completed";
  }

  return "medical";
}

function createDefaultRescuer(
  detail: RescueProjectDetail,
  index: number,
): CanonicalRescuer {
  const rescuerId = `rescuer_${formatIndex(index)}`;

  return {
    id: rescuerId,
    name: detail.rescuer.name,
    avatarAssetId: `${rescuerId}_avatar`,
    avatarUrl: rescuerAvatar,
    verifiedLevel: "realname",
    joinedAt: "2026-03-01T10:00:00Z",
    wechatId: detail.support.wechatId,
    alipayAccount: "",
    paymentQrAssetId: `${rescuerId}_payment_qr`,
    stats: {
      publishedCaseCount: 3,
      verifiedReceiptCount: 12,
    },
  };
}

function createBaseAssets(
  caseId: string,
  rescuer: CanonicalRescuer,
): CanonicalAsset[] {
  return [
    {
      id: rescuer.avatarAssetId!,
      kind: "avatar",
      originalUrl: rescuer.avatarUrl,
      thumbnailUrl: rescuer.avatarUrl,
    },
    {
      id: rescuer.paymentQrAssetId!,
      kind: "payment_qr",
      originalUrl: coverImage,
      thumbnailUrl: coverImage,
    },
    {
      id: `${caseId}_cover`,
      kind: "case_cover",
      originalUrl: coverImage,
      watermarkedUrl: coverImage,
      thumbnailUrl: coverImage,
    },
    {
      id: `${caseId}_face`,
      kind: "animal_face",
      originalUrl: coverImage,
      watermarkedUrl: coverImage,
      thumbnailUrl: coverImage,
    },
  ];
}

export function adaptRescueProjectDetailMockToCanonical(
  detail: RescueProjectDetail,
  index = 0,
): CanonicalCaseBundle {
  const rescuer = createDefaultRescuer(detail, index);
  const caseId = detail.id.replace("project", "case");
  const assets = createBaseAssets(caseId, rescuer);
  const createdAt = "2026-03-28T08:35:00Z";

  const canonicalCase: CanonicalCase = {
    id: caseId,
    rescuerId: rescuer.id,
    animalName: detail.name,
    species: detail.name.includes("犬") ? "dog" : "cat",
    coverAssetId: `${caseId}_cover`,
    faceIdAssetId: `${caseId}_face`,
    foundAt: createdAt,
    foundLocationText: detail.location,
    initialSummary: detail.summary,
    currentStatus: mapStatusToCurrentStatus(
      detail.statusTone,
      detail.statusLabel,
    ),
    currentStatusLabel: detail.statusLabel,
    targetAmount:
      detail.ledger.supported +
      detail.ledger.verifiedGap +
      detail.ledger.pending,
    visibility: detail.statusTone === "draft" ? "draft" : "published",
    createdAt,
    updatedAt: createdAt,
  };

  const createdEvent: CanonicalCaseCreatedEvent = {
    id: `${caseId}_evt_created`,
    caseId,
    type: "case_created",
    occurredAt: createdAt,
    text: detail.summary,
    statusLabel: detail.statusLabel,
    assetIds: [`${caseId}_face`],
    visibility: canonicalCase.visibility === "draft" ? "draft" : "public",
  };

  const timelineEvents: CanonicalEvent[] = detail.timeline.map((entry, entryIndex) => {
    const eventId = `${caseId}_evt_${formatIndex(entryIndex)}`;
    const occurredAt = createdAt;
    const visibility: Visibility =
      canonicalCase.visibility === "draft" ? "draft" : "public";

    if (entry.tone === "expense") {
      const receiptAssetId = `${eventId}_receipt`;
      const treatmentAssetId = `${eventId}_treatment`;

      assets.push(
        {
          id: receiptAssetId,
          kind: "receipt",
          originalUrl: timelineReceipt,
          watermarkedUrl: timelineReceipt,
          thumbnailUrl: timelineReceipt,
        },
        {
          id: treatmentAssetId,
          kind: "progress_photo",
          originalUrl: timelineTreatment,
          watermarkedUrl: timelineTreatment,
          thumbnailUrl: timelineTreatment,
        },
      );

      const event: CanonicalExpenseEvent = {
        id: eventId,
        caseId,
        type: "expense",
        occurredAt,
        amount: parseCurrencyLabel(entry.amount),
        currency: "CNY" as CurrencyCode,
        merchantName: "示例宠物医院",
        expenseItemsText: entry.title,
        assetIds: [receiptAssetId, treatmentAssetId],
        verificationStatus: toVerificationStatus(entry.tone),
        visibility,
      };

      return event;
    }

    if (entry.tone === "support") {
      const event: CanonicalSupportEvent = {
        id: eventId,
        caseId,
        type: "support",
        occurredAt,
        amount: parseCurrencyLabel(entry.amount),
        currency: "CNY",
        supportSource: "manual_entry",
        supporterNameMasked: "爱心人士",
        message: entry.description,
        verificationStatus: "confirmed",
        assetIds: [],
        visibility,
      };

      return event;
    }

    if (entry.tone === "budget") {
      return {
        id: eventId,
        caseId,
        type: "budget_adjustment",
        occurredAt,
        previousTargetAmount:
          detail.ledger.supported + detail.ledger.verifiedGap,
        newTargetAmount:
          detail.ledger.supported +
          detail.ledger.verifiedGap +
          detail.ledger.pending,
        reason: entry.description || entry.title,
        assetIds: [],
        visibility,
      };
    }

    const progressAssetId = `${eventId}_progress`;
    assets.push({
      id: progressAssetId,
      kind: "progress_photo",
      originalUrl: timelineStatus,
      watermarkedUrl: timelineStatus,
      thumbnailUrl: timelineStatus,
    });

    const event: CanonicalProgressUpdateEvent = {
      id: eventId,
      caseId,
      type: "progress_update",
      occurredAt,
      text: entry.description || entry.title,
      statusLabel: entry.label,
      assetIds: [progressAssetId],
      visibility,
    };

    return event;
  });

  return {
    rescuer,
    case: canonicalCase,
    events: [createdEvent, ...timelineEvents],
    assets,
  };
}

export function adaptLocalDraftToCanonical(
  draft: RescueCreateDraft,
  index = 0,
): CanonicalCaseBundle {
  const rescuerId = `local_rescuer_${formatIndex(index)}`;
  const caseId = draft.id.replace("custom-project", "case");
  const createdAt = draft.createdAt;
  const baseAssetId = `${caseId}_cover`;

  const rescuer: CanonicalRescuer = {
    id: rescuerId,
    name: "当前救助人",
    verifiedLevel: "wechat",
    joinedAt: createdAt,
    wechatId: "wxid_rescuer_99",
    paymentQrAssetId: `${rescuerId}_payment_qr`,
    stats: {
      publishedCaseCount: 0,
      verifiedReceiptCount: 0,
    },
  };

  const assets: CanonicalAsset[] = [
    {
      id: baseAssetId,
      kind: "case_cover",
      originalUrl: draft.coverPath || coverImage,
      watermarkedUrl: draft.coverPath || coverImage,
      thumbnailUrl: draft.coverPath || coverImage,
    },
    {
      id: `${caseId}_face`,
      kind: "animal_face",
      originalUrl: draft.coverPath || coverImage,
      watermarkedUrl: draft.coverPath || coverImage,
      thumbnailUrl: draft.coverPath || coverImage,
    },
    {
      id: rescuer.paymentQrAssetId!,
      kind: "payment_qr",
      originalUrl: coverImage,
      thumbnailUrl: coverImage,
    },
  ];

  const canonicalCase: CanonicalCase = {
    id: caseId,
    rescuerId,
    animalName: draft.name || "未命名救助",
    species: "cat",
    coverAssetId: baseAssetId,
    faceIdAssetId: `${caseId}_face`,
    initialSummary: draft.summary || "待补充事件说明",
    currentStatus: draft.status === "published" ? "medical" : "draft",
    currentStatusLabel: draft.status === "published" ? "医疗救助中" : "草稿中",
    targetAmount: draft.budget,
    visibility: draft.status,
    createdAt,
    updatedAt: draft.updatedAt,
  };

  const events: CanonicalEvent[] = draft.timeline.map((entry, entryIndex) => {
    const eventId = `${caseId}_evt_${formatIndex(entryIndex)}`;
    const visibility: Visibility =
      draft.status === "published" ? "public" : "draft";

    if (entry.tone === "expense") {
      const entryImages = entry.images ?? [];
      const assetIds = entryImages.map((imageUrl, imageIndex) => {
        const assetId = `${eventId}_asset_${imageIndex}`;
        assets.push({
          id: assetId,
          kind: "receipt",
          originalUrl: imageUrl,
          watermarkedUrl: imageUrl,
          thumbnailUrl: imageUrl,
        });
        return assetId;
      });

      return {
        id: eventId,
        caseId,
        type: "expense",
        occurredAt: draft.updatedAt,
        amount: entry.amount ?? 0,
        currency: "CNY" as CurrencyCode,
        expenseItemsText: entry.title,
        merchantName: "",
        assetIds,
        verificationStatus: "manual" as VerificationStatus,
        visibility,
      };
    }

    if (entry.tone === "income") {
      return {
        id: eventId,
        caseId,
        type: "support",
        occurredAt: draft.updatedAt,
        amount: entry.amount ?? 0,
        currency: "CNY" as CurrencyCode,
        supportSource: "manual_entry",
        supporterNameMasked: "待确认支持",
        message: entry.description,
        verificationStatus: "pending" as VerificationStatus,
        assetIds: [],
        visibility: draft.status === "published" ? "private" : visibility,
      };
    }

    if (entry.tone === "budget") {
      return {
        id: eventId,
        caseId,
        type: "budget_adjustment",
        occurredAt: draft.updatedAt,
        previousTargetAmount: entry.budgetPrevious ?? draft.budget,
        newTargetAmount: entry.budgetCurrent ?? draft.budget,
        reason: entry.description || entry.title,
        assetIds: [],
        visibility,
      };
    }

    const entryImages = entry.images ?? [];
    const assetIds = entryImages.map((imageUrl, imageIndex) => {
      const assetId = `${eventId}_asset_${imageIndex}`;
      assets.push({
        id: assetId,
        kind: "progress_photo",
        originalUrl: imageUrl,
        watermarkedUrl: imageUrl,
        thumbnailUrl: imageUrl,
      });
      return assetId;
    });

    const eventType = entry.label === "状态更新" ? "progress_update" : "case_created";

    return {
      id: eventId,
      caseId,
      type: eventType,
      occurredAt: draft.updatedAt,
      text: entry.description || entry.title,
      statusLabel: entry.label,
      assetIds,
      visibility,
    } as CanonicalCaseCreatedEvent | CanonicalProgressUpdateEvent;
  });

  return {
    rescuer,
    case: canonicalCase,
    events,
    assets,
  };
}

export function mergeCanonicalBundles(
  bundles: CanonicalCaseBundle[],
): CanonicalDataset {
  return bundles.reduce<CanonicalDataset>(
    (dataset, bundle) => {
      dataset.rescuers.push(bundle.rescuer);
      dataset.cases.push(bundle.case);
      dataset.events.push(...bundle.events);
      dataset.assets.push(...bundle.assets);
      return dataset;
    },
    {
      rescuers: [],
      cases: [],
      events: [],
      assets: [],
    },
  );
}

export function createCanonicalDatasetFromLegacySources(): CanonicalDataset {
  const mockBundles = rescueProjectDetails.map((detail, index) =>
    adaptRescueProjectDetailMockToCanonical(detail, index),
  );
  const localBundles = getSavedDrafts().map((draft, index) =>
    adaptLocalDraftToCanonical(draft, index + mockBundles.length),
  );

  return mergeCanonicalBundles([...mockBundles, ...localBundles]);
}
