function createRecordAssetService({
  collections,
  db,
  dbCommand,
  getAssetFileID,
  getTempFileURLMap,
  queryCollection,
  withTempFileURL,
}) {
  async function createAssetDocs(input) {
    const {
      caseId,
      fileIds,
      idPrefix,
      kind,
      visibility,
      uploadedByOpenid,
      timestamp,
    } = input;
    const assetIds = [];

    for (const [index, fileID] of fileIds.entries()) {
      const assetId = `${idPrefix}_asset_${index}`;
      assetIds.push(assetId);
      await db.collection(collections.assets).add({
        data: {
          assetId,
          caseId,
          fileID,
          kind,
          visibility,
          uploadedByOpenid,
          createdAt: timestamp,
        },
      });
    }

    return assetIds;
  }

  async function getAssetMapByIds(assetIds = []) {
    const ids = [...new Set(assetIds.filter(Boolean))];
    if (!ids.length) {
      return new Map();
    }

    const docs = await queryCollection(collections.assets, {
      assetId: dbCommand.in(ids),
    }, 1000);
    const tempFileURLMap = await getTempFileURLMap(docs.map(getAssetFileID));

    return new Map(
      docs.map((doc) => [
        doc.assetId || doc.id || doc._id,
        withTempFileURL(doc, tempFileURLMap),
      ]),
    );
  }

  return {
    createAssetDocs,
    getAssetMapByIds,
  };
}

module.exports = {
  createRecordAssetService,
};
