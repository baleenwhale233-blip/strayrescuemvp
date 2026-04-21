import {
  clearCaseBudgetAdjustments,
  clearCaseCoverOverride,
  clearCaseExpenseSubmissions,
  clearCaseStatusSubmissions,
  clearCaseTitleOverride,
  saveCaseBudgetAdjustment,
  saveCaseCoverOverride,
  saveCaseExpenseSubmission,
  saveCaseStatusSubmission,
  saveCaseTitleOverride,
} from "./localPresentation";
import {
  clearCaseContentWriteLocalFallback as clearCaseContentWriteLocalFallbackCore,
  clearCaseProfileLocalFallback as clearCaseProfileLocalFallbackCore,
  recordCaseContentWriteLocalFallback as recordCaseContentWriteLocalFallbackCore,
  recordCaseProfileLocalFallback as recordCaseProfileLocalFallbackCore,
  type ContentFallbackDeps,
  type ProfileFallbackDeps,
} from "./localFallbackCore";

const profileFallbackDeps: ProfileFallbackDeps = {
  saveCaseTitleOverride,
  saveCaseCoverOverride,
  clearCaseTitleOverride,
  clearCaseCoverOverride,
};

const contentFallbackDeps: ContentFallbackDeps = {
  saveCaseBudgetAdjustment,
  saveCaseExpenseSubmission,
  saveCaseStatusSubmission,
  clearCaseBudgetAdjustments,
  clearCaseExpenseSubmissions,
  clearCaseStatusSubmissions,
};

export function recordCaseProfileLocalFallback(
  input: Parameters<typeof recordCaseProfileLocalFallbackCore>[0],
) {
  return recordCaseProfileLocalFallbackCore(input, profileFallbackDeps);
}

export function clearCaseProfileLocalFallback(
  input: Parameters<typeof clearCaseProfileLocalFallbackCore>[0],
) {
  return clearCaseProfileLocalFallbackCore(input, profileFallbackDeps);
}

export function recordCaseContentWriteLocalFallback(
  input: Parameters<typeof recordCaseContentWriteLocalFallbackCore>[0],
) {
  return recordCaseContentWriteLocalFallbackCore(input, contentFallbackDeps);
}

export function clearCaseContentWriteLocalFallback(
  input: Parameters<typeof clearCaseContentWriteLocalFallbackCore>[0],
) {
  return clearCaseContentWriteLocalFallbackCore(input, contentFallbackDeps);
}
