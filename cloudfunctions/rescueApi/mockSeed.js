function computeSupportThreadDoc(threadId, entryDocs) {
  const sorted = [...entryDocs].sort((left, right) =>
    String(left.supportedAt).localeCompare(String(right.supportedAt)),
  );
  const latest = sorted[sorted.length - 1];
  const confirmed = sorted.filter((entry) => entry.status === "confirmed");
  const pending = sorted.filter((entry) => entry.status === "pending");
  const unmatched = sorted.filter((entry) => entry.status === "unmatched");

  return {
    _id: threadId,
    threadId,
    caseId: latest.caseId,
    supporterOpenid: latest.supporterOpenid || latest.supporterUserId,
    supporterUserId: latest.supporterUserId || latest.supporterOpenid,
    supporterNameMasked: latest.supporterNameMasked,
    createdAt: sorted[0]?.createdAt || latest.createdAt,
    updatedAt: latest.updatedAt,
    totalConfirmedAmount: confirmed.reduce((sum, entry) => sum + entry.amount, 0),
    totalPendingAmount: pending.reduce((sum, entry) => sum + entry.amount, 0),
    totalUnmatchedAmount: unmatched.reduce((sum, entry) => sum + entry.amount, 0),
    pendingCount: pending.length,
    unmatchedCount: unmatched.length,
    latestStatusSummary:
      latest.status === "confirmed"
        ? "最近一条已确认"
        : latest.status === "pending"
          ? "最近一条待处理"
          : "最近一条未匹配",
  };
}

