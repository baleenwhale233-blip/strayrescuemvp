import { RescueOwnerQuickActions } from "../../../../../components/RescueOwnerShared";

export function OwnerActionSection({
  onBudget,
  onExpense,
  onIncome,
  onStatus,
}: {
  onBudget: () => void;
  onExpense: () => void;
  onIncome: () => void;
  onStatus: () => void;
}) {
  return (
    <RescueOwnerQuickActions
      onBudget={onBudget}
      onExpense={onExpense}
      onIncome={onIncome}
      onStatus={onStatus}
    />
  );
}
