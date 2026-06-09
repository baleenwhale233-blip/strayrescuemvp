export function getExpenseSuccessNavigation(isEditMode: boolean) {
  return {
    feedbackShouldNavigateBack: !isEditMode,
    shouldReturnToRecordDetail: isEditMode,
  };
}
