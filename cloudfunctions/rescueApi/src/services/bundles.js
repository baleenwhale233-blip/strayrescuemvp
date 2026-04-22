function createBundleService({
  collections,
  dbCommand,
  getAssetFileID,
  getCaseId,
  getOne,
  getTempFileURLMap,
  nowIso,
  profileKey,
  queryCollection,
  recomputeThreads,
  toCanonicalAsset,
  toCanonicalCase,
  toCanonicalEvent,
  toCanonicalExpenseRecord,
  toCanonicalRescuer,
  toCanonicalSharedEvidenceGroup,
  toCanonicalSupportEntry,
  withTempFileURL,
}) {
  async function composeBundles(caseDocs) {
    const cases = caseDocs.map(toCanonicalCase);
    const caseIds = cases.map((item) => item.id).filter(Boolean);
    const rescuerIds = cases.map((item) => item.rescuerId).filter(Boolean);

    if (!caseIds.length) {
      return [];
    }

    const profiles = await queryCollection(collections.profiles, {
      openid: dbCommand.in(rescuerIds),
    });
    const profileAssetIds = [
      ...new Set(
        profiles.flatMap((profile) =>
          [profile.avatarAssetId, profile.paymentQrAssetId].filter(Boolean),
        ),
      ),
    ];
    const [events, expenses, supportEntries, supportThreads, assets, profileAssets, sharedGroups] =
      await Promise.all([
        queryCollection(collections.events, {
          caseId: dbCommand.in(caseIds),
        }),
        queryCollection(collections.expenses, {
          caseId: dbCommand.in(caseIds),
        }),
        queryCollection(collections.supportEntries, {
          caseId: dbCommand.in(caseIds),
        }),
        queryCollection(collections.supportThreads, {
          caseId: dbCommand.in(caseIds),
        }),
        queryCollection(collections.assets, {
          caseId: dbCommand.in(caseIds),
        }),
        profileAssetIds.length
          ? queryCollection(collections.assets, {
              assetId: dbCommand.in(profileAssetIds),
            })
          : Promise.resolve([]),
        queryCollection(collections.sharedEvidenceGroups, {
          caseId: dbCommand.in(caseIds),
        }),
      ]);
    const tempFileURLMap = await getTempFileURLMap([
      ...assets.map(getAssetFileID),
      ...profileAssets.map(getAssetFileID),
      ...caseDocs.map((doc) => doc.coverFileID),
    ]);

    const profileMap = new Map(profiles.map((profile) => [profileKey(profile), profile]));
    const canonicalEntries = supportEntries.map(toCanonicalSupportEntry);
    const recomputedThreads = recomputeThreads(canonicalEntries);

    return cases.map((caseRecord) => {
      const caseId = caseRecord.id;
      const caseDoc = caseDocs.find((doc) => getCaseId(doc) === caseId) || {};
      const profile = profileMap.get(caseRecord.rescuerId) || {};
      const caseAssets = assets
        .filter((doc) => doc.caseId === caseId)
        .map((doc) => toCanonicalAsset(withTempFileURL(doc, tempFileURLMap)));
      const profileAssetIds = [
        profile.avatarAssetId,
        profile.paymentQrAssetId,
      ].filter(Boolean);
      const profileScopedAssets = profileAssets
        .filter((doc) => profileAssetIds.includes(doc.assetId || doc.id || doc._id))
        .map((doc) => toCanonicalAsset(withTempFileURL(doc, tempFileURLMap)));

      if (caseDoc.coverFileID) {
        caseAssets.push({
          id: `${caseId}_cover`,
          kind: "case_cover",
          originalUrl: tempFileURLMap.get(caseDoc.coverFileID) || caseDoc.coverFileID,
          watermarkedUrl: tempFileURLMap.get(caseDoc.coverFileID) || caseDoc.coverFileID,
          thumbnailUrl: tempFileURLMap.get(caseDoc.coverFileID) || caseDoc.coverFileID,
        });
      }

      return {
        sourceKind: "remote",
        rescuer: toCanonicalRescuer(profile, caseRecord.rescuerId),
        case: caseRecord,
        events: events
          .filter((doc) => doc.caseId === caseId)
          .map(toCanonicalEvent),
        assets: [...caseAssets, ...profileScopedAssets],
        sharedEvidenceGroups: sharedGroups
          .filter((doc) => doc.caseId === caseId)
          .map(toCanonicalSharedEvidenceGroup),
        expenseRecords: expenses
          .filter((doc) => doc.caseId === caseId)
          .map(toCanonicalExpenseRecord),
        supportEntries: canonicalEntries.filter((entry) => entry.caseId === caseId),
        supportThreads: (supportThreads.length
          ? supportThreads.map((doc) => ({
              id: doc.threadId || doc.id || doc._id,
              caseId: doc.caseId,
              supporterUserId: doc.supporterUserId || doc.supporterOpenid,
              supporterNameMasked: doc.supporterNameMasked,
              createdAt: doc.createdAt || nowIso(),
              updatedAt: doc.updatedAt || doc.createdAt || nowIso(),
              totalConfirmedAmount: Number(doc.totalConfirmedAmount || 0),
              totalPendingAmount: Number(doc.totalPendingAmount || 0),
              totalUnmatchedAmount: Number(doc.totalUnmatchedAmount || 0),
              pendingCount: Number(doc.pendingCount || 0),
              unmatchedCount: Number(doc.unmatchedCount || 0),
              latestStatusSummary: doc.latestStatusSummary,
            }))
          : recomputedThreads
        ).filter((thread) => thread.caseId === caseId),
      };
    });
  }

  async function getCaseDocByCaseId(caseId) {
    if (!caseId) {
      return undefined;
    }

    return (
      (await getOne(collections.cases, {
        caseId,
      })) ||
      (await getOne(collections.cases, {
        _id: caseId,
      }))
    );
  }

  async function getBundleByCaseId(caseId) {
    if (!caseId) {
      return undefined;
    }

    const caseDoc = await getCaseDocByCaseId(caseId);
    const bundles = await composeBundles([caseDoc].filter(Boolean));

    return bundles[0];
  }

  return {
    composeBundles,
    getBundleByCaseId,
    getCaseDocByCaseId,
  };
}

module.exports = {
  createBundleService,
};
