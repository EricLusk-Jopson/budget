import { z } from "zod";
import { ValidationErrorCodes } from "../constants/validation-errors";

/**
 * Individual pool allocation within any transaction or distribution
 */
export const PoolAllocationItemSchema = z.object({
  poolId: z.string().min(1, "Pool ID is required"),
  amount: z.number(), // Can be negative for outflows
});

export type PoolAllocationItem = z.infer<typeof PoolAllocationItemSchema>;

/**
 * Complete allocation breakdown used across all transaction types
 */
export const AllocationBreakdownSchema = z
  .object({
    items: z
      .array(PoolAllocationItemSchema)
      .min(1, ValidationErrorCodes.ALLOCATION_EMPTY),
    totalAmount: z.number(),
  })
  .refine(
    (data) => {
      // All allocation items must sum to total amount (with small tolerance for floating point)
      const calculatedTotal = data.items.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      return Math.abs(calculatedTotal - data.totalAmount) < 0.01;
    },
    {
      message: ValidationErrorCodes.TRANSACTION_ALLOCATION_MISMATCH,
      path: ["items"],
    }
  )
  .refine(
    (data) => {
      // No duplicate pool IDs within the same allocation
      const poolIds = data.items.map((item) => item.poolId);
      const uniquePoolIds = new Set(poolIds);
      return poolIds.length === uniquePoolIds.size;
    },
    {
      message: ValidationErrorCodes.ALLOCATION_DUPLICATE_POOL,
      path: ["items"],
    }
  );

export type AllocationBreakdown = z.infer<typeof AllocationBreakdownSchema>;

/**
 * Allocation breakdown creation input
 */
export const CreateAllocationBreakdownSchema = z.object({
  items: z
    .array(PoolAllocationItemSchema)
    .min(1, ValidationErrorCodes.ALLOCATION_EMPTY),
  totalAmount: z.number(),
});

export type CreateAllocationBreakdown = z.infer<
  typeof CreateAllocationBreakdownSchema
>;

/**
 * Pre-filled allocation suggestion (used for defaults from allocation strategy)
 */
export const AllocationSuggestionSchema = z.object({
  poolId: z.string(),
  poolName: z.string(),
  suggestedAmount: z.number(),
  proportion: z.number(), // 0-1, for reference
  isUserModified: z.boolean().default(false), // Track if user changed from suggestion
});

export type AllocationSuggestion = z.infer<typeof AllocationSuggestionSchema>;

/**
 * Allocation breakdown with suggestions (for UI purposes)
 */
export const AllocationBreakdownWithSuggestionsSchema = z.object({
  breakdown: AllocationBreakdownSchema,
  suggestions: z.array(AllocationSuggestionSchema),
  strategyName: z.string().optional(), // Name of strategy used for suggestions
});

export type AllocationBreakdownWithSuggestions = z.infer<
  typeof AllocationBreakdownWithSuggestionsSchema
>;

/**
 * Validation functions
 */
export const validateAllocationBreakdown = (
  data: unknown
): AllocationBreakdown => {
  return AllocationBreakdownSchema.parse(data);
};

export const validateCreateAllocationBreakdown = (
  data: unknown
): CreateAllocationBreakdown => {
  return CreateAllocationBreakdownSchema.parse(data);
};

/**
 * Helper function to create allocation breakdown from items
 */
export const createAllocationBreakdown = (
  items: PoolAllocationItem[]
): AllocationBreakdown => {
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  return {
    items,
    totalAmount,
  };
};

/**
 * Helper function to create single-pool allocation (default for expenses)
 */
export const createSinglePoolAllocation = (
  poolId: string,
  amount: number
): AllocationBreakdown => {
  return {
    items: [{ poolId, amount }],
    totalAmount: amount,
  };
};

/**
 * Helper function to create allocation from allocation strategy
 */
