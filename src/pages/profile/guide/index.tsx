import { Text, View } from "@tarojs/components";
import { NavBar } from "../../../components/NavBar";
import { PageShell, SectionHeader } from "../../../components/ui";
import "./index.scss";

type GuideSection = {
  title: string;
  paragraphs?: string[];
  items?: string[];
};

const RESCUER_STEPS = [
  "先填联系信息：微信号、二维码或备注，至少让别人知道怎么找到你。",
  "建档时只写确定的事实：在哪里遇到、现在什么状态、做过什么、接下来准备怎么处理。",
  "有支出就记一笔：金额、日期、类别和一句话说明先写清楚，票据和支付截图能补就补。",
  "有变化就更新进展。哪怕只是“今天能自己吃一点”，也比长时间没消息更好。",
  "先分享公开页或案例 ID。没进首页先别急，把记录补完整。",
  "想更容易进首页，先补公开进展、第一笔支出和基础凭证。",
  "有人登记支持后，到处理页核对。对上就确认，没对上就标未匹配。",
];

const SUPPORTER_STEPS = [
  "先核对案例 ID，确认自己看的是同一份档案。",
  "再看最新进展、已确认支出、已确认支持和当前缺口。",
  "看时间线和凭证，判断记录是不是说得清楚、有没有持续更新。",
  "首页点进来的，说明它已满足当前首页筛选；不在首页，也不等于一定有问题。",
  "如果要线下转账或继续沟通，先通过页面里的联系信息确认。平台不代收，也不处理资金。",
  "完成支持后，可以回详情页点“登记支持”，等记录维护者确认。",
];

const SECTIONS: GuideSection[] = [
  {
    title: "最重要的一点",
    paragraphs: [
      "尽量让正在救助这只动物的人自己建档。",
      "这个档案不是一次性的转发文案。后面还要补支出、更新病情、处理支持登记，也要回答别人问起的情况。谁能长期跟进，谁就更适合做记录维护者。",
      "如果你只是帮朋友、群友或路上遇到的人整理资料，可以帮对方准备照片、票据和第一版文字，也可以帮忙转发公开页。账号、联系方式和后续跟进，最好还是交给真正负责的人。",
    ],
  },
  {
    title: "这个工具是做什么的",
    items: [
      "把一只动物的救助过程整理成一份能公开查看的记录。",
      "让别人看清：现在是什么情况、已确认支出多少、已确认支持多少、当前缺口多少。",
      "给公开案例一个案例 ID，方便从群聊、朋友圈、小红书等地方查回同一份档案。",
      "把平台外已经发生的支持登记下来，交给记录维护者确认。",
    ],
    paragraphs: [
      "它不收钱、不代付，也不替任何案例做保证。它能做的是把信息摆清楚，少一点来回确认。",
    ],
  },
  {
    title: "为什么公开了，还不一定上首页",
    paragraphs: [
      "公开页和首页是两件事。公开页负责让别人能查到；首页只放已经补到一定程度、适合先看的记录。",
      "所以，档案可以先公开、先转发，暂时不上首页也正常。这不代表它不可信。多数时候，只是资料还没补齐。",
    ],
    items: [
      "还没有公开进展。",
      "还没有第一笔支出记录。",
      "有支出，但凭证还少。",
      "首页不按惨烈程度排，也不按预算高低排。",
    ],
  },
  {
    title: "记录维护者怎么用",
    items: RESCUER_STEPS,
  },
  {
    title: "查看的人怎么用",
    items: SUPPORTER_STEPS,
  },
  {
    title: "怎么写才算一份好档案",
    items: [
      "事实清楚：不知道就写不知道，别把猜测写成结论。",
      "更新持续：不用每天写长文，关键变化别断。",
      "金额分开：总预算、已确认支出、已确认支持、当前缺口分别写清。",
      "凭证跟上：票据、订单、支付截图、治疗照片，比一句“我花了钱”有用。",
      "有人负责：别人问到案例 ID 时，维护者能接得住。",
    ],
  },
  {
    title: "几件不建议做的事",
    items: [
      "不要替别人长期建档，除非你真的会负责后续更新和对账。",
      "不要把几只动物混在一个档案里。一个档案最好只对应一只动物。",
      "不要把预估总预算说成当前缺口。当前缺口看的是总预算和已确认支持。",
      "不要只留联系方式，不写明细、不更新进展。",
      "不要为了让人着急而夸大病情、模糊金额或省略已确认支持。",
    ],
  },
  {
    title: "如果你只是想帮一把",
    paragraphs: [
      "可以帮，但最好别把责任揽到自己账号里。",
      "更有用的帮忙，是把第一版资料整理好：拍清票据，帮忙顺一下描述，提醒对方更新，再把公开页或案例 ID 转出去。这样帮完以后，记录还能由真正负责的人继续维护。",
    ],
  },
];

export default function ProfileGuidePage() {
  return (
    <PageShell className="profile-guide-page">
      <NavBar showBack title="使用说明" />

      <View className="profile-guide-page__hero">
        <Text className="profile-guide-page__eyebrow">给建档的人，也给查看的人</Text>
        <Text className="profile-guide-page__title">先把记录讲清楚</Text>
        <Text className="profile-guide-page__lead">
          这页只说几件实用的事：谁适合建档、账本能做什么、看到一条记录时该看哪里。
        </Text>
      </View>

      <View className="profile-guide-page__content">
        {SECTIONS.map((section) => (
          <View key={section.title} className="profile-guide-page__section">
            <SectionHeader className="profile-guide-page__section-title" title={section.title} />
            {section.paragraphs?.map((paragraph) => (
              <Text key={paragraph} className="profile-guide-page__paragraph">
                {paragraph}
              </Text>
            ))}
            {section.items?.length ? (
              <View className="profile-guide-page__list">
                {section.items.map((item, index) => (
                  <View key={item} className="profile-guide-page__list-item">
                    <Text className="profile-guide-page__list-index">{index + 1}</Text>
                    <Text className="profile-guide-page__list-text">{item}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ))}
      </View>
    </PageShell>
  );
}
