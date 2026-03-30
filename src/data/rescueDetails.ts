import coverCat from "../assets/detail/guest-hero-cat.png";
import rescuerAvatar from "../assets/detail/rescuer-avatar.png";
import timelineReceipt from "../assets/detail/timeline-receipt.png";
import timelineTreatment from "../assets/detail/timeline-treatment.png";
import timelineStatusCat from "../assets/detail/timeline-status-cat.png";
import type { StatusTone } from "./mock";

export type RescueTimelineTone =
  | "expense"
  | "status"
  | "budget"
  | "support";

export type RescueTimelineImage = {
  id: string;
  src: string;
  alt: string;
};

export type RescueTimelineBudgetSummary = {
  previousLabel: string;
  previousValue: string;
  currentLabel: string;
  currentValue: string;
};

export type RescueTimelineEntry = {
  id: string;
  tone: RescueTimelineTone;
  label: string;
  title: string;
  description?: string;
  timestamp: string;
  amount?: string;
  linkLabel?: string;
  images?: RescueTimelineImage[];
  budgetSummary?: RescueTimelineBudgetSummary;
};

export type RescueSupportInfo = {
  wechatId: string;
  contactHint: string;
  directHint: string;
  contactTip: string;
  directTip: string;
};

type RescueLedger = {
  supported: number;
  verifiedGap: number;
  pending: number;
};

type RescuerProfile = {
  name: string;
  credential: string;
  stats: string;
  avatarSrc: string;
  badge: string;
};

type RescueDetailBase = {
  id: string;
  statusLabel: string;
  statusTone: StatusTone;
  ledger: RescueLedger;
  rescuer: RescuerProfile;
  timeline: RescueTimelineEntry[];
  support: RescueSupportInfo;
};

export type RescueGuestDetail = RescueDetailBase & {
  title: string;
  navTitle: string;
  heroImage: string;
  heroSummary: string;
  timelineHint: string;
};

export type RescueOwnerDetail = RescueDetailBase & {
  title: string;
  navTitle: string;
  state: string;
  coverImage: string;
  goalAmount: string;
  currentAmount: string;
  progressPercent: number;
  timelineHint: string;
  quickActions: Array<{
    key: string;
    label: string;
    icon: "camera" | "fileText" | "handCoins" | "sparkles" | "plusCircle";
  }>;
};

const sharedSupport: RescueSupportInfo = {
  wechatId: "wxid_rescuer_99",
  contactHint: "长按图片保存到相册，打开微信扫一扫添加好友",
  directHint: "长按图片保存到相册，打开微信/支付宝扫码转账",
  contactTip: "添加救助人后，可通过微信直接沟通救助细节。",
  directTip:
    "支持完成后，请回到页面点击“我已支持，去认领”以更新透明账本。",
};

const project002Timeline: RescueTimelineEntry[] = [
  {
    id: "timeline-002-expense",
    tone: "expense",
    label: "支出记录",
    title: "支付：清创手术费 + 抗生素",
    timestamp: "今天 14:20",
    amount: "- ¥850.00",
    linkLabel: "查看回执",
    images: [
      {
        id: "timeline-002-expense-1",
        src: timelineReceipt,
        alt: "支出票据",
      },
      {
        id: "timeline-002-expense-2",
        src: timelineTreatment,
        alt: "治疗过程",
      },
    ],
  },
  {
    id: "timeline-002-status",
    tone: "status",
    label: "状态更新",
    title: "狸花已经完成首次清创，精神状态尚可。医生建议住院观察 3 天，目前伤口情况稳定。",
    timestamp: "昨天 10:15",
    images: [
      {
        id: "timeline-002-status-1",
        src: timelineStatusCat,
        alt: "狸花近况照片",
      },
    ],
  },
  {
    id: "timeline-002-budget",
    tone: "budget",
    label: "预算调整",
    title: "新增：后期康复理疗预算",
    timestamp: "10月24日",
    budgetSummary: {
      previousLabel: "原预算总计",
      previousValue: "¥4,200",
      currentLabel: "现预算总计",
      currentValue: "¥5,250",
    },
  },
];

const sharedRescuer: RescuerProfile = {
  name: "救助人小李",
  credential: "已建立 3 份透明账本 · 12 张真实凭证",
  stats: "注册 3 个月 · 1 次真实完成案例",
  avatarSrc: rescuerAvatar,
  badge: "已实名",
};

const guestDetails: RescueGuestDetail[] = [
  {
    id: "project-002",
    title: "救助瘸腿狸花",
    navTitle: "救助瘸腿狸花",
    heroImage: coverCat,
    heroSummary:
      "区分救助中。已完成首次清创和基础检查，接下来需要继续住院观察与补充康复费用。",
    statusLabel: "区分救助中",
    statusTone: "urgent",
    ledger: {
      supported: 2450,
      verifiedGap: 1750,
      pending: 1050,
    },
    rescuer: sharedRescuer,
    timeline: project002Timeline,
    support: sharedSupport,
    timelineHint: "数据实时更新",
  },
  {
    id: "project-003",
    title: "热裤（橘猫）",
    navTitle: "热裤（橘猫）",
    heroImage: coverCat,
    heroSummary:
      "住院观察中，当前重点是输液、控炎和食欲恢复。公开页持续同步凭证与场外支持情况。",
    statusLabel: "住院中",
    statusTone: "active",
    ledger: {
      supported: 1680,
      verifiedGap: 1120,
      pending: 900,
    },
    rescuer: {
      ...sharedRescuer,
      name: "救助人小顾",
      badge: "已实名",
    },
    timeline: project002Timeline,
    support: {
      ...sharedSupport,
      wechatId: "wxid_rescuer_hotpants",
    },
    timelineHint: "数据实时更新",
  },
  {
    id: "project-004",
    title: "阿黄（中华田园犬）",
    navTitle: "阿黄（中华田园犬）",
    heroImage: coverCat,
    heroSummary:
      "已进入康复阶段，公开页会继续展示复诊、理疗和预算调整说明，方便支持者判断当前缺口。",
    statusLabel: "康复中",
    statusTone: "progress",
    ledger: {
      supported: 4200,
      verifiedGap: 700,
      pending: 350,
    },
    rescuer: {
      ...sharedRescuer,
      name: "救助人阿舟",
      badge: "已实名",
    },
    timeline: project002Timeline,
    support: {
      ...sharedSupport,
      wechatId: "wxid_rescuer_ahuang",
    },
    timelineHint: "数据实时更新",
  },
];