function buildMockSeedData({ ownerOpenid, ownerProfile = {}, alphaAssetFileIDs = {} }) {
  const ownerDisplayName = ownerProfile.displayName || "当前救助人";
  const ownerAvatarUrl = ownerProfile.avatarUrl || "";
  const ownerWechatId = ownerProfile.wechatId || "rescuer-notes";
  const assets = [];
  const assetIdsByKey = {};

  function fileID(key) {
    return alphaAssetFileIDs[key] || "";
  }

  function addAsset(key, input) {
    const imageFileID = fileID(key);
    if (!imageFileID) {
      return undefined;
    }

    const assetId = input.assetId || `alpha_${key}`;
    if (!assetIdsByKey[key]) {
      assets.push({
        _id: assetId,
        assetId,
        caseId: input.caseId,
        fileID: imageFileID,
        originalUrl: imageFileID,
        watermarkedUrl: imageFileID,
        thumbnailUrl: imageFileID,
        kind: input.kind || "other",
        visibility: input.visibility || "public",
        uploadedByOpenid: input.uploadedByOpenid || ownerOpenid,
        createdAt: input.createdAt || "2026-04-17T00:00:00.000Z",
        updatedAt: input.updatedAt || "2026-04-17T00:00:00.000Z",
      });
      assetIdsByKey[key] = assetId;
    }

    return assetIdsByKey[key];
  }

  function addCaseAsset(key, caseId, kind, visibility = "public") {
    return addAsset(key, { caseId, kind, visibility });
  }

  function evidenceItem(id, key, caseId, kind, visibility = "public", assetKind = kind) {
    const assetId = addCaseAsset(key, caseId, assetKind, visibility);
    const imageUrl = fileID(key);

    return {
      id,
      kind,
      assetId,
      imageUrl,
      hash: imageUrl || id,
    };
  }

  function compactAssetIds(...ids) {
    return ids.filter(Boolean);
  }

  const ownerPaymentQrAssetId = addAsset("profile_qr_owner", {
    assetId: `profile_${ownerOpenid}_payment_qr`,
    kind: "payment_qr",
    visibility: "private",
    uploadedByOpenid: ownerOpenid,
  });

  const profiles = [
    {
      _id: ownerOpenid,
      openid: ownerOpenid,
      displayName: ownerDisplayName,
      avatarUrl: ownerAvatarUrl,
      verifiedLevel: "wechat",
      joinedAt: "2026-01-12T09:00:00.000Z",
      wechatId: ownerWechatId,
      paymentQrAssetId: ownerPaymentQrAssetId,
      stats: {
        publishedCaseCount: 5,
        verifiedReceiptCount: 18,
      },
    },
    {
      _id: "seed_rescuer_other_001",
      openid: "seed_rescuer_other_001",
      displayName: "阿宁",
      avatarUrl: "",
      verifiedLevel: "wechat",
      joinedAt: "2025-11-22T11:30:00.000Z",
      wechatId: "aning_rescue",
      stats: {
        publishedCaseCount: 2,
        verifiedReceiptCount: 9,
      },
    },
  ];

  const cases = [
    {
      _id: "seed_case_owner_lizi_001",
      caseId: "seed_case_owner_lizi_001",
      publicCaseId: "JM520101",
      rescuerOpenid: ownerOpenid,
      animalName: "栗子",
      species: "cat",
      initialSummary:
        "雨夜在宝山路地库捡到的小橘猫，疑似被车擦碰后躲到水管边，左前腿骨裂、严重脱水，已住院治疗并持续补记账单。",
      currentStatus: "medical",
      currentStatusLabel: "医疗救助中",
      targetAmount: 4200,
      visibility: "published",
      coverFileID: fileID("cover_lizi"),
      foundLocationText: "宝山路旧小区地库",
      foundAt: "2026-04-08T11:20:00.000Z",
      createdAt: "2026-04-08T14:00:00.000Z",
      updatedAt: "2026-04-15T09:40:00.000Z",
    },
    {
      _id: "seed_case_owner_ahuang_002",
      caseId: "seed_case_owner_ahuang_002",
      publicCaseId: "JM520102",
      rescuerOpenid: ownerOpenid,
      animalName: "阿黄",
      species: "dog",
      initialSummary:
        "工地门口守着垃圾桶的黄狗，后腿撕裂伤已缝合，正在恢复训练，近期主要是复查、换药和营养补给。",
      currentStatus: "recovery",
      currentStatusLabel: "恢复中",
      targetAmount: 1800,
      visibility: "published",
      coverFileID: fileID("cover_ahuang"),
      foundLocationText: "顾村公园北门工地围挡边",
      foundAt: "2026-04-01T07:40:00.000Z",
      createdAt: "2026-04-01T09:10:00.000Z",
      updatedAt: "2026-04-14T18:20:00.000Z",
    },
    {
      _id: "seed_case_owner_tuantuan_003",
      caseId: "seed_case_owner_tuantuan_003",
      publicCaseId: "JM520103",
      rescuerOpenid: ownerOpenid,
      animalName: "团团",
      species: "cat",
      initialSummary:
        "超市后门纸箱里发现的奶牛猫，已做基础体检和驱虫，但最近几天只补了账单，还没补公开进展。",
      currentStatus: "newly_found",
      currentStatusLabel: "刚发现待安置",
      targetAmount: 1500,
      visibility: "published",
      coverFileID: fileID("cover_tuantuan"),
      foundLocationText: "超市后门快递堆旁",
      foundAt: "2026-04-10T06:50:00.000Z",
      createdAt: "2026-04-10T08:30:00.000Z",
      updatedAt: "2026-04-13T07:10:00.000Z",
    },
    {
      _id: "seed_case_owner_zhima_004",
      caseId: "seed_case_owner_zhima_004",
      publicCaseId: "JM520104",
      rescuerOpenid: ownerOpenid,
      animalName: "芝麻",
      species: "cat",
      initialSummary:
        "黑猫芝麻有口炎和轻度发烧，已经开始吃药，但票据照片只留了模糊转账截屏，证据还不够完整。",
      currentStatus: "medical",
      currentStatusLabel: "医疗救助中",
      targetAmount: 2600,
      visibility: "published",
      coverFileID: fileID("cover_zhima"),
      foundLocationText: "菜市场后巷喂食点",
      foundAt: "2026-04-11T19:10:00.000Z",
      createdAt: "2026-04-11T20:00:00.000Z",
      updatedAt: "2026-04-14T10:15:00.000Z",
    },
    {
      _id: "seed_case_owner_nuomi_005",
      caseId: "seed_case_owner_nuomi_005",
      publicCaseId: "JM520105",
      rescuerOpenid: ownerOpenid,
      animalName: "糯米",
      species: "dog",
      initialSummary:
        "准备建档中的小白狗，先记了基础发现信息和预算，等明天做检查后再公开。",
      currentStatus: "draft",
      currentStatusLabel: "草稿中",
      targetAmount: 1200,
      visibility: "draft",
      coverFileID: fileID("cover_nuomi"),
      foundLocationText: "学校后街早餐摊旁",
      foundAt: "2026-04-15T06:20:00.000Z",
      createdAt: "2026-04-15T06:50:00.000Z",
      updatedAt: "2026-04-16T08:10:00.000Z",
    },
    {
      _id: "seed_case_other_xiaoman_006",
      caseId: "seed_case_other_xiaoman_006",
      publicCaseId: "JM520106",
      rescuerOpenid: "seed_rescuer_other_001",
      animalName: "小满",
      species: "cat",
      initialSummary:
        "社区里亲人的三花猫，绝育后出现刀口感染，现在已稳定恢复，后续重点是营养和领养筛选。",
      currentStatus: "rehoming",
      currentStatusLabel: "恢复待领养",
      targetAmount: 2300,
      visibility: "published",
      coverFileID: fileID("cover_xiaoman"),
      foundLocationText: "静安寺社区花坛边",
      foundAt: "2026-03-28T10:10:00.000Z",
      createdAt: "2026-03-28T12:00:00.000Z",
      updatedAt: "2026-04-15T16:30:00.000Z",
    },
    {
      _id: "seed_case_owner_miwo_007",
      caseId: "seed_case_owner_miwo_007",
      publicCaseId: "JM520107",
      rescuerOpenid: ownerOpenid,
      animalName: "米窝",
      species: "cat",
      initialSummary:
        "已完成治疗并找到领养的银渐层串串，档案归档保留，方便回看整段透明记录。",
      currentStatus: "completed",
      currentStatusLabel: "已完成",
      targetAmount: 3100,
      visibility: "archived",
      coverFileID: fileID("cover_miwo"),
      foundLocationText: "商场地下停车场出口",
      foundAt: "2026-03-05T18:00:00.000Z",
      createdAt: "2026-03-05T20:20:00.000Z",
      updatedAt: "2026-04-02T13:40:00.000Z",
    },
  ];

  const events = [
    {
      _id: "seed_event_lizi_created",
      eventId: "seed_event_lizi_created",
      caseId: "seed_case_owner_lizi_001",
      type: "case_created",
      occurredAt: "2026-04-08T14:00:00.000Z",
      text: "已创建栗子的透明档案，补充了首诊情况和基础预算。",
      statusLabel: "建档",
      assetIds: compactAssetIds(addCaseAsset("cover_lizi", "seed_case_owner_lizi_001", "case_cover")),
      visibility: "public",
      createdAt: "2026-04-08T14:00:00.000Z",
    },
    {
      _id: "seed_event_lizi_expense_exam",
      eventId: "seed_event_lizi_expense_exam",
      caseId: "seed_case_owner_lizi_001",
      type: "expense",
      occurredAt: "2026-04-08T15:10:00.000Z",
      amount: 1680,
      currency: "CNY",
      merchantName: "安安宠物医院",
      expenseItemsText: "夜诊挂号、X 光、血常规和首晚住院押金",
      verificationStatus: "confirmed",
      assetIds: compactAssetIds(
        addCaseAsset("receipt_lizi_exam", "seed_case_owner_lizi_001", "receipt"),
        addCaseAsset("medical_lizi_exam", "seed_case_owner_lizi_001", "medical_record"),
      ),
      visibility: "public",
      createdAt: "2026-04-08T15:10:00.000Z",
    },
    {
      _id: "seed_event_lizi_progress_1",
      eventId: "seed_event_lizi_progress_1",
      caseId: "seed_case_owner_lizi_001",
      type: "progress_update",
      occurredAt: "2026-04-09T09:20:00.000Z",
      text: "栗子已经能自己抬头吃流食，医生说先观察骨裂位置，今天重点补液和止痛。",
      statusLabel: "医疗救助中",
      assetIds: compactAssetIds(addCaseAsset("progress_lizi_1", "seed_case_owner_lizi_001", "progress_photo")),
      visibility: "public",
      createdAt: "2026-04-09T09:20:00.000Z",
    },
    {
      _id: "seed_event_lizi_budget",
      eventId: "seed_event_lizi_budget",
      caseId: "seed_case_owner_lizi_001",
      type: "budget_adjustment",
      occurredAt: "2026-04-11T18:30:00.000Z",
      previousTargetAmount: 3200,
      newTargetAmount: 4200,
      reason: "复查显示需要继续住院观察并增加固定支具，预算上调 1000 元。",
      assetIds: [],
      visibility: "public",
      createdAt: "2026-04-11T18:30:00.000Z",
    },
    {
      _id: "seed_event_lizi_support",
      eventId: "seed_event_lizi_support",
      caseId: "seed_case_owner_lizi_001",
      type: "support",
      occurredAt: "2026-04-12T13:25:00.000Z",
      supporterUserId: "seed_supporter_a_001",
      amount: 300,
      currency: "CNY",
      supportSource: "donor_claim",
      supporterNameMasked: "小鱼",
      message: "给栗子补一点住院费，辛苦你坚持更新。",
      verificationStatus: "confirmed",
      assetIds: [],
      visibility: "public",
      createdAt: "2026-04-12T13:25:00.000Z",
    },
    {
      _id: "seed_event_lizi_expense_medication",
      eventId: "seed_event_lizi_expense_medication",
      caseId: "seed_case_owner_lizi_001",
      type: "expense",
      occurredAt: "2026-04-13T16:40:00.000Z",
      amount: 420,
      currency: "CNY",
      merchantName: "安安宠物医院",
      expenseItemsText: "消炎针、止痛药和复查拍片",
      verificationStatus: "confirmed",
      assetIds: compactAssetIds(
        addCaseAsset("receipt_lizi_medication", "seed_case_owner_lizi_001", "receipt"),
        addCaseAsset("medical_lizi_medication", "seed_case_owner_lizi_001", "medical_record"),
      ),
      visibility: "public",
      createdAt: "2026-04-13T16:40:00.000Z",
    },
    {
      _id: "seed_event_lizi_progress_2",
      eventId: "seed_event_lizi_progress_2",
      caseId: "seed_case_owner_lizi_001",
      type: "progress_update",
      occurredAt: "2026-04-15T09:40:00.000Z",
      text: "今天拆掉静脉留置针后状态更稳了，能自己走几步，但还需要继续笼养和按时吃药。",
      statusLabel: "医疗救助中",
      assetIds: compactAssetIds(addCaseAsset("progress_lizi_2", "seed_case_owner_lizi_001", "progress_photo")),
      visibility: "public",
      createdAt: "2026-04-15T09:40:00.000Z",
    },
    {
      _id: "seed_event_ahuang_created",
      eventId: "seed_event_ahuang_created",
      caseId: "seed_case_owner_ahuang_002",
      type: "case_created",
      occurredAt: "2026-04-01T09:10:00.000Z",
      text: "已为阿黄建档，记录缝合伤口和术后恢复预算。",
      statusLabel: "建档",
      assetIds: compactAssetIds(addCaseAsset("cover_ahuang", "seed_case_owner_ahuang_002", "case_cover")),
      visibility: "public",
      createdAt: "2026-04-01T09:10:00.000Z",
    },
    {
      _id: "seed_event_ahuang_expense",
      eventId: "seed_event_ahuang_expense",
      caseId: "seed_case_owner_ahuang_002",
      type: "expense",
      occurredAt: "2026-04-02T11:00:00.000Z",
      amount: 980,
      currency: "CNY",
      merchantName: "仁爱动物诊所",
      expenseItemsText: "清创缝合、止血药和三天输液",
      verificationStatus: "confirmed",
      assetIds: compactAssetIds(
        addCaseAsset("receipt_ahuang", "seed_case_owner_ahuang_002", "receipt"),
        addCaseAsset("animal_ahuang", "seed_case_owner_ahuang_002", "animal_photo"),
      ),
      visibility: "public",
      createdAt: "2026-04-02T11:00:00.000Z",
    },
    {
      _id: "seed_event_ahuang_support",
      eventId: "seed_event_ahuang_support",
      caseId: "seed_case_owner_ahuang_002",
      type: "support",
      occurredAt: "2026-04-05T20:10:00.000Z",
      supporterUserId: "seed_supporter_d_004",
      amount: 1200,
      currency: "CNY",
      supportSource: "donor_claim",
      supporterNameMasked: "工地师傅",
      message: "之前一直喂阿黄，这次也想一起分担。",
      verificationStatus: "confirmed",
      assetIds: [],
      visibility: "public",
      createdAt: "2026-04-05T20:10:00.000Z",
    },
    {
      _id: "seed_event_ahuang_progress",
      eventId: "seed_event_ahuang_progress",
      caseId: "seed_case_owner_ahuang_002",
      type: "progress_update",
      occurredAt: "2026-04-14T18:20:00.000Z",
      text: "阿黄已经愿意自己踩地走路，今天换药时没有明显抗拒，后续主要观察伤口收口情况。",
      statusLabel: "恢复中",
      assetIds: compactAssetIds(addCaseAsset("progress_ahuang", "seed_case_owner_ahuang_002", "progress_photo")),
      visibility: "public",
      createdAt: "2026-04-14T18:20:00.000Z",
    },
    {
      _id: "seed_event_tuantuan_created",
      eventId: "seed_event_tuantuan_created",
      caseId: "seed_case_owner_tuantuan_003",
      type: "case_created",
      occurredAt: "2026-04-10T08:30:00.000Z",
      text: "团团已入笼安置，先补了驱虫和基础体检预算。",
      statusLabel: "建档",
      assetIds: compactAssetIds(addCaseAsset("cover_tuantuan", "seed_case_owner_tuantuan_003", "case_cover")),
      visibility: "public",
      createdAt: "2026-04-10T08:30:00.000Z",
    },
    {
      _id: "seed_event_tuantuan_expense",
      eventId: "seed_event_tuantuan_expense",
      caseId: "seed_case_owner_tuantuan_003",
      type: "expense",
      occurredAt: "2026-04-10T10:10:00.000Z",
      amount: 260,
      currency: "CNY",
      merchantName: "社区宠物门诊",
      expenseItemsText: "猫瘟筛查、驱虫和基础营养膏",
      verificationStatus: "confirmed",
      assetIds: compactAssetIds(
        addCaseAsset("receipt_tuantuan", "seed_case_owner_tuantuan_003", "receipt"),
        addCaseAsset("animal_tuantuan", "seed_case_owner_tuantuan_003", "animal_photo"),
      ),
      visibility: "public",
      createdAt: "2026-04-10T10:10:00.000Z",
    },
    {
      _id: "seed_event_zhima_created",
      eventId: "seed_event_zhima_created",
      caseId: "seed_case_owner_zhima_004",
      type: "case_created",
      occurredAt: "2026-04-11T20:00:00.000Z",
      text: "芝麻已开始吃药，先记下门诊检查和近两天观察重点。",
      statusLabel: "建档",
      assetIds: compactAssetIds(addCaseAsset("cover_zhima", "seed_case_owner_zhima_004", "case_cover")),
      visibility: "public",
      createdAt: "2026-04-11T20:00:00.000Z",
    },
    {
      _id: "seed_event_zhima_expense",
      eventId: "seed_event_zhima_expense",
      caseId: "seed_case_owner_zhima_004",
      type: "expense",
      occurredAt: "2026-04-12T09:30:00.000Z",
      amount: 360,
      currency: "CNY",
      merchantName: "菜场边便民宠物诊所",
      expenseItemsText: "口炎检查、退烧针和两天口服药",
      verificationStatus: "confirmed",
      assetIds: [],
      visibility: "public",
      createdAt: "2026-04-12T09:30:00.000Z",
    },
    {
      _id: "seed_event_zhima_progress",
      eventId: "seed_event_zhima_progress",
      caseId: "seed_case_owner_zhima_004",
      type: "progress_update",
      occurredAt: "2026-04-14T10:15:00.000Z",
      text: "芝麻体温已经降下来，但嘴里还很疼，今晚会继续观察进食情况，明天决定要不要复诊。",
      statusLabel: "医疗救助中",
      assetIds: compactAssetIds(addCaseAsset("progress_zhima", "seed_case_owner_zhima_004", "progress_photo")),
      visibility: "public",
      createdAt: "2026-04-14T10:15:00.000Z",
    },
    {
      _id: "seed_event_xiaoman_created",
      eventId: "seed_event_xiaoman_created",
      caseId: "seed_case_other_xiaoman_006",
      type: "case_created",
      occurredAt: "2026-03-28T12:00:00.000Z",
      text: "为小满建档，记录绝育后感染处理和后续领养安排。",
      statusLabel: "建档",
      assetIds: compactAssetIds(addCaseAsset("cover_xiaoman", "seed_case_other_xiaoman_006", "case_cover")),
      visibility: "public",
      createdAt: "2026-03-28T12:00:00.000Z",
    },
    {
      _id: "seed_event_xiaoman_expense",
      eventId: "seed_event_xiaoman_expense",
      caseId: "seed_case_other_xiaoman_006",
      type: "expense",
      occurredAt: "2026-03-29T09:00:00.000Z",
      amount: 780,
      currency: "CNY",
      merchantName: "静安伴侣动物医院",
      expenseItemsText: "刀口感染处理、换药和术后营养包",
      verificationStatus: "confirmed",
      assetIds: [],
      visibility: "public",
      createdAt: "2026-03-29T09:00:00.000Z",
    },
    {
      _id: "seed_event_xiaoman_budget",
      eventId: "seed_event_xiaoman_budget",
      caseId: "seed_case_other_xiaoman_006",
      type: "budget_adjustment",
      occurredAt: "2026-04-02T20:40:00.000Z",
      previousTargetAmount: 1800,
      newTargetAmount: 2300,
      reason: "增加拆线、复查和送养前体内外驱虫预算。",
      assetIds: [],
      visibility: "public",
      createdAt: "2026-04-02T20:40:00.000Z",
    },
    {
      _id: "seed_event_xiaoman_support",
      eventId: "seed_event_xiaoman_support",
      caseId: "seed_case_other_xiaoman_006",
      type: "support",
      occurredAt: "2026-04-05T13:10:00.000Z",
      supporterUserId: "seed_supporter_e_005",
      amount: 500,
      currency: "CNY",
      supportSource: "manual_entry",
      supporterNameMasked: "邻居阿姨",
      message: "小满看起来精神多了，给你补一点复查费。",
      verificationStatus: "confirmed",
      assetIds: [],
      visibility: "public",
      createdAt: "2026-04-05T13:10:00.000Z",
    },
    {
      _id: "seed_event_xiaoman_progress",
      eventId: "seed_event_xiaoman_progress",
      caseId: "seed_case_other_xiaoman_006",
      type: "progress_update",
      occurredAt: "2026-04-15T16:30:00.000Z",
      text: "小满今天拆线顺利，已经开始尝试和人互动，接下来会先观察两天再安排试领养。",
      statusLabel: "恢复待领养",
      assetIds: compactAssetIds(addCaseAsset("progress_xiaoman", "seed_case_other_xiaoman_006", "progress_photo")),
      visibility: "public",
      createdAt: "2026-04-15T16:30:00.000Z",
    },
    {
      _id: "seed_event_miwo_created",
      eventId: "seed_event_miwo_created",
      caseId: "seed_case_owner_miwo_007",
      type: "case_created",
      occurredAt: "2026-03-05T20:20:00.000Z",
      text: "米窝已建档，记录伤口处理和寄养计划。",
      statusLabel: "建档",
      assetIds: compactAssetIds(addCaseAsset("cover_miwo", "seed_case_owner_miwo_007", "case_cover")),
      visibility: "public",
      createdAt: "2026-03-05T20:20:00.000Z",
    },
    {
      _id: "seed_event_miwo_progress",
      eventId: "seed_event_miwo_progress",
      caseId: "seed_case_owner_miwo_007",
      type: "progress_update",
      occurredAt: "2026-04-02T13:40:00.000Z",
      text: "米窝已经顺利到新家试养一周，状态稳定，档案转为归档保留。",
      statusLabel: "已完成",
      assetIds: [],
      visibility: "public",
      createdAt: "2026-04-02T13:40:00.000Z",
    },
  ];

  const expenses = [
    {
      _id: "seed_expense_lizi_exam",
      recordId: "seed_expense_lizi_exam",
      caseId: "seed_case_owner_lizi_001",
      amount: 1680,
      currency: "CNY",
      spentAt: "2026-04-08T15:10:00.000Z",
      category: "medical",
      summary: "夜诊挂号、X 光、血常规和首晚住院押金",
      note: "首晚住院后继续观察呼吸和骨裂位置。",
      merchantName: "安安宠物医院",
      expenseItems: [
        { description: "夜诊挂号", amount: 180 },
        { description: "X 光和血常规", amount: 620 },
        { description: "首晚住院押金", amount: 880 },
      ],
      evidenceItems: [
        evidenceItem("seed_expense_lizi_exam_receipt", "receipt_lizi_exam", "seed_case_owner_lizi_001", "receipt"),
        evidenceItem("seed_expense_lizi_exam_cat", "medical_lizi_exam", "seed_case_owner_lizi_001", "treatment_photo", "public", "medical_record"),
      ],
      evidenceLevel: "complete",
      verificationStatus: "confirmed",
      visibility: "public",
      projectedEventId: "seed_event_lizi_expense_exam",
      createdAt: "2026-04-08T15:10:00.000Z",
    },
    {
      _id: "seed_expense_lizi_medication",
      recordId: "seed_expense_lizi_medication",
      caseId: "seed_case_owner_lizi_001",
      amount: 420,
      currency: "CNY",
      spentAt: "2026-04-13T16:40:00.000Z",
      category: "medication",
      summary: "消炎针、止痛药和复查拍片",
      note: "医生建议继续笼养，避免二次受伤。",
      merchantName: "安安宠物医院",
      expenseItems: [
        { description: "消炎针", amount: 160 },
        { description: "止痛药", amount: 80 },
        { description: "复查拍片", amount: 180 },
      ],
      evidenceItems: [
        evidenceItem("seed_expense_lizi_medication_receipt", "receipt_lizi_medication", "seed_case_owner_lizi_001", "receipt"),
        evidenceItem("seed_expense_lizi_medication_record", "medical_lizi_medication", "seed_case_owner_lizi_001", "treatment_photo", "public", "medical_record"),
      ],
      evidenceLevel: "complete",
      verificationStatus: "confirmed",
      visibility: "public",
      projectedEventId: "seed_event_lizi_expense_medication",
      createdAt: "2026-04-13T16:40:00.000Z",
    },
    {
      _id: "seed_expense_ahuang_001",
      recordId: "seed_expense_ahuang_001",
      caseId: "seed_case_owner_ahuang_002",
      amount: 980,
      currency: "CNY",
      spentAt: "2026-04-02T11:00:00.000Z",
      category: "medical",
      summary: "清创缝合、止血药和三天输液",
      note: "术后第一周重点控制感染。",
      merchantName: "仁爱动物诊所",
      expenseItems: [
        { description: "清创缝合", amount: 520 },
        { description: "止血药", amount: 160 },
        { description: "三天输液", amount: 300 },
      ],
      evidenceItems: [
        evidenceItem("seed_expense_ahuang_receipt", "receipt_ahuang", "seed_case_owner_ahuang_002", "receipt"),
        evidenceItem("seed_expense_ahuang_scene", "animal_ahuang", "seed_case_owner_ahuang_002", "animal_photo"),
      ],
      evidenceLevel: "complete",
      verificationStatus: "confirmed",
      visibility: "public",
      projectedEventId: "seed_event_ahuang_expense",
      createdAt: "2026-04-02T11:00:00.000Z",
    },
    {
      _id: "seed_expense_tuantuan_001",
      recordId: "seed_expense_tuantuan_001",
      caseId: "seed_case_owner_tuantuan_003",
      amount: 260,
      currency: "CNY",
      spentAt: "2026-04-10T10:10:00.000Z",
      category: "medical",
      summary: "猫瘟筛查、驱虫和基础营养膏",
      note: "暂时还没补最近情况更新。",
      merchantName: "社区宠物门诊",
      expenseItems: [
        { description: "猫瘟筛查", amount: 120 },
        { description: "驱虫", amount: 80 },
        { description: "基础营养膏", amount: 60 },
      ],
      evidenceItems: [
        evidenceItem("seed_expense_tuantuan_receipt", "receipt_tuantuan", "seed_case_owner_tuantuan_003", "receipt"),
        evidenceItem("seed_expense_tuantuan_scene", "animal_tuantuan", "seed_case_owner_tuantuan_003", "animal_photo"),
      ],
      evidenceLevel: "complete",
      verificationStatus: "confirmed",
      visibility: "public",
      projectedEventId: "seed_event_tuantuan_expense",
      createdAt: "2026-04-10T10:10:00.000Z",
    },
    {
      _id: "seed_expense_zhima_001",
      recordId: "seed_expense_zhima_001",
      caseId: "seed_case_owner_zhima_004",
      amount: 360,
      currency: "CNY",
      spentAt: "2026-04-12T09:30:00.000Z",
      category: "medical",
      summary: "口炎检查、退烧针和两天口服药",
      note: "先保留模糊截图，待后续补票据和现场照片。",
      merchantName: "菜场边便民宠物诊所",
      evidenceItems: [],
      evidenceLevel: "needs_attention",
      verificationStatus: "confirmed",
      visibility: "public",
      projectedEventId: "seed_event_zhima_expense",
      createdAt: "2026-04-12T09:30:00.000Z",
    },
    {
      _id: "seed_expense_xiaoman_001",
      recordId: "seed_expense_xiaoman_001",
      caseId: "seed_case_other_xiaoman_006",
      amount: 780,
      currency: "CNY",
      spentAt: "2026-03-29T09:00:00.000Z",
      category: "medical",
      summary: "刀口感染处理、换药和术后营养包",
      note: "后续还会有拆线和送养前驱虫费用。",
      merchantName: "静安伴侣动物医院",
      expenseItems: [
        { description: "刀口感染处理", amount: 380 },
        { description: "换药", amount: 160 },
        { description: "术后营养包", amount: 240 },
      ],
      evidenceItems: [
        evidenceItem("seed_expense_xiaoman_receipt", "receipt_xiaoman", "seed_case_other_xiaoman_006", "receipt"),
        evidenceItem("seed_expense_xiaoman_scene", "animal_xiaoman", "seed_case_other_xiaoman_006", "animal_photo"),
      ],
      evidenceLevel: "complete",
      verificationStatus: "confirmed",
      visibility: "public",
      projectedEventId: "seed_event_xiaoman_expense",
      createdAt: "2026-03-29T09:00:00.000Z",
    },
  ];

  const supportEntries = [
    {
      _id: "seed_support_entry_lizi_confirmed",
      entryId: "seed_support_entry_lizi_confirmed",
      supportThreadId: "seed_thread_lizi_xiaoyu",
      caseId: "seed_case_owner_lizi_001",
      supporterOpenid: "seed_supporter_a_001",
      supporterUserId: "seed_supporter_a_001",
      supporterNameMasked: "小鱼",
      amount: 300,
      currency: "CNY",
      supportedAt: "2026-04-12T13:25:00.000Z",
      note: "给栗子补一点住院费，辛苦你坚持更新。",
      screenshotFileIds: fileID("support_lizi_confirmed") ? [fileID("support_lizi_confirmed")] : [],
      screenshotHashes: fileID("support_lizi_confirmed") ? [fileID("support_lizi_confirmed")] : [],
      status: "confirmed",
      visibility: "private",
      createdAt: "2026-04-12T13:25:00.000Z",
      updatedAt: "2026-04-12T14:00:00.000Z",
      confirmedAt: "2026-04-12T14:00:00.000Z",
      confirmedByOpenid: ownerOpenid,
      confirmedByUserId: ownerOpenid,
      projectedEventId: "seed_event_lizi_support",
    },
    {
      _id: "seed_support_entry_lizi_pending",
      entryId: "seed_support_entry_lizi_pending",
      supportThreadId: "seed_thread_lizi_zhouzhou",
      caseId: "seed_case_owner_lizi_001",
      supporterOpenid: "seed_supporter_b_002",
      supporterUserId: "seed_supporter_b_002",
      supporterNameMasked: "舟舟",
      amount: 200,
      currency: "CNY",
      supportedAt: "2026-04-15T08:45:00.000Z",
      note: "昨天刚转，备注写了栗子住院费，麻烦你核对下。",
      screenshotFileIds: fileID("support_lizi_pending") ? [fileID("support_lizi_pending")] : [],
      screenshotHashes: fileID("support_lizi_pending") ? [fileID("support_lizi_pending")] : [],
      status: "pending",
      visibility: "private",
      createdAt: "2026-04-15T08:46:00.000Z",
      updatedAt: "2026-04-15T08:46:00.000Z",
    },
    {
      _id: "seed_support_entry_lizi_unmatched",
      entryId: "seed_support_entry_lizi_unmatched",
      supportThreadId: "seed_thread_lizi_mumu",
      caseId: "seed_case_owner_lizi_001",
      supporterOpenid: "seed_supporter_c_003",
      supporterUserId: "seed_supporter_c_003",
      supporterNameMasked: "木木",
      amount: 180,
      currency: "CNY",
      supportedAt: "2026-04-13T20:05:00.000Z",
      note: "我这边转了 180，截图只截到了部分订单。",
      screenshotFileIds: fileID("support_lizi_unmatched") ? [fileID("support_lizi_unmatched")] : [],
      screenshotHashes: fileID("support_lizi_unmatched") ? [fileID("support_lizi_unmatched")] : [],
      status: "unmatched",
      unmatchedReason: "insufficient_screenshot",
      unmatchedNote: "截图没带完整订单号，先标未匹配等待补充。",
      visibility: "private",
      createdAt: "2026-04-13T20:05:00.000Z",
      updatedAt: "2026-04-14T09:00:00.000Z",
    },
    {
      _id: "seed_support_entry_ahuang_confirmed",
      entryId: "seed_support_entry_ahuang_confirmed",
      supportThreadId: "seed_thread_ahuang_master",
      caseId: "seed_case_owner_ahuang_002",
      supporterOpenid: "seed_supporter_d_004",
      supporterUserId: "seed_supporter_d_004",
      supporterNameMasked: "工地师傅",
      amount: 1200,
      currency: "CNY",
      supportedAt: "2026-04-05T20:10:00.000Z",
      note: "之前一直喂阿黄，这次也想一起分担。",
      screenshotFileIds: fileID("support_ahuang_confirmed") ? [fileID("support_ahuang_confirmed")] : [],
      screenshotHashes: fileID("support_ahuang_confirmed") ? [fileID("support_ahuang_confirmed")] : [],
      status: "confirmed",
      visibility: "private",
      createdAt: "2026-04-05T20:10:00.000Z",
      updatedAt: "2026-04-05T20:18:00.000Z",
      confirmedAt: "2026-04-05T20:18:00.000Z",
      confirmedByOpenid: ownerOpenid,
      confirmedByUserId: ownerOpenid,
      projectedEventId: "seed_event_ahuang_support",
    },
    {
      _id: "seed_support_entry_xiaoman_confirmed",
      entryId: "seed_support_entry_xiaoman_confirmed",
      supportThreadId: "seed_thread_xiaoman_neighbor",
      caseId: "seed_case_other_xiaoman_006",
      supporterOpenid: "seed_supporter_e_005",
      supporterUserId: "seed_supporter_e_005",
      supporterNameMasked: "邻居阿姨",
      amount: 500,
      currency: "CNY",
      supportedAt: "2026-04-05T13:10:00.000Z",
      note: "小满看起来精神多了，给你补一点复查费。",
      screenshotFileIds: fileID("support_xiaoman_confirmed") ? [fileID("support_xiaoman_confirmed")] : [],
      screenshotHashes: fileID("support_xiaoman_confirmed") ? [fileID("support_xiaoman_confirmed")] : [],
      status: "confirmed",
      visibility: "private",
      createdAt: "2026-04-05T13:10:00.000Z",
      updatedAt: "2026-04-05T13:30:00.000Z",
      confirmedAt: "2026-04-05T13:30:00.000Z",
      confirmedByOpenid: "seed_rescuer_other_001",
      confirmedByUserId: "seed_rescuer_other_001",
      projectedEventId: "seed_event_xiaoman_support",
    },
  ];

  const supportThreads = [
    computeSupportThreadDoc("seed_thread_lizi_xiaoyu", [
      supportEntries[0],
    ]),
    computeSupportThreadDoc("seed_thread_lizi_zhouzhou", [
      supportEntries[1],
    ]),
    computeSupportThreadDoc("seed_thread_lizi_mumu", [
      supportEntries[2],
    ]),
    computeSupportThreadDoc("seed_thread_ahuang_master", [
      supportEntries[3],
    ]),
    computeSupportThreadDoc("seed_thread_xiaoman_neighbor", [
      supportEntries[4],
    ]),
  ];

  return {
    profiles,
    cases,
    events,
    expenses,
    supportEntries,
    supportThreads,
    assets,
    sharedEvidenceGroups: [],
  };
}

