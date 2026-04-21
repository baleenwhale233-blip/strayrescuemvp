function createReadActionsService({
  collections,
  composeBundles,
  dbCommand,
  fail,
  formatCurrencyLabel,
  formatDateLabel,
  getBundleByCaseId,
  getCaseDocByCaseId,
  getCaseId,
  getHeroImageUrlFromBundle,
  getOne,
  getProfileByOpenid,
  ok,
  queryCollection,
  toCanonicalRescuer,
}) {
  async function getMySupportHistory(openid) {
    const entries = await queryCollection(collections.supportEntries, {
      supporterUserId: openid,
      status: "confirmed",
    }, 1000);
    const caseIds = [...new Set(entries.map((entry) => entry.caseId).filter(Boolean))];

    if (!caseIds.length) {
      return ok({
        summary: {
          totalSupportedAmount: 0,
          totalSupportedAmountLabel: formatCurrencyLabel(0),
          supportCases: [],
        },
      });
    }

    const caseDocs = await queryCollection(collections.cases, {
      caseId: dbCommand.in(caseIds),
    }, 1000);
    const bundles = await composeBundles(caseDocs);
    const caseMap = new Map(bundles.map((bundle) => [bundle.case.id, bundle]));
    const items = caseIds
      .map((caseId) => {
        const caseEntries = entries.filter((entry) => entry.caseId === caseId);
        const amount = caseEntries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
        const latestSupportedAt = caseEntries
          .map((entry) => entry.supportedAt || entry.confirmedAt || entry.updatedAt || entry.createdAt)
          .filter(Boolean)
          .sort()
          .pop();
        const bundle = caseMap.get(caseId);
        const coverUrl = getHeroImageUrlFromBundle(bundle);

        return {
          caseId,
          publicCaseId: bundle?.case.publicCaseId,
          animalName: bundle?.case.animalName || "未命名救助",
          animalCoverImageUrl: coverUrl,
          myTotalSupportedAmount: amount,
          myTotalSupportedAmountLabel: formatCurrencyLabel(amount),
          latestSupportedAt,
          latestSupportedAtLabel: latestSupportedAt ? formatDateLabel(latestSupportedAt) : "",
        };
      })
      .filter((item) => item.myTotalSupportedAmount > 0)
      .sort((left, right) => String(right.latestSupportedAt || "").localeCompare(String(left.latestSupportedAt || "")));
    const total = items.reduce((sum, item) => sum + item.myTotalSupportedAmount, 0);

    return ok({
      summary: {
        totalSupportedAmount: total,
        totalSupportedAmountLabel: formatCurrencyLabel(total),
        supportCases: items,
      },
    });
  }

  async function listHomepageCases() {
    const caseDocs = await queryCollection(collections.cases, {
      visibility: "published",
    });
    const bundles = await composeBundles(caseDocs);

    return ok({ bundles });
  }

  async function getRescuerHomepage(_, input) {
    let rescuerId = String(input?.rescuerId || "").trim();

    if (!rescuerId && input?.caseId) {
      const caseDoc = await getCaseDocByCaseId(input.caseId);
      rescuerId = caseDoc?.rescuerId || caseDoc?.rescuerOpenid || caseDoc?._openid || "";
    }

    if (!rescuerId) {
      return ok({ rescuer: undefined, bundles: [] });
    }

    const [byOpenid, byRescuerId, profile] = await Promise.all([
      queryCollection(collections.cases, {
        rescuerOpenid: rescuerId,
        visibility: "published",
      }, 1000),
      queryCollection(collections.cases, {
        rescuerId,
        visibility: "published",
      }, 1000),
      getProfileByOpenid(rescuerId),
    ]);
    const caseMap = new Map();

    [...byOpenid, ...byRescuerId].forEach((doc) => {
      caseMap.set(getCaseId(doc), doc);
    });

    const caseDocs = [...caseMap.values()].sort((left, right) =>
      String(right.updatedAt || "").localeCompare(String(left.updatedAt || "")),
    );
    const bundles = await composeBundles(caseDocs);

    return ok({
      rescuer: toCanonicalRescuer(profile || {}, rescuerId),
      bundles,
    });
  }

  async function searchCaseByPublicId(input) {
    const raw = String(input?.publicCaseId || "").trim().toUpperCase();
    const digits = raw.replace(/[^\d]/g, "");
    const publicCaseId = digits ? `JM${digits}` : raw;
    const caseDoc = await getOne(collections.cases, {
      publicCaseId,
      visibility: "published",
    });
    const bundles = await composeBundles(caseDoc ? [caseDoc] : []);

    return ok({ bundle: bundles[0] });
  }

  async function getCaseDetail(input) {
    return ok({ bundle: await getBundleByCaseId(input?.caseId) });
  }

  async function getOwnerWorkbench(openid) {
    const caseDocs = await queryCollection(collections.cases, {
      rescuerOpenid: openid,
    });
    const bundles = await composeBundles(caseDocs);

    return ok({ bundles });
  }

  async function getOwnerCaseDetail(openid, input) {
    const bundle = await getBundleByCaseId(input?.caseId);

    if (!bundle) {
      return fail("CASE_NOT_FOUND");
    }

    if (bundle.case.rescuerId !== openid) {
      return fail("FORBIDDEN", "Only the rescuer can manage this case.");
    }

    return ok({ bundle });
  }

  return {
    getCaseDetail,
    getMySupportHistory,
    getOwnerCaseDetail,
    getOwnerWorkbench,
    getRescuerHomepage,
    listHomepageCases,
    searchCaseByPublicId,
  };
}

module.exports = {
  createReadActionsService,
};