const ownerDetails: RescueOwnerDetail[] = [
  {
    id: "project-002",
    title: "瘸腿狸花",
    navTitle: "救助记录管理",
    state: "医疗救助中",
    coverImage: coverCat,
    statusLabel: "医疗救助中",
    statusTone: "active",
    goalAmount: "¥3,500",
    currentAmount: "¥2,450",
    progressPercent: 70,
    ledger: {
      supported: 1750,
      verifiedGap: 700,
      pending: 1050,
    },
    rescuer: sharedRescuer,
    timeline: project002Timeline,
    support: sharedSupport,
    timelineHint: "数据实时更新",
    quickActions: [
      { key: "receipt", label: "记一笔支出", icon: "camera" },
      { key: "update", label: "写进展更新", icon: "fileText" },
      { key: "income", label: "记场外收入", icon: "handCoins" },
      { key: "budget", label: "追加预算", icon: "plusCircle" },
      { key: "copy", label: "生成文案", icon: "sparkles" },
    ],
  },
  {
    id: "project-003",
    title: "热裤（橘猫）",
    navTitle: "救助记录管理",
    state: "住院观察中",
    coverImage: coverCat,
    statusLabel: "住院观察中",
    statusTone: "urgent",
    goalAmount: "¥2,800",
    currentAmount: "¥1,680",
    progressPercent: 60,
    ledger: {
      supported: 1200,
      verifiedGap: 480,
      pending: 1120,
    },
    rescuer: {
      ...sharedRescuer,
      name: "救助人小顾",
    },
    timeline: project002Timeline,
    support: {
      ...sharedSupport,
      wechatId: "wxid_rescuer_hotpants",
    },
    timelineHint: "数据实时更新",
    quickActions: [
      { key: "receipt", label: "记一笔支出", icon: "camera" },
      { key: "update", label: "写进展更新", icon: "fileText" },
      { key: "income", label: "记场外收入", icon: "handCoins" },
      { key: "budget", label: "追加预算", icon: "plusCircle" },
      { key: "copy", label: "生成文案", icon: "sparkles" },
    ],
  },
  {
    id: "project-004",
    title: "阿黄（中华田园犬）",
    navTitle: "救助记录管理",
    state: "康复理疗中",
    coverImage: coverCat,
    statusLabel: "康复理疗中",
    statusTone: "progress",
    goalAmount: "¥5,250",
    currentAmount: "¥4,200",
    progressPercent: 80,
    ledger: {
      supported: 2450,
      verifiedGap: 900,
      pending: 1850,
    },
    rescuer: {
      ...sharedRescuer,
      name: "救助人阿舟",
    },
    timeline: project002Timeline,
    support: {
      ...sharedSupport,
      wechatId: "wxid_rescuer_ahuang",
    },
    timelineHint: "数据实时更新",
    quickActions: [
      { key: "receipt", label: "记一笔支出", icon: "camera" },
      { key: "update", label: "写进展更新", icon: "fileText" },
      { key: "income", label: "记场外收入", icon: "handCoins" },
      { key: "budget", label: "追加预算", icon: "plusCircle" },
      { key: "copy", label: "生成文案", icon: "sparkles" },
    ],
  },
  {
    id: "project-005",
    title: "阿黄（中华田园犬）",
    navTitle: "救助记录管理",
    state: "草稿中",
    coverImage: coverCat,
    statusLabel: "草稿中",
    statusTone: "draft",
    goalAmount: "¥1,800",
    currentAmount: "¥0",
    progressPercent: 0,
    ledger: {
      supported: 0,
      verifiedGap: 0,
      pending: 1800,
    },
    rescuer: {
      ...sharedRescuer,
      name: "救助人阿舟",
      badge: "草稿",
    },
    timeline: [
      {
        id: "timeline-draft-1",
        tone: "status",
        label: "草稿提醒",
        title: "已完成基础建档，待补充票据和进展",
        timestamp: "刚刚",
      },
    ],
    support: {
      ...sharedSupport,
      directTip: "草稿暂未公开，当前为支持方式预览。",
    },
    timelineHint: "草稿内容未公开",
    quickActions: [
      { key: "receipt", label: "记一笔支出", icon: "camera" },
      { key: "update", label: "写进展更新", icon: "fileText" },
      { key: "income", label: "记场外收入", icon: "handCoins" },
      { key: "budget", label: "追加预算", icon: "plusCircle" },
      { key: "copy", label: "生成文案", icon: "sparkles" },
    ],
  },
];

export function getGuestRescueDetail(id?: string) {
  if (!id) {
    return guestDetails[0];
  }

  return guestDetails.find((detail) => detail.id === id) ?? guestDetails[0];
}

export function getOwnerRescueDetail(id?: string) {
  if (!id) {
    return ownerDetails[0];
  }

  return ownerDetails.find((detail) => detail.id === id) ?? ownerDetails[0];
}
