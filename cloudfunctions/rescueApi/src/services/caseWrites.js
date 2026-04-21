function createCaseWritesService({
  collections,
  createId,
  db,
  fail,
  getBundleByCaseId,
  getCaseDocByCaseId,
  isCloudFileID,
  nowIso,
  ok,
}) {
  async function getOwnedBundleOrFailure(openid, caseId) {
    const bundle = await getBundleByCaseId(caseId);

    if (!bundle) {
      return { error: fail("CASE_NOT_FOUND") };
    }

    if (bundle.case.rescuerId !== openid) {
      return { error: fail("FORBIDDEN", "Only the rescuer can manage this case.") };
    }

    return { bundle };
  }

  async function updateCaseProfile(openid, input) {
    const { bundle, error } = await getOwnedBundleOrFailure(openid, input?.caseId);
    if (error) {
      return error;
    }

    const timestamp = nowIso();
    const updateData = {
      updatedAt: timestamp,
    };
    const animalName = String(input?.animalName || "").trim();
    const coverFileID = String(input?.coverFileID || "").trim();

    if (Object.prototype.hasOwnProperty.call(input || {}, "animalName")) {
      if (!animalName) {
        return fail("INVALID_CASE_PROFILE");
      }
      updateData.animalName = animalName;
    }

    if (coverFileID) {
      if (!isCloudFileID(coverFileID)) {
        return fail("INVALID_ASSET_FILE_ID");
      }

      updateData.coverFileID = coverFileID;
      await db.collection(collections.assets).doc(`${bundle.case.id}_cover`).set({
        data: {
          assetId: `${bundle.case.id}_cover`,
          caseId: bundle.case.id,
          fileID: coverFileID,
          kind: "case_cover",
          visibility: "public",
          uploadedByOpenid: openid,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      });
    }

    const caseDoc = await getCaseDocByCaseId(bundle.case.id);
    await db.collection(collections.cases).doc(caseDoc._id).update({
      data: updateData,
    });

    return ok({ bundle: await getBundleByCaseId(bundle.case.id) });
  }

  async function saveDraftCase(openid, input) {
    const draft = input?.draft || {};
    const caseId = draft.caseId || createId("case");
    const timestamp = nowIso();

    await db.collection(collections.cases).doc(caseId).set({
      data: {
        caseId,
        publicCaseId: draft.publicCaseId,
        rescuerOpenid: openid,
        animalName: draft.animalName || draft.name || "未命名救助",
        species: draft.species || "cat",
        coverFileID: draft.coverFileID,
        initialSummary: draft.initialSummary || draft.summary || "",
        currentStatus: draft.currentStatus || "draft",
        currentStatusLabel: draft.currentStatusLabel || "草稿中",
        targetAmount: Number(draft.targetAmount || draft.budget || 0),
        visibility: "draft",
        createdAt: draft.createdAt || timestamp,
        updatedAt: timestamp,
      },
    });

    return ok({ bundle: await getBundleByCaseId(caseId) });
  }

  async function publishCase(openid, input) {
    const caseDoc = await getCaseDocByCaseId(input?.caseId);
    const bundle = await getBundleByCaseId(input?.caseId);

    if (!bundle) {
      return fail("CASE_NOT_FOUND");
    }

    if (bundle.case.rescuerId !== openid) {
      return fail("FORBIDDEN", "Only the rescuer can publish this case.");
    }

    await db.collection(collections.cases).doc(caseDoc._id).update({
      data: {
        visibility: "published",
        updatedAt: nowIso(),
      },
    });

    return ok({ bundle: await getBundleByCaseId(bundle.case.id) });
  }

  async function touchCase(caseId, timestamp = nowIso()) {
    const caseDoc = await getCaseDocByCaseId(caseId);

    if (!caseDoc) {
      return;
    }

    await db.collection(collections.cases).doc(caseDoc._id).update({
      data: {
        updatedAt: timestamp,
      },
    });
  }

  return {
    getOwnedBundleOrFailure,
    publishCase,
    saveDraftCase,
    touchCase,
    updateCaseProfile,
  };
}

module.exports = {
  createCaseWritesService,
};
