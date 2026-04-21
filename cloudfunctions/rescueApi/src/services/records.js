const { createContentWritesService } = require("./contentWrites");
const { createRecordAssetService } = require("./recordAssets");
const {
  createRecordDetailsService,
  getExpenseItemsFromRecord,
  toRecordDetailPayload,
  toRecordImageFromAsset,
  toRecordType,
} = require("./recordDetails");

function createRecordsService(deps) {
  const assetService = createRecordAssetService(deps);
  const detailService = createRecordDetailsService({
    ...deps,
    getAssetMapByIds: assetService.getAssetMapByIds,
  });
  const writeService = createContentWritesService({
    ...deps,
    createAssetDocs: assetService.createAssetDocs,
  });

  return {
    ...writeService,
    ...detailService,
  };
}

module.exports = {
  createRecordsService,
  getExpenseItemsFromRecord,
  toRecordDetailPayload,
  toRecordImageFromAsset,
  toRecordType,
};
