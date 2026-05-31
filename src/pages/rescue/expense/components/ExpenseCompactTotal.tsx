import { Text, View } from "@tarojs/components";
import "./ExpenseCompactTotal.scss";

export function ExpenseCompactTotal({
  amountLabel,
  visible,
}: {
  amountLabel: string;
  visible: boolean;
}) {
  return (
    <View
      className={`rescue-expense-page__compact-total${
        visible ? " rescue-expense-page__compact-total--visible" : ""
      }`}
    >
      <View className="rescue-expense-page__compact-total-inner">
        <Text className="rescue-expense-page__compact-total-label">本次合计支出</Text>
        <View className="rescue-expense-page__compact-total-value-wrap">
          <Text className="rescue-expense-page__compact-total-currency">¥</Text>
          <Text className="rescue-expense-page__compact-total-value">{amountLabel}</Text>
        </View>
      </View>
    </View>
  );
}
