import assert from "node:assert/strict";
import test from "node:test";

import type {
  CanonicalCaseBundle,
  HomepageCaseCardVM,
  PublicDetailVM,
  WorkbenchCaseCardVM,
  WorkbenchVM,
} from "../types";
import {
  applySupportHistoryPresentation,
  buildRescuerHomepageVMFromBundles,
  buildMySupportHistoryFromDetails,
  finalizeWorkbenchVM,
} from "./remote/readHelpers";

const makeBundle = (overrides: Partial<CanonicalCaseBundle>): CanonicalCaseBundle => ({
  sourceKind: "remote",
  rescuer: {
    id: "rescuer_1",
    name: "阿青",
    avatarUrl: "https://example.com/avatar.png",
    verifiedLevel: "wechat",
    joinedAt: "2026-04-01T00:00:00.000Z",
    stats: {
      publishedCaseCount: 2,
      verifiedReceiptCount: 3,
    },
  },
  case: {
    id: "case_1",
    rescuerId: "rescuer_1",
    animalName: "小橘",
    species: "cat",
    initialSummary: "说明",
    currentStatus: "medical",
    currentStatusLabel: "医疗处理中",
    targetAmount: 1000,
    visibility: "published",
    createdAt: "2026-04-01T00:00:00.000Z",
    updatedAt: "2026-04-02T00:00:00.000Z",
    ...overrides.case,
  },
  events: [],
  assets: [],
  ...overrides,
});

test("buildRescuerHomepageVMFromBundles keeps only published cases and sorts newest first", () => {
  const bundles = [
    makeBundle({
      case: {
        id: "case_old",
        rescuerId: "rescuer_1",
        animalName: "旧案例",
        species: "cat",
        initialSummary: "旧",
        currentStatus: "medical",
        currentStatusLabel: "医疗处理中",
        targetAmount: 1000,
        visibility: "published",
        createdAt: "2026-04-01T00:00:00.000Z",
        updatedAt: "2026-04-02T00:00:00.000Z",
      },
    }),
    makeBundle({
      case: {
        id: "case_new",
        rescuerId: "rescuer_1",
        animalName: "新案例",
        species: "cat",
        initialSummary: "新",
        currentStatus: "medical",
        currentStatusLabel: "医疗处理中",
        targetAmount: 1000,
        visibility: "published",
        createdAt: "2026-04-01T00:00:00.000Z",
        updatedAt: "2026-04-03T00:00:00.000Z",
      },
    }),
    makeBundle({
      case: {
        id: "case_draft",
        rescuerId: "rescuer_1",
        animalName: "草稿案例",
        species: "cat",
        initialSummary: "草稿",
        currentStatus: "draft",
        currentStatusLabel: "草稿中",
        targetAmount: 1000,
        visibility: "draft",
        createdAt: "2026-04-01T00:00:00.000Z",
        updatedAt: "2026-04-04T00:00:00.000Z",
      },
    }),
  ];

  const vm = buildRescuerHomepageVMFromBundles(
    {
      bundles,
      rescuerId: "rescuer_1",
    },
    {
      resolveBundlesPresentation: (input: CanonicalCaseBundle[]) => input,
      getHomepageCaseCardVM: (bundle: CanonicalCaseBundle): HomepageCaseCardVM => ({
        caseId: bundle.case.id,
        publicCaseId: "JM000001",
        rescuerId: bundle.rescuer.id,
        sourceKind: bundle.sourceKind,
        title: bundle.case.animalName,
        aboutSummary: bundle.case.initialSummary,
        statusLabel: bundle.case.currentStatusLabel,
        statusTone: "active",
        updatedAtLabel: bundle.case.updatedAt,
        latestStatusSummary: bundle.case.initialSummary,
        fundingStatusSummary: "即将筹满",
        evidenceLevel: "basic",
        homepageEligibilityStatus: "eligible",
        homepageEligibilityReason: "已满足首页条件",
        progressPercent: 0,
        amountLabel: "¥0 / ¥1000",
        targetAmountLabel: "¥1000",
        supportedAmountLabel: "¥0",
        rescuerAdvanceAmountLabel: "¥0",
        supportedProgressPercent: 0,
        rescuerAdvanceProgressPercent: 0,
      }),
      finalizeHomepageCaseCardPresentation: (card: HomepageCaseCardVM) => card,
      finalizeWorkbenchCaseCardPresentation: (card: WorkbenchCaseCardVM) => card,
    },
  );

  assert.ok(vm);
  assert.deepEqual(vm?.cards.map((card: HomepageCaseCardVM) => card.caseId), [
    "case_new",
    "case_old",
  ]);
  assert.equal(vm?.profileEntryEnabled, true);
});