export const createAllocationFromStrategy = (
  strategyAllocations: Array<{ poolId: string; proportion: number }>,
  totalAmount: number
): AllocationBreakdown => {
  const items = strategyAllocations.map((allocation) => ({
    poolId: allocation.poolId,
    amount: totalAmount * allocation.proportion,
  }));

  return {
    items,
    totalAmount,
  };
};

/**
 * Helper function to create suggestions from allocation strategy
 */
export const createAllocationSuggestions = (
  strategyAllocations: Array<{
    poolId: string;
    proportion: number;
    poolName: string;
  }>,
  totalAmount: number
): AllocationSuggestion[] => {
  return strategyAllocations.map((allocation) => ({
    poolId: allocation.poolId,
    poolName: allocation.poolName,
    suggestedAmount: totalAmount * allocation.proportion,
    proportion: allocation.proportion,
    isUserModified: false,
  }));
};

/**
 * Helper function to validate that allocations don't exceed available balances
 * (Used for credit payments and transfers)
 */
export const validateAllocationAgainstBalances = (
  allocation: AllocationBreakdown,
  availableBalances: Array<{ poolId: string; availableAmount: number }>
): {
  isValid: boolean;
  errors: Array<{ poolId: string; requested: number; available: number }>;
} => {
  const errors: Array<{
    poolId: string;
    requested: number;
    available: number;
  }> = [];

  allocation.items.forEach((item) => {
    const available = availableBalances.find((b) => b.poolId === item.poolId);
    if (!available || Math.abs(item.amount) > available.availableAmount) {
      errors.push({
        poolId: item.poolId,
        requested: Math.abs(item.amount),
        available: available?.availableAmount || 0,
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Helper function to calculate maximum payable amount for credit payments
 */
export const calculateMaximumPayableAmount = (
  sourceBalances: Array<{ poolId: string; availableAmount: number }>,
  destinationDebts: Array<{ poolId: string; debtAmount: number }>
): {
  maxAmount: number;
  breakdown: Array<{ poolId: string; payableAmount: number }>;
} => {
  let maxAmount = 0;
  const breakdown: Array<{ poolId: string; payableAmount: number }> = [];

  sourceBalances.forEach((source) => {
    const matchingDebt = destinationDebts.find(
      (debt) => debt.poolId === source.poolId
    );
    if (matchingDebt) {
      const payableAmount = Math.min(
        source.availableAmount,
        matchingDebt.debtAmount
      );
      maxAmount += payableAmount;
      breakdown.push({
        poolId: source.poolId,
        payableAmount,
      });
    }
  });

  return { maxAmount, breakdown };
};

/**
 * Helper function to auto-distribute amount across pools proportionally
 */
export const createProportionalAllocation = (
  targetPools: Array<{ poolId: string; targetAmount: number }>,
  actualAmount: number
): AllocationBreakdown => {
  const totalTarget = targetPools.reduce(
    (sum, pool) => sum + pool.targetAmount,
    0
  );

  if (totalTarget === 0) {
    throw new Error(
      "Cannot create proportional allocation with zero total target"
    );
  }

  const items = targetPools.map((pool) => ({
    poolId: pool.poolId,
    amount: (pool.targetAmount / totalTarget) * actualAmount,
  }));

  return {
    items,
    totalAmount: actualAmount,
  };
};

/**
 * Helper function to normalize allocation amounts (ensure they sum exactly to total)
 */
export const normalizeAllocationBreakdown = (
  allocation: AllocationBreakdown
): AllocationBreakdown => {
  const calculatedTotal = allocation.items.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  if (calculatedTotal === 0) {
    throw new Error("Cannot normalize allocation with zero total");
  }

  const adjustmentFactor = allocation.totalAmount / calculatedTotal;

  const normalizedItems = allocation.items.map((item) => ({
    ...item,
    amount: item.amount * adjustmentFactor,
  }));

  return {
    items: normalizedItems,
    totalAmount: allocation.totalAmount,
  };
};
