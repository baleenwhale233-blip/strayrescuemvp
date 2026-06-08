import Taro from "@tarojs/taro";

const EXPENSE_EDIT_SOURCE_KEY = "rescue-expense-edit-source";

export type ExpenseEditSource = {
  caseId: string;
  evidenceImages: Array<{
    fileID?: string;
    url: string;
  }>;
  expenseItems: Array<{
    amount?: number;
    description: string;
  }>;
  recordId: string;
  spentAt: string;
};

export function clearExpenseEditSource() {
  Taro.removeStorageSync(EXPENSE_EDIT_SOURCE_KEY);
}

export function getExpenseEditSource() {
  const stored = Taro.getStorageSync(EXPENSE_EDIT_SOURCE_KEY);
  return stored && typeof stored === "object" ? (stored as ExpenseEditSource) : undefined;
}

export function saveExpenseEditSource(source: ExpenseEditSource) {
  Taro.setStorageSync(EXPENSE_EDIT_SOURCE_KEY, source);
}