test("finalizeWorkbenchVM applies presentation finalizer to all card buckets", () => {
  const vm: WorkbenchVM = {
    rescuer: {
      id: "rescuer_1",
      name: "阿青",
      avatarUrl: "https://example.com/avatar.png",
      verifiedLevel: "wechat",
    },
    counts: { active: 1, draft: 1, archived: 1 },
    activeCases: [
      {
        caseId: "case_active",
        title: "进行中",
        sourceKind: "remote",
        statusLabel: "医疗处理中",
        statusTone: "active",
        updatedAtLabel: "2026-04-03T00:00:00.000Z",
        visibility: "published",
        currentStatus: "medical",
        targetAmountLabel: "目标 ¥1000",
      },
    ],
    draftCases: [
      {
        caseId: "case_draft",
        title: "草稿",
        sourceKind: "local",
        statusLabel: "草稿中",
        statusTone: "draft",
        updatedAtLabel: "2026-04-02T00:00:00.000Z",
        visibility: "draft",
        currentStatus: "draft",
        targetAmountLabel: "目标 ¥1000",
      },
    ],
    archivedCases: [
      {
        caseId: "case_archived",
        title: "已归档",
        sourceKind: "remote",
        statusLabel: "已完成",
        statusTone: "done",
        updatedAtLabel: "2026-04-01T00:00:00.000Z",
        visibility: "archived",
        currentStatus: "completed",
        targetAmountLabel: "目标 ¥1000",
      },
    ],
  };

  const seen: string[] = [];
  const result = finalizeWorkbenchVM(vm, {
    resolveBundlesPresentation: (input: CanonicalCaseBundle[]) => input,
    getHomepageCaseCardVM: () => {
      throw new Error("not used");
    },
    finalizeHomepageCaseCardPresentation: (card: HomepageCaseCardVM) => card,
    finalizeWorkbenchCaseCardPresentation: (card: WorkbenchCaseCardVM) => {
      seen.push(card.caseId);
      return {
        ...card,
        updatedAtLabel: `${card.updatedAtLabel}#final`,
      };
    },
  });

  assert.deepEqual(seen, ["case_active", "case_draft", "case_archived"]);
  assert.deepEqual(
    result?.activeCases.map((card: WorkbenchCaseCardVM) => card.updatedAtLabel),
    ["2026-04-03T00:00:00.000Z#final"],
  );
  assert.deepEqual(
    result?.draftCases.map((card: WorkbenchCaseCardVM) => card.updatedAtLabel),
    ["2026-04-02T00:00:00.000Z#final"],
  );
  assert.deepEqual(
    result?.archivedCases.map((card: WorkbenchCaseCardVM) => card.updatedAtLabel),
    ["2026-04-01T00:00:00.000Z#final"],
  );
});

test("support history helpers preserve local totals and presentation overrides", () => {
  const summary = applySupportHistoryPresentation(
    {
      totalSupportedAmount: 88,
      totalSupportedAmountLabel: "¥88",
      supportCases: [
        {
          caseId: "case_1",
          publicCaseId: "JM000001",
          animalName: "原始名字",
          animalCoverImageUrl: "https://example.com/original-cover.png",
          myTotalSupportedAmount: 88,
          myTotalSupportedAmountLabel: "¥88",
          latestSupportedAtLabel: "04-20 10:00",
        },
      ],
    },
    {
      resolvePresentedTitle: () => "展示名",
      resolvePresentedCover: () => "https://example.com/presented-cover.png",
    },
  );

  assert.equal(summary.supportCases[0]?.animalName, "展示名");
  assert.equal(
    summary.supportCases[0]?.animalCoverImageUrl,
    "https://example.com/presented-cover.png",
  );

  const built = buildMySupportHistoryFromDetails(
    [
      {
        caseId: "case_1",
        publicCaseId: "JM000001",
        title: "小橘",
        heroImageUrl: "https://example.com/case_1.png",
        updatedAtLabel: "04-20 10:00",
        supportSummary: {
          confirmedSupportAmount: 88,
          confirmedSupportAmountLabel: "¥88",
          pendingSupportEntryCount: 0,
          unmatchedSupportEntryCount: 0,
          threads: [
            {
              id: "thread_1",
              supporterUserId: "supporter_current_user",
              confirmedAmount: 88,
              confirmedAmountLabel: "¥88",
              pendingCount: 0,
              unmatchedCount: 0,
              latestEntryAtLabel: "04-20 10:00",
              entries: [
                {
                  id: "entry_1",
                  amount: 88,
                  amountLabel: "¥88",
                  status: "confirmed",
                  statusLabel: "已确认",
                  supportedAtLabel: "04-20 10:00",
                  hasScreenshot: true,
                  screenshotUrls: [],
                },
              ],
            },
          ],
        },
      } as unknown as PublicDetailVM,
    ],
    {
      formatCurrency: (amount) => `¥${amount}`,
      localSupporterId: "supporter_current_user",
    },
  );

  assert.equal(built.totalSupportedAmount, 88);
  assert.equal(built.totalSupportedAmountLabel, "¥88");
  assert.deepEqual(
    built.supportCases.map((item) => item.caseId),
    ["case_1"],
  );
});
