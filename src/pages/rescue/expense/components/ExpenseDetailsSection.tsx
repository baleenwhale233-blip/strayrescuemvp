import { Input, Text, View } from "@tarojs/components";
import { AppIcon } from "../../../../components/AppIcon";
import { FormField, SectionHeader, SurfaceCard } from "../../../../components/ui";
import type { ExpenseLine } from "../types";
import "./ExpenseDetailsSection.scss";

export function ExpenseDetailsSection({
  amountLabel,
  lines,
  onAdd,
  onLineChange,
  onRemove,
}: {
  amountLabel: string;
  lines: ExpenseLine[];
  onAdd: () => void;
  onLineChange: (
    lineId: string,
    field: keyof Pick<ExpenseLine, "description" | "amount">,
    value: string,
  ) => void;
  onRemove: (lineId: string) => void;
}) {
  return (
    <View className="rescue-expense-page__details">
      <SectionHeader
        aside={
          <View className="rescue-expense-page__total">
            <Text className="rescue-expense-page__total-label">本次合计支出</Text>
            <View className="rescue-expense-page__total-value-wrap">
              <Text className="rescue-expense-page__total-currency">¥</Text>
              <Text className="rescue-expense-page__total-value">{amountLabel}</Text>
            </View>
          </View>
        }
        className="rescue-expense-page__details-head"
        title="支出明细"
      />

      <View className="rescue-expense-page__line-list">
        <View className="rescue-expense-page__add-line" onTap={onAdd}>
          <AppIcon
            className="rescue-expense-page__add-line-icon"
            name="circlePlus"
            size={20}
            variant="muted"
          />
          <Text className="rescue-expense-page__add-line-text">新增一条明细</Text>
        </View>

        {lines.map((line, index) => (
          <SurfaceCard key={line.id} className="rescue-expense-page__line">
            <View className="rescue-expense-page__line-head">
              <Text className="rescue-expense-page__line-index">
                支出 {String(lines.length - index).padStart(2, "0")}
              </Text>
              <View className="rescue-expense-page__line-delete" onTap={() => onRemove(line.id)}>
                <AppIcon
                  className="rescue-expense-page__line-delete-icon"
                  name="trash"
                  size={12}
                  variant="muted"
                />
              </View>
            </View>

            <FormField className="rescue-expense-page__field" label="项目描述">
              <Input
                className="rescue-expense-page__input"
                placeholder="例如：猫粮 5kg / 绝育费"
                value={line.description}
                onInput={(event) => onLineChange(line.id, "description", event.detail.value)}
              />
            </FormField>

            <FormField className="rescue-expense-page__field" label="金额 (¥)">
              <Input
                className="rescue-expense-page__input"
                type="digit"
                placeholder="0.00"
                value={line.amount}
                onInput={(event) => onLineChange(line.id, "amount", event.detail.value)}
              />
            </FormField>
          </SurfaceCard>
        ))}
      </View>
    </View>
  );
}
