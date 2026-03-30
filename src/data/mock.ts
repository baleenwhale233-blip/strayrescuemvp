export type StatusTone = "urgent" | "active" | "progress" | "done" | "draft";

export type RescueTimelineTone =
  | "status"
  | "expense"
  | "support"
  | "budget";

export type RescueTimelineEntry = {
  id: string;
  tone: RescueTimelineTone;
  label: string;
  title: string;
  description: string;
  timestamp: string;
  amount?: string;
};

export type RescueProofCard = {
  id: string;
  title: string;
  subtitle: string;
};

export type RescueProjectDetail = {
  id: string;
  name: string;
  state: string;
  avatarLabel: string;
  avatarStart: string;
  avatarEnd: string;
  statusLabel: string;
  statusTone: StatusTone;
  location: string;
  updatedAt: string;
  summary: string;
  ledger: {
    supported: number;
    verifiedGap: number;
    pending: number;
  };
  rescuer: {
    name: string;
    credential: string;
    stats: string;
  };
  timeline: RescueTimelineEntry[];
  proofs: RescueProofCard[];
  support: {
    wechatId: string;
    contactHint: string;
    directHint: string;
    contactTip: string;
    directTip: string;
  };
};

export const discoverCategories = [
  { key: "all", label: "全部", active: true },
  { key: "urgent", label: "紧急", active: false },
  { key: "active", label: "进行中", active: false },
  { key: "done", label: "完成", active: false },
] as const;

export const discoverCases = [
  {
    id: "case-001",
    detailId: "project-002",
    title: "二二：后腿受伤",
    updatedAt: "2H",
    subtitle: "第一阶段进度",
    latest: "更新：初步检查完成",
    statusLabel: "紧急",
    statusTone: "urgent" as StatusTone,
    amountText: "¥1,240 / ¥2,000",
    progress: 62,
    coverLabel: "二二",
    coverStart: "#F7C9A8",
    coverEnd: "#A66A4A",
  },
  {
    id: "case-002",
    detailId: "project-003",
    title: "三号楼：绝育放归",
    updatedAt: "昨天",
    subtitle: "第二阶段进度",
    latest: "更新：初步检查完成",
    statusLabel: "进行中",
    statusTone: "active" as StatusTone,
    amountText: "¥450 / ¥500",
    progress: 90,
    coverLabel: "三号",
    coverStart: "#C8E6A0",
    coverEnd: "#5B8A2D",
  },
  {
    id: "case-003",
    detailId: "project-004",
    title: "大黄已领养",
    updatedAt: "3D",
    subtitle: "第四阶段进度",
    latest: "更新：已被领养",
    statusLabel: "完成",
    statusTone: "done" as StatusTone,
    amountText: "¥800 / ¥800",
    progress: 100,
    coverLabel: "大黄",
    coverStart: "#DFDFDF",
    coverEnd: "#8D939F",
  },
  {
    id: "case-004",
    detailId: "project-004",
    title: "大黄二次复查",
    updatedAt: "3D",
    subtitle: "第一阶段进度",
    latest: "更新：等待复查结果",
    statusLabel: "完成",
    statusTone: "done" as StatusTone,
    amountText: "¥800 / ¥800",
    progress: 100,
    coverLabel: "复查",
    coverStart: "#E0E3E8",
    coverEnd: "#9298A4",
  },
] as const;

export const quickActions = [
  { key: "receipt", label: "上传票据", icon: "camera" },
  { key: "update", label: "救助进展", icon: "fileText" },
  { key: "donation", label: "捐款记录", icon: "handCoins" },
  { key: "copy", label: "生成文案", icon: "sparkles" },
] as const;

export const activeProject = {
  id: "project-001",
  name: "二二（三花猫）",
  state: "后腿瘫痪 • 3d",
  badge: "4 进行中",
  avatarLabel: "二二",
  avatarStart: "#E4D0B4",
  avatarEnd: "#72513C",
} as const;

export const rescueProjects = [
  {
    id: "project-002",
    name: "Luna（狸花猫）",
    state: "领养中 • 3d",
    avatarLabel: "Lu",
    avatarStart: "#DBD2B8",
    avatarEnd: "#6E6145",
  },
  {
    id: "project-003",
    name: "热裤（橘猫）",
    state: "住院中 • 3d",
    avatarLabel: "热裤",
    avatarStart: "#F5C08B",
    avatarEnd: "#A7621D",
  },
  {
    id: "project-004",
    name: "阿黄（中华田园犬）",
    state: "住院中 • 24d",
    avatarLabel: "阿黄",
    avatarStart: "#E0C9A6",
    avatarEnd: "#8B6337",
  },
] as const;

