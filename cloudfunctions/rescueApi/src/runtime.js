function ok(data) {
  return { ok: true, data };
}

function fail(error, message) {
  return { ok: false, error, message };
}

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizeId(value) {
  return String(value || "unknown").replace(/[^a-zA-Z0-9_-]/g, "_");
}

function isCloudFileID(value) {
  return typeof value === "string" && value.startsWith("cloud://");
}

function hasOnlyCloudFileIDs(values = []) {
  return Array.isArray(values) && values.every((fileID) => isCloudFileID(fileID));
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function hasAnyContactProfileInfo(input = {}) {
  return Boolean(
    hasText(input.wechatId) ||
      hasText(input.paymentQrAssetId) ||
      hasText(input.paymentQrUrl) ||
      hasText(input.qrImagePath),
  );
}

function getAssetFileID(doc = {}) {
  return [doc.fileID, doc.originalUrl, doc.watermarkedUrl, doc.thumbnailUrl].find(
    (value) => isCloudFileID(value),
  );
}

function normalizeOpenid(value) {
  return value || "anonymous";
}

function getCaseId(doc) {
  return doc.caseId || doc.id || doc._id;
}

function createRuntime({ cloud, db }) {
  async function getTempFileURLMap(fileIDs = []) {
    const uniqueFileIDs = [...new Set(fileIDs.filter(isCloudFileID))];
    if (!uniqueFileIDs.length) {
      return new Map();
    }

    try {
      const result = await cloud.getTempFileURL({
        fileList: uniqueFileIDs,
      });
      const fileList = result.fileList || [];

      return new Map(
        fileList
          .filter((item) => item.fileID && item.tempFileURL)
          .map((item) => [item.fileID, item.tempFileURL]),
      );
    } catch (error) {
      console.warn("[rescueApi] getTempFileURL failed", error);
      return new Map();
    }
  }

  function withTempFileURL(doc, tempFileURLMap) {
    const fileID = getAssetFileID(doc);

    if (!fileID) {
      return doc;
    }

    return {
      ...doc,
      _fileID: fileID,
      _tempFileURL: tempFileURLMap.get(fileID),
    };
  }

  function getOpenid(event) {
    const context = cloud.getWXContext();
    return normalizeOpenid(context.OPENID || event?.openid);
  }

  async function queryCollection(name, where = {}, limit = 100) {
    try {
      const result = await db.collection(name).where(where).limit(limit).get();
      return result.data || [];
    } catch (error) {
      console.warn(`[rescueApi] ${name} query failed`, error);
      return [];
    }
  }

  async function getOne(name, where) {
    const items = await queryCollection(name, where, 1);
    return items[0];
  }

  return {
    getOpenid,
    getOne,
    getTempFileURLMap,
    queryCollection,
    withTempFileURL,
  };
}

module.exports = {
  createId,
  createRuntime,
  fail,
  getAssetFileID,
  getCaseId,
  hasAnyContactProfileInfo,
  hasOnlyCloudFileIDs,
  hasText,
  isCloudFileID,
  nowIso,
  ok,
  sanitizeId,
};
