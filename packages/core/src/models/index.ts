// Re-export all model types and schemas
export * from "./user";
export * from "./budget";
export * from "./pool";
export * from "./channel";
export * from "./allocation";
export * from "./transaction";
export * from "./balance";
export * from "./allocationBreakdown";
export * from "./category";

// Common type unions for convenience
export type { UserProfile } from "./user";
export type { Budget, CreateBudget, UpdateBudget, SharedUser } from "./budget"; // Add budget types
export type { Pool } from "./pool";
export type { Channel } from "./channel";
export type { AllocationStrategy } from "./allocation";
export type {
  Transaction,
  IncomeTransaction,
  ExpenseTransaction,
  TransferTransaction,
} from "./transaction";
export type { CurrentBalance, BalanceSnapshot, PoolBalance } from "./balance";
export type {
  AllocationBreakdown,
  PoolAllocationItem,
} from "./allocationBreakdown";
export type {
  ExpenseCategory,
  ExpenseSubcategory,
  CategoryReference,
} from "./category";

export type { PoolPurposeType, PoolColor, PoolIcon } from "./pool";

export type { ChannelType } from "./channel";

// Re-export validation functions for easy access
export {
  validateUserProfile,
  validateCreateUserProfile,
  validateUpdateUserProfile,
} from "./user";

// Add budget validation functions
export {
  validateBudget,
  validateCreateBudget,
  validateUpdateBudget,
} from "./budget";

export { validatePool, validateCreatePool, validateUpdatePool } from "./pool";

export {
  validateChannel,
  validateCreateChannel,
  validateUpdateChannel,
} from "./channel";

export {
  validateAllocationStrategy,
  validateCreateAllocationStrategy,
  validateUpdateAllocationStrategy,
} from "./allocation";

export {
  validateIncomeTransaction,
  validateExpenseTransaction,
  validateTransferTransaction,
  validateTransaction,
} from "./transaction";

export { validateCurrentBalance, validateBalanceSnapshot } from "./balance";

export {
  validateAllocationBreakdown,
  validateCreateAllocationBreakdown,
} from "./allocationBreakdown";

export {
  validateExpenseCategory,
  validateCreateExpenseCategory,
  validateUpdateExpenseCategory,
  validateCategoryReference,
} from "./category";

// Re-export helper functions
export { createUserProfile, DEFAULT_USER_PREFERENCES } from "./user";

// Add budget helper functions
export { createBudget } from "./budget";

export {
  createPool,
  isGoalPool,
  calculateGoalProgress,
  isGoalComplete,
  POOL_TEMPLATES,
} from "./pool";

export {
  createChannel,
  maskAccountNumber,
  isCreditChannel,
  isCashChannel,
  calculateAvailableBalance,
  isOverLimit,
  hasBillTracking,
  getRemainingBillBalance,
  isBillOverdue,
  getDaysUntilDue,
  isMinimumPaymentMet,
  updateBillTrackingAfterPayment,
  CHANNEL_TEMPLATES,
  CHANNEL_TYPE_INFO,
} from "./channel";

export {
  createAllocationStrategy,
  validateAllocationsSum,
  calculateAllocationAmount,
  getAllocationProportion,
  distributeIncome,
  proportionToPercentage,
  percentageToProportion,
  createAllocationsFromPercentages,
  normalizeAllocations,
  ALLOCATION_TEMPLATES,
} from "./allocation";

export {
  createIncomeTransaction,
  createExpenseTransaction,
  createTransferTransaction,
  isIncomeTransaction,
  isExpenseTransaction,
  isTransferTransaction,
  validateCreditCardPayment,
  createCreditCardPaymentTransfer,
  TRANSACTION_TYPE_INFO,
} from "./transaction";

export {
  getPoolChannelBalance,
  getChannelTotalBalance,
  getPoolTotalBalance,
  calculateNetWorth,
  getChannelBalances,
  getPoolBalances,
  createBalanceSnapshot,
  updateBalanceAfterTransaction,
} from "./balance";

export {
  createAllocationBreakdown,
  createSinglePoolAllocation,
  createAllocationFromStrategy,
  createAllocationSuggestions,
  validateAllocationAgainstBalances,
  calculateMaximumPayableAmount,
  createProportionalAllocation,
  normalizeAllocationBreakdown,
} from "./allocationBreakdown";

export {
  createExpenseCategory,
  createExpenseSubcategory,
  addSubcategoryToCategory,
  removeSubcategoryFromCategory,
  findSubcategory,
  createCategoryReference,
  validateSubcategoryBelongsToCategory,
  getActiveCategories,
  DEFAULT_EXPENSE_CATEGORIES,
} from "./category";