export const draftProjects = [
  {
    id: "project-005",
    name: "阿黄（中华田园犬）",
    state: "住院中 • 24d",
    avatarLabel: "阿黄",
    avatarStart: "#E0C9A6",
    avatarEnd: "#8B6337",
  },
] as const;

export const rescueProjectDetails: RescueProjectDetail[] = [
  {
    id: "project-002",
    name: "Luna（狸花猫）",
    state: "领养中 • 3d",
    avatarLabel: "Lu",
    avatarStart: "#DBD2B8",
    avatarEnd: "#6E6145",
    statusLabel: "进行中",
    statusTone: "active",
    location: "上海 · 杨浦区",
    updatedAt: "今天 10:15",
    summary:
      "在小区停车场发现时后腿拖行，目前已完成首轮清创和检查，接下来需要继续住院观察并补充后续康复费用。",
    ledger: {
      supported: 2450,
      verifiedGap: 1750,
      pending: 1050,
    },
    rescuer: {
      name: "阿岚",
      credential: "注册 126 天 · 已建立 3 份透明账本",
      stats: "已上传 12 张真实医疗凭证 · 最近 24 小时更新 2 次",
    },
    timeline: [
      {
        id: "timeline-001",
        tone: "status",
        label: "状态更新",
        title: "首次清创已完成，状态稳定",
        description:
          "狸花已经完成首次清创，精神状态尚可。医生建议继续住院观察 3 天，今天会补充复查结果。",
        timestamp: "今天 10:15",
      },
      {
        id: "timeline-002",
        tone: "expense",
        label: "支出凭证",
        title: "急诊检查与清创",
        description: "已核验门急诊检查、药费和清创处理，票据已同步到透明账本。",
        timestamp: "昨天 18:40",
        amount: "¥1,240",
      },
      {
        id: "timeline-003",
        tone: "support",
        label: "场外支持",
        title: "爱心人士 王** 已直接支持",
        description: "已由救助人确认到账，并挂到本案例的透明账本中。",
        timestamp: "昨天 15:20",
        amount: "¥300",
      },
      {
        id: "timeline-004",
        tone: "budget",
        label: "预算调整",
        title: "增加 3 天住院观察预算",
        description: "医生建议继续观察伤口恢复情况，因此补充住院和复查预算说明。",
        timestamp: "昨天 09:30",
      },
    ],
    proofs: [
      {
        id: "proof-001",
        title: "病历与检查单",
        subtitle: "透明账本 · 严禁盗用",
      },
      {
        id: "proof-002",
        title: "收费单与票据",
        subtitle: "透明账本 · 严禁盗用",
      },
    ],
    support: {
      wechatId: "wxid_rescuer_99",
      contactHint: "长按图片保存到相册，打开微信扫一扫添加好友",
      directHint: "长按图片保存到相册，打开微信/支付宝扫码转账",
      contactTip: "添加救助人后，可通过微信直接沟通救助细节。",
      directTip:
        "支持完成后，请回到页面点击“我已支持，去认领”以更新透明账本。",
    },
  },
  {
    id: "project-003",
    name: "热裤（橘猫）",
    state: "住院中 • 3d",
    avatarLabel: "热裤",
    avatarStart: "#F5C08B",
    avatarEnd: "#A7621D",
    statusLabel: "紧急",
    statusTone: "urgent",
    location: "上海 · 普陀区",
    updatedAt: "昨天 20:10",
    summary:
      "橘猫热裤目前仍在住院，重点观察发热情况和食欲恢复。公开页会持续同步住院进展与外部支持情况。",
    ledger: {
      supported: 1680,
      verifiedGap: 1120,
      pending: 900,
    },
    rescuer: {
      name: "小顾",
      credential: "注册 89 天 · 已建立 2 份透明账本",
      stats: "已上传 8 张医疗凭证 · 最近 48 小时更新 1 次",
    },
    timeline: [
      {
        id: "timeline-101",
        tone: "status",
        label: "状态更新",
        title: "住院观察中，体温已回落",
        description: "医生反馈精神有恢复，但仍需继续输液和观察食欲变化。",
        timestamp: "昨天 20:10",
      },
      {
        id: "timeline-102",
        tone: "expense",
        label: "支出凭证",
        title: "输液与化验费用",
        description: "最新票据已人工校正并核验，金额同步更新。",
        timestamp: "昨天 14:05",
        amount: "¥680",
      },
      {
        id: "timeline-103",
        tone: "support",
        label: "场外支持",
        title: "爱心人士 陈** 已直接支持",
        description: "支持记录已由救助人确认到账。",
        timestamp: "前天 22:30",
        amount: "¥200",
      },
    ],
    proofs: [
      {
        id: "proof-101",
        title: "住院照片",
        subtitle: "透明账本 · 严禁盗用",
      },
      {
        id: "proof-102",
        title: "化验单据",
        subtitle: "透明账本 · 严禁盗用",
      },
    ],
    support: {
      wechatId: "wxid_rescuer_hotpants",
      contactHint: "长按图片保存到相册，打开微信扫一扫添加好友",
      directHint: "长按图片保存到相册，打开微信/支付宝扫码转账",
      contactTip: "添加救助人后，可直接沟通住院进度和后续安排。",
      directTip:
        "支持完成后，请回到页面点击“我已支持，去认领”以更新透明账本。",
    },
  },
  {
    id: "project-004",
    name: "阿黄（中华田园犬）",
    state: "住院中 • 24d",
    avatarLabel: "阿黄",
    avatarStart: "#E0C9A6",
    avatarEnd: "#8B6337",
    statusLabel: "进行中",
    statusTone: "active",
    location: "上海 · 宝山区",
    updatedAt: "10月24日",
    summary:
      "阿黄已进入康复阶段，当前重点是复诊和理疗。页面会继续展示阶段性进展、预算调整和凭证缩略图。",
    ledger: {
      supported: 4200,
      verifiedGap: 950,
      pending: 600,
    },
    rescuer: {
      name: "阿舟",
      credential: "注册 201 天 · 已建立 5 份透明账本",
      stats: "已上传 21 张医疗凭证 · 最近 7 天更新 3 次",
    },
    timeline: [
      {
        id: "timeline-201",
        tone: "budget",
        label: "预算调整",
        title: "新增后期康复理疗预算",
        description: "补充理疗与后续复诊预算，避免公开页信息滞后造成误解。",
        timestamp: "10月24日",
      },
      {
        id: "timeline-202",
        tone: "status",
        label: "状态更新",
        title: "理疗已开始，站立更稳定",
        description: "近两次理疗反馈良好，但仍需持续观察肌肉恢复情况。",
        timestamp: "10月22日",
      },
      {
        id: "timeline-203",
        tone: "expense",
        label: "支出凭证",
        title: "复诊与理疗费用",
        description: "费用明细已补录，原始票据已完成水印处理。",
        timestamp: "10月20日",
        amount: "¥540",
      },
    ],
    proofs: [
      {
        id: "proof-201",
        title: "复诊病历",
        subtitle: "透明账本 · 严禁盗用",
      },
      {
        id: "proof-202",
        title: "理疗记录",
        subtitle: "透明账本 · 严禁盗用",
      },
    ],
    support: {
      wechatId: "wxid_rescuer_ahuang",
      contactHint: "长按图片保存到相册，打开微信扫一扫添加好友",
      directHint: "长按图片保存到相册，打开微信/支付宝扫码转账",
      contactTip: "添加救助人后，可直接沟通康复节奏和后续领养计划。",
      directTip:
        "支持完成后，请回到页面点击“我已支持，去认领”以更新透明账本。",
    },
  },
  {
    id: "project-005",
    name: "阿黄（中华田园犬）",
    state: "草稿中 • 待补充病历",
    avatarLabel: "阿黄",
    avatarStart: "#E0C9A6",
    avatarEnd: "#8B6337",
    statusLabel: "草稿",
    statusTone: "draft",
    location: "上海 · 宝山区",
    updatedAt: "刚刚",
    summary:
      "这是一份尚未公开的草稿档案，已经完成基础建档，待补充病历、票据和最新进展后再对外展示。",
    ledger: {
      supported: 0,
      verifiedGap: 1800,
      pending: 600,
    },
    rescuer: {
      name: "阿舟",
      credential: "草稿阶段 · 暂未公开展示",
      stats: "建议优先上传首张票据和当前状态照片。",
    },
    timeline: [
      {
        id: "timeline-301",
        tone: "status",
        label: "草稿提醒",
        title: "已创建基础档案",
        description: "建议继续补充病历、票据和近况图后再公开分享。",
        timestamp: "刚刚",
      },
    ],
    proofs: [
      {
        id: "proof-301",
        title: "待上传病历",
        subtitle: "建议补充后公开",
      },
      {
        id: "proof-302",
        title: "待上传票据",
        subtitle: "建议补充后公开",
      },
    ],
    support: {
      wechatId: "wxid_rescuer_ahuang",
      contactHint: "长按图片保存到相册，打开微信扫一扫添加好友",
      directHint: "长按图片保存到相册，打开微信/支付宝扫码转账",
      contactTip: "草稿阶段建议先补齐资料，再对外沟通救助细节。",
      directTip:
        "草稿暂未公开，支持方式展示仅用于预览后续公开页交互。",
    },
  },
];

export function getRescueProjectDetail(id?: string) {
  if (!id) {
    return rescueProjectDetails[0];
  }

  return rescueProjectDetails.find((project) => project.id === id);
}
