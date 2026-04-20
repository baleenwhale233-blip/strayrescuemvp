import assert from "node:assert/strict";
import test from "node:test";
import { sampleCaseBundle } from "../fixtures/sampleCaseBundle";
import { getHomepageCaseCardVM } from "../selectors/getDiscoverCardVM";
import { getPublicDetailVM } from "../selectors/getPublicDetailVM";
import type { CanonicalCaseBundle } from "../types";
import { getWorkbenchVMFromBundles } from "./canonicalReadRepositoryCore";
import {
  finalizeHomepageCaseCardPresentationCore,
  finalizePublicDetailPresentationCore,
  finalizeWorkbenchCaseCardPresentationCore,
  resolveBundlePresentationCore,
} from "./localPresentationCore";

const CASE_ID = "case_001";

test("resolved read APIs surface title/cover/status overlays consistently", () => {
  const resolvedBundle = resolveBundlePresentationCore(
    sampleCaseBundle as CanonicalCaseBundle,
    {
      caseId: CASE_ID,
      titleOverride: "本地改名小橘",
      coverOverride: "https://local.test/cover-orange.png",
      statusSubmissions: [
        {
          id: "status-local-1",
          statusLabel: "康复观察",
          description: "今天开始自己吃饭了",
          timestampLabel: "今天 09:30",
          assetUrls: ["https://local.test/progress-orange.png"],
          createdAt: "2026-04-19T01:30:00Z",
        },
      ],
    },
  );

  const detail = finalizePublicDetailPresentationCore(
    getPublicDetailVM(resolvedBundle),
    {
      caseId: CASE_ID,
      statusSubmissions: [
        {
          id: "status-local-1",
          statusLabel: "康复观察",
          description: "今天开始自己吃饭了",
          timestampLabel: "今天 09:30",
          assetUrls: ["https://local.test/progress-orange.png"],
          createdAt: "2026-04-19T01:30:00Z",
        },
      ],
    },
  );
  const workbench = getWorkbenchVMFromBundles([resolvedBundle]);
  const homepageCard = finalizeHomepageCaseCardPresentationCore(
    getHomepageCaseCardVM(resolvedBundle),
    {
      caseId: CASE_ID,
      statusSubmissions: [
        {
          id: "status-local-1",
          statusLabel: "康复观察",
          description: "今天开始自己吃饭了",
          timestampLabel: "今天 09:30",
          assetUrls: ["https://local.test/progress-orange.png"],
          createdAt: "2026-04-19T01:30:00Z",
        },
      ],
    },
  );
  const workbenchCard = workbench?.activeCases.find((card) => card.caseId === CASE_ID)
    ? finalizeWorkbenchCaseCardPresentationCore(
        workbench.activeCases.find((card) => card.caseId === CASE_ID)!,
        {
          caseId: CASE_ID,
          statusSubmissions: [
            {
              id: "status-local-1",
              statusLabel: "康复观察",
              description: "今天开始自己吃饭了",
              timestampLabel: "今天 09:30",
              assetUrls: ["https://local.test/progress-orange.png"],
              createdAt: "2026-04-19T01:30:00Z",
            },
          ],
        },
      )
    : undefined;

  assert.ok(detail);
  assert.equal(detail?.title, "本地改名小橘");
  assert.equal(detail?.heroImageUrl, "https://local.test/cover-orange.png");
  assert.equal(detail?.statusLabel, "康复观察");
  assert.equal(detail?.updatedAtLabel, "今天 09:30");
  assert.equal(detail?.latestTimelineSummary, "今天开始自己吃饭了");
  assert.equal(detail?.timeline[0]?.label, "状态更新");
  assert.equal(detail?.timeline[0]?.timestampLabel, "今天 09:30");
  assert.deepEqual(detail?.timeline[0]?.assetUrls, ["https://local.test/progress-orange.png"]);

  assert.ok(workbenchCard);
  assert.equal(workbenchCard?.title, "本地改名小橘");
  assert.equal(workbenchCard?.coverImageUrl, "https://local.test/cover-orange.png");
  assert.equal(workbenchCard?.statusLabel, "康复观察");
  assert.equal(workbenchCard?.updatedAtLabel, "今天 09:30");

  assert.ok(homepageCard);
  assert.equal(homepageCard?.title, "本地改名小橘");
  assert.equal(homepageCard?.coverImageUrl, "https://local.test/cover-orange.png");
  assert.equal(homepageCard?.statusLabel, "康复观察");
  assert.equal(homepageCard?.updatedAtLabel, "今天 09:30");
  assert.equal(homepageCard?.latestStatusSummary, "今天开始自己吃饭了");
});