async function upsertDocs(db, collectionName, docs) {
  await Promise.all(docs.map((doc) => {
    const { _id, ...data } = doc;
    return db.collection(collectionName).doc(doc._id).set({
      data,
    });
  }));
}

async function seedMockData({ db, collections, openid, input = {} }) {
  const ownerOpenid = openid || input.ownerOpenid;

  if (!ownerOpenid) {
    return {
      ownerOpenid: "",
      seeded: false,
      counts: {},
    };
  }

  const seedData = buildMockSeedData({
    ownerOpenid,
    ownerProfile: input.ownerProfile,
    alphaAssetFileIDs: input.alphaAssetFileIDs || {},
  });

  await upsertDocs(db, collections.profiles, seedData.profiles);
  await upsertDocs(db, collections.cases, seedData.cases);
  await upsertDocs(db, collections.events, seedData.events);
  await upsertDocs(db, collections.expenses, seedData.expenses);
  await upsertDocs(db, collections.supportEntries, seedData.supportEntries);
  await upsertDocs(db, collections.supportThreads, seedData.supportThreads);
  await upsertDocs(db, collections.assets, seedData.assets);
  await upsertDocs(db, collections.sharedEvidenceGroups, seedData.sharedEvidenceGroups);

  return {
    ownerOpenid,
    seeded: true,
    counts: {
      profiles: seedData.profiles.length,
      rescueCases: seedData.cases.length,
      caseEvents: seedData.events.length,
      expenseRecords: seedData.expenses.length,
      supportEntries: seedData.supportEntries.length,
      supportThreads: seedData.supportThreads.length,
      evidenceAssets: seedData.assets.length,
      sharedEvidenceGroups: seedData.sharedEvidenceGroups.length,
    },
    ownerCaseIds: seedData.cases
      .filter((item) => item.rescuerOpenid === ownerOpenid)
      .map((item) => item.caseId),
    homepageCaseIds: seedData.cases
      .filter((item) => item.visibility === "published")
      .map((item) => item.caseId),
  };
}

module.exports = {
  buildMockSeedData,
  seedMockData,
};
