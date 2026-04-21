import type {
  CanonicalCaseBundle,
  CanonicalRescuer,
  HomepageCaseCardVM,
  PublicDetailVM,
  WorkbenchCaseCardVM,
  WorkbenchVM,
} from "../../types";

type BuildRescuerHomepageInput = {
  rescuer?: CanonicalRescuer;
  bundles: CanonicalCaseBundle[];
  rescuerId?: string;
  caseId?: string;
};

type ReadHelperDeps = {
  resolveBundlesPresentation: (bundles: CanonicalCaseBundle[]) => CanonicalCaseBundle[];
  getHomepageCaseCardVM: (bundle: CanonicalCaseBundle) => HomepageCaseCardVM;
  finalizeHomepageCaseCardPresentation: (
    card: HomepageCaseCardVM,
    input: { caseId?: string },
  ) => HomepageCaseCardVM;
  finalizeWorkbenchCaseCardPresentation: (
    card: WorkbenchCaseCardVM,
    input: { caseId?: string },
  ) => WorkbenchCaseCardVM;
  formatCurrency?: (amount: number) => string;
  localSupporterId?: string;
};

export function finalizeWorkbenchVM(
  vm: WorkbenchVM | undefined,
  deps: ReadHelperDeps,
) {
  if (!vm) {
    return undefined;
  }

  return {
    ...vm,
    activeCases: vm.activeCases.map((card) =>
      deps.finalizeWorkbenchCaseCardPresentation(card, { caseId: card.caseId }),
    ),
    draftCases: vm.draftCases.map((card) =>
      deps.finalizeWorkbenchCaseCardPresentation(card, { caseId: card.caseId }),
    ),
    archivedCases: vm.archivedCases.map((card) =>
      deps.finalizeWorkbenchCaseCardPresentation(card, { caseId: card.caseId }),
    ),
  };
}

export function buildRescuerHomepageVMFromBundles(
  input: BuildRescuerHomepageInput,
  deps: ReadHelperDeps,
) {
  const resolvedBundles = deps.resolveBundlesPresentation(input.bundles);
  const targetRescuerId =
    input.rescuerId ||
    input.rescuer?.id ||
    (input.caseId
      ? resolvedBundles.find((bundle) => bundle.case.id === input.caseId)?.rescuer.id
      : undefined) ||
    resolvedBundles[0]?.rescuer.id;

  if (!targetRescuerId) {
    return undefined;
  }

  const rescuerBundles = resolvedBundles
    .filter(
      (bundle) =>
        bundle.rescuer.id === targetRescuerId &&
        bundle.case.visibility === "published",
    )
    .sort((left, right) => right.case.updatedAt.localeCompare(left.case.updatedAt));
  const rescuer =
    input.rescuer ||
    rescuerBundles[0]?.rescuer ||
    resolvedBundles.find((bundle) => bundle.rescuer.id === targetRescuerId)?.rescuer;

  if (!rescuer) {
    return undefined;
  }

  return {
    rescuer: {
      id: rescuer.id,
      name: rescuer.name,
      avatarUrl: rescuer.avatarUrl,
      stats: rescuer.stats,
    },
    cards: rescuerBundles.map((bundle) =>
      deps.finalizeHomepageCaseCardPresentation(
        deps.getHomepageCaseCardVM(bundle),
        {
          caseId: bundle.case.id,
        },
      ),
    ),
    profileEntryEnabled: true,
  };
}

export function buildMySupportHistoryFromDetails(
  details: PublicDetailVM[],
  deps: Pick<ReadHelperDeps, "formatCurrency" | "localSupporterId">,
) {
  const localSupporterId = deps.localSupporterId || "supporter_current_user";
  const formatCurrency = deps.formatCurrency || ((amount: number) => `¥${amount}`);
  const supportCases = details
    .map((detail) => {
      const thread = detail.supportSummary.threads.find(
        (item) => item.supporterUserId === localSupporterId,
      );
      const amount =
        thread?.entries
          .filter((entry) => entry.status === "confirmed")
          .reduce((sum, entry) => sum + entry.amount, 0) || 0;

      return {
        caseId: detail.caseId,
        publicCaseId: detail.publicCaseId,
        animalName: detail.title,
        animalCoverImageUrl: detail.heroImageUrl || "",
        myTotalSupportedAmount: amount,
        myTotalSupportedAmountLabel: formatCurrency(amount),
        latestSupportedAtLabel:
          thread?.latestEntryAtLabel || detail.updatedAtLabel,
      };
    })
    .filter((item) => item.myTotalSupportedAmount > 0)
    .sort(
      (left, right) =>
        right.myTotalSupportedAmount - left.myTotalSupportedAmount,
    );
  const totalSupportedAmount = supportCases.reduce(
    (sum, item) => sum + item.myTotalSupportedAmount,
    0,
  );

  return {
    totalSupportedAmount,
    totalSupportedAmountLabel: formatCurrency(totalSupportedAmount),
    supportCases,
  };
}