test("resolved read APIs fold budget and expense overlays into ledger and homepage cards", () => {
  const resolvedBundle = resolveBundlePresentationCore(
    sampleCaseBundle as CanonicalCaseBundle,
    {
      caseId: CASE_ID,
      budgetAdjustments: [
        {
          id: "budget-local-1",
          previousTargetAmount: 4200,
          currentTargetAmount: 5300,
          reason: "加上复查和后续药费",
          timestampLabel: "今天 10:00",
          createdAt: "2026-04-19T02:00:00Z",
        },
      ],
      expenseSubmissions: [
        {
          id: "expense-local-1",
          title: "支付：复查 + 药费",
          amount: 2600,
          timestampLabel: "今天 11:00",
          assetUrls: ["https://local.test/receipt-orange.png"],
          createdAt: "2026-04-19T03:00:00Z",
        },
      ],
    },
  );

  const detail = finalizePublicDetailPresentationCore(
    getPublicDetailVM(resolvedBundle),
    {
      caseId: CASE_ID,
      budgetAdjustments: [
        {
          id: "budget-local-1",
          previousTargetAmount: 4200,
          currentTargetAmount: 5300,
          reason: "加上复查和后续药费",
          timestampLabel: "今天 10:00",
          createdAt: "2026-04-19T02:00:00Z",
        },
      ],
      expenseSubmissions: [
        {
          id: "expense-local-1",
          title: "支付：复查 + 药费",
          amount: 2600,
          timestampLabel: "今天 11:00",
          assetUrls: ["https://local.test/receipt-orange.png"],
          createdAt: "2026-04-19T03:00:00Z",
        },
      ],
    },
  );
  const homepageCard = getHomepageCaseCardVM(resolvedBundle);

  assert.ok(detail);
  assert.equal(detail?.ledger.targetAmount, 5300);
  assert.equal(detail?.ledger.targetAmountLabel, "¥5,300");
  assert.equal(detail?.ledger.confirmedExpenseAmount, 2880);
  assert.equal(detail?.timeline[0]?.label, "预算调整");
  assert.equal(detail?.timeline[0]?.timestampLabel, "今天 10:00");
  assert.equal(detail?.timeline[1]?.label, "支出记录");
  assert.equal(detail?.timeline[1]?.timestampLabel, "今天 11:00");
  assert.equal(detail?.timeline[1]?.amountLabel, "- ¥2,600.00");
  assert.deepEqual(detail?.timeline[1]?.assetUrls, ["https://local.test/receipt-orange.png"]);

  assert.ok(homepageCard);
  assert.equal(homepageCard?.targetAmountLabel, "¥5,300");
  assert.equal(homepageCard?.amountLabel, "¥100 / ¥5,300");
  assert.equal(homepageCard?.fundingStatusSummary, "‼️ 当前垫付较多");
});

test("local presentation can be disabled for formal remote read paths", () => {
  const resolvedBundle = resolveBundlePresentationCore(
    sampleCaseBundle as CanonicalCaseBundle,
    {
      caseId: CASE_ID,
      applyLocalOverlays: false,
      titleOverride: "本地改名小橘",
      coverOverride: "https://local.test/cover-orange.png",
      statusSubmissions: [
        {
          id: "status-local-1",
          statusLabel: "康复观察",
          description: "今天开始自己吃饭了",
          timestampLabel: "今天 09:30",
          assetUrls: ["https://local.test/progress-orange.png"],
          createdAt: "2026-04-19T01:30:00Z",
        },
      ],
      budgetAdjustments: [
        {
          id: "budget-local-1",
          previousTargetAmount: 4200,
          currentTargetAmount: 5300,
          reason: "加上复查和后续药费",
          timestampLabel: "今天 10:00",
          createdAt: "2026-04-19T02:00:00Z",
        },
      ],
      expenseSubmissions: [
        {
          id: "expense-local-1",
          title: "支付：复查 + 药费",
          amount: 2600,
          timestampLabel: "今天 11:00",
          assetUrls: ["https://local.test/receipt-orange.png"],
          createdAt: "2026-04-19T03:00:00Z",
        },
      ],
    },
  );
  const detail = finalizePublicDetailPresentationCore(
    getPublicDetailVM(resolvedBundle),
    {
      caseId: CASE_ID,
      applyLocalOverlays: false,
      statusSubmissions: [
        {
          id: "status-local-1",
          statusLabel: "康复观察",
          description: "今天开始自己吃饭了",
          timestampLabel: "今天 09:30",
          assetUrls: ["https://local.test/progress-orange.png"],
          createdAt: "2026-04-19T01:30:00Z",
        },
      ],
    },
  );

  assert.ok(detail);
  assert.equal(resolvedBundle.case.animalName, sampleCaseBundle.case.animalName);
  assert.equal(resolvedBundle.case.coverAssetId, sampleCaseBundle.case.coverAssetId);
  assert.equal(resolvedBundle.case.targetAmount, sampleCaseBundle.case.targetAmount);
  assert.equal(
    resolvedBundle.events.some((event) => event.id.startsWith("overlay:")),
    false,
  );
  assert.equal(
    resolvedBundle.expenseRecords?.some((record) => record.id.startsWith("overlay-")),
    false,
  );
  assert.equal(detail.updatedAtLabel, getPublicDetailVM(sampleCaseBundle as CanonicalCaseBundle).updatedAtLabel);
  assert.equal(detail.latestTimelineSummary, getPublicDetailVM(sampleCaseBundle as CanonicalCaseBundle).latestTimelineSummary);
  assert.equal(
    detail.timeline.some((item) => item.id.startsWith("overlay:")),
    false,
  );
});
