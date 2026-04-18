import { Text, View } from "@tarojs/components";
import { NavBar } from "../../../components/NavBar";
import "./index.scss";

type GuideSection = {
  title: string;
  paragraphs?: string[];
  items?: string[];
};

const RESCUER_STEPS = [
  "先在“救助联系方式设置”里填好微信号、二维码和备注。支持者需要知道能联系到谁。",
  "新建救助档案时，只写你确定的事实：在哪遇到、现在什么状态、已经做了什么、还准备做什么。",
  "有支出就记一笔。金额、日期、类别和一句话说明先填清楚，票据、订单图、支付截图、药品照片能补就补。",
  "有变化就写进展更新。哪怕只是“今天能吃一点了”，也比很久没有消息更让人安心。",
  "先分享公开页或案例 ID。没马上进首页也别着急，先把记录补起来。",
  "想更容易出现在首页，就优先补三件事：公开更新、第一笔支出，以及最基础能看懂的支出证据。",
  "有人登记“我已支持”后，回到核实页处理：收到就确认，没对上就标记未匹配。不要为了省事直接删掉痕迹。",
];

const SUPPORTER_STEPS = [
  "先看案例 ID，确认你打开的是同一个档案。",
  "再看最新进展、已确认支出、已确认支持和当前状态提示，判断这只动物现在是不是真的还需要补位。",
  "如果你是从首页点进来的，可以把它理解成：这只已经满足了首页当前的基础筛选；如果它不在首页，也不代表它一定有问题。",
  "如果决定支持，请通过救助人留下的联系方式沟通。平台不代收钱，也不会替任何人收款。",
  "已经通过微信、线下或其他方式支持过，就回到详情页点“我已支持”，登记金额、称呼、留言和截图，等救助人核实。",
];

const SECTIONS: GuideSection[] = [
  {
    title: "先说最重要的一句",
    paragraphs: [
      "请尽量让正在救助这只动物的人自己发救助档案，不要用你的账号替别人发起。",
      "救助账本不是一张帮忙转发的海报。它后面会不断发生新的事：支出要补、病情要更新、支持登记要核实、有人来问也要有人回答。真正能承担这些事的人，应该是实际救助人。",
      "如果你是在帮朋友、群友、邻居或路上遇到的救助人，你当然可以帮忙。你可以把这份说明转给 TA，陪 TA 整理第一批照片和票据，帮 TA 检查文字有没有说清楚，也可以帮 TA 转发公开页。但档案的发起人、联系方式和后续确认，最好还是留给真正救助的人。",
    ],
  },
  {
    title: "这个账本是做什么的",
    items: [
      "把一只动物的救助过程整理成一个可以公开查看的档案。",
      "让支持者看得懂：现在是什么情况、钱花到哪了、已经有多少支持、还差什么。",
      "给每个公开案例一个案例 ID，方便在群聊、朋友圈、小红书等地方查回同一个档案。",
      "记录已经发生在平台外的支持，再由救助人确认入账。",
    ],
    paragraphs: [
      "它不是募捐平台，不碰钱，不代收代付，也不保证每个案例一定真实无误。它做的是一件更朴素的事：把救助过程尽量摊开，让后来的人少一点猜测，多一点依据。",
    ],
  },
  {
    title: "为什么公开了，不一定马上出现在首页",
    paragraphs: [
      "这是现在最容易让人误会的一件事。公开页和首页，不是同一层。",
      "公开页的作用，是让别人能通过链接或案例 ID 查到这只动物；首页的作用，是把已经补到一定程度、适合优先判断的案例先放出来。",
      "所以，一个档案可以先公开、先传播，但暂时还不在首页。这不等于它不可信，也不等于不能转发。",
    ],
    items: [
      "还没发出第一条公开进展更新。",
      "还没记下第一笔支出。",
      "已经记了支出，但证据还太少，暂时还只是“待补充”。",
      "首页不是按“谁更惨”排的，也不是按“谁预算写得更高”排的。",
    ],
  },
  {
    title: "救助人怎么用",
    items: RESCUER_STEPS,
  },
  {
    title: "支持者怎么用",
    items: SUPPORTER_STEPS,
  },
  {
    title: "怎么写才算一份好档案",
    items: [
      "真实：不知道的就说不知道，不要把推测写成确定。",
      "持续：不需要每天长篇大论，但关键变化要补上。",
      "清楚：总预算、已确认支出、已确认支持，不要混成一句“还缺很多”。",
      "有证据：票据、订单、支付截图、治疗照片、猫狗当下状态图，都比空口说明更有用。",
      "有人负责：联系方式要能找到人，别人问到案例 ID 时，救助人能说得清楚。",
    ],
  },
  {
    title: "几件不建议做的事",
    items: [
      "不要替别人用自己的账号建档，除非你会持续负责这只动物的更新和对账。",
      "不要把好几只动物混在一个档案里。一个档案最好只对应一只动物。",
      "不要把预估总预算直接说成当前缺口。已经花掉多少、已经确认支持多少，要分开看。",
      "不要只贴收款方式，不给账本、不更新进展。这样支持者很难判断，也会把信任压力都压回聊天里。",
      "不要为了让人更着急而夸大病情、模糊金额或省略已经收到的支持。",
    ],
  },
  {
    title: "如果你只是想帮一把",
    paragraphs: [
      "最好的帮忙，不一定是替 TA 发起。很多时候，是帮 TA 把事情变得更容易开始。",
      "你可以帮 TA 拍清楚票据，帮 TA 把第一版描述写顺，提醒 TA 定期更新，也可以把案例 ID 发到群里让更多人查档。这样帮出来的档案，后面还能继续长下去，而不是发完一次就没人接了。",
    ],
  },
];

export default function ProfileGuidePage() {
  return (
    <View className="page-shell profile-guide-page">
      <NavBar showBack title="救助账本使用说明" />

      <View className="profile-guide-page__hero">
        <Text className="profile-guide-page__eyebrow">给救助人和支持者的一点说明</Text>
        <Text className="profile-guide-page__title">先把事情说清楚，再让善意靠近。</Text>
        <Text className="profile-guide-page__lead">
          救助账本不是让谁看起来更会求助，而是让一只动物的经历、花费和后续有人能查、能问、能接着看。
        </Text>
      </View>

      <View className="profile-guide-page__content">
        {SECTIONS.map((section) => (
          <View key={section.title} className="profile-guide-page__section">
            <Text className="profile-guide-page__section-title">{section.title}</Text>
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
    </View>
  );
}
