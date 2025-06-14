import { z } from "zod";

/**
 * Individual pool allocation within a strategy
 */
export const PoolAllocationSchema = z.object({
  poolId: z.string().min(1, "Pool ID is required"),
  proportion: z
    .number()
    .min(0, "Proportion cannot be negative")
    .max(1, "Proportion cannot exceed 1.0"),
});

export type PoolAllocation = z.infer<typeof PoolAllocationSchema>;

/**
 * Core allocation strategy definition
 */
export const AllocationStrategySchema = z
  .object({
    id: z.string().min(1, "Allocation strategy ID is required"),
    budgetId: z.string().min(1, "Budget ID is required"),
    name: z.string().min(1, "Strategy name is required").max(100),
    description: z.string().max(500).optional(),

    // When this strategy becomes effective
    effectiveFrom: z.date(),

    // Array of pool allocations
    allocations: z
      .array(PoolAllocationSchema)
      .min(1, "At least one allocation is required"),

    // Status and metadata
    isActive: z.boolean().default(true),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .refine(
    (data) => {
      // Ensure all proportions sum to 1.0 (with small tolerance for floating point precision)
      const total = data.allocations.reduce(
        (sum, allocation) => sum + allocation.proportion,
        0
      );
      return Math.abs(total - 1.0) < 0.001;
    },
    {
      message: "All proportions must sum to 1.0 (100%)",
      path: ["allocations"],
    }
  )
  .refine(
    (data) => {
      // Ensure no duplicate pool IDs
      const poolIds = data.allocations.map((a) => a.poolId);
      const uniquePoolIds = new Set(poolIds);
      return poolIds.length === uniquePoolIds.size;
    },
    {
      message: "Each pool can only appear once in an allocation strategy",
      path: ["allocations"],
    }
  );

export type AllocationStrategy = z.infer<typeof AllocationStrategySchema>;

/**
 * Allocation strategy creation input
 */
export const CreateAllocationStrategySchema = z
  .object({
    budgetId: z.string().min(1, "Budget ID is required"),
    name: z.string().min(1, "Strategy name is required").max(100),
    description: z.string().max(500).optional(),
    effectiveFrom: z.date(),
    allocations: z
      .array(PoolAllocationSchema)
      .min(1, "At least one allocation is required"),
    isActive: z.boolean().default(true),
  })
  .refine(
    (data) => {
      // Ensure all proportions sum to 1.0 (with small tolerance for floating point precision)
      const total = data.allocations.reduce(
        (sum, allocation) => sum + allocation.proportion,
        0
      );
      return Math.abs(total - 1.0) < 0.001;
    },
    {
      message: "All proportions must sum to 1.0 (100%)",
      path: ["allocations"],
    }
  )
  .refine(
    (data) => {
      // Ensure no duplicate pool IDs
      const poolIds = data.allocations.map((a) => a.poolId);
      const uniquePoolIds = new Set(poolIds);
      return poolIds.length === uniquePoolIds.size;
    },
    {
      message: "Each pool can only appear once in an allocation strategy",
      path: ["allocations"],
    }
  );

export type CreateAllocationStrategy = z.infer<
  typeof CreateAllocationStrategySchema
>;

/**
 * Allocation strategy update input
 */
export const UpdateAllocationStrategySchema = z.object({
  name: z.string().min(1, "Strategy name is required").max(100).optional(),
  description: z.string().max(500).optional(),
  effectiveFrom: z.date().optional(),
  allocations: z
    .array(PoolAllocationSchema)
    .min(1, "At least one allocation is required")
    .optional(),
  isActive: z.boolean().optional(),
  updatedAt: z.date(),
});

export type UpdateAllocationStrategy = z.infer<
  typeof UpdateAllocationStrategySchema
>;

/**
 * Allocation deviation tracking (when users spend outside their strategy)
 */
export const AllocationDeviationSchema = z.object({
  id: z.string().min(1, "Deviation ID is required"),
  budgetId: z.string().min(1, "Budget ID is required"),
  allocationStrategyId: z.string().min(1, "Strategy ID is required"),
  poolId: z.string().min(1, "Pool ID is required"),

  // The amount deviated (positive for overspending, negative for underspending)
  deviationAmount: z.number(),

  // Whether user acknowledged this as a formal "debt" to themselves
  acknowledgedAsDebt: z.boolean().default(false),

  // Optional reason for deviation
  reason: z.string().max(200).optional(),

  // When the deviation occurred
  deviationDate: z.date(),
  createdAt: z.date(),
});

export type AllocationDeviation = z.infer<typeof AllocationDeviationSchema>;

/**
 * Validation functions
 */
export const validateAllocationStrategy = (
  data: unknown
): AllocationStrategy => {
  return AllocationStrategySchema.parse(data);
};

export const validateCreateAllocationStrategy = (
  data: unknown
): CreateAllocationStrategy => {
  return CreateAllocationStrategySchema.parse(data);
};

export const validateUpdateAllocationStrategy = (
  data: unknown
): UpdateAllocationStrategy => {
  return UpdateAllocationStrategySchema.parse(data);
};

/**
 * Helper function to create a new allocation strategy with defaults
 */
export const createAllocationStrategy = (
  input: CreateAllocationStrategy
): Omit<AllocationStrategy, "id"> => {
  const now = new Date();

  return {
    ...input,
    createdAt: now,
    updatedAt: now,
  };
};

/**
 * Helper function to validate allocation proportions sum to 1.0
 */
export const validateAllocationsSum = (
  allocations: PoolAllocation[]
): boolean => {
  const total = allocations.reduce(
    (sum, allocation) => sum + allocation.proportion,
    0
  );
  return Math.abs(total - 1.0) < 0.001;
};

/**
 * Helper function to calculate allocation amount for a specific pool
 */
export const calculateAllocationAmount = (
  strategy: AllocationStrategy,
  poolId: string,
  totalIncome: number
): number => {
  const allocation = strategy.allocations.find((a) => a.poolId === poolId);
  if (!allocation) {
    return 0;
  }

  return totalIncome * allocation.proportion;
};

/**
 * Helper function to get allocation proportion for a specific pool
 */
export const getAllocationProportion = (
  strategy: AllocationStrategy,
  poolId: string
): number => {
  const allocation = strategy.allocations.find((a) => a.poolId === poolId);
  return allocation?.proportion ?? 0;
};

/**
 * Helper function to distribute income according to strategy
 */
export const distributeIncome = (
  strategy: AllocationStrategy,
  totalIncome: number
): Record<string, number> => {
  const distribution: Record<string, number> = {};

  strategy.allocations.forEach((allocation) => {
    distribution[allocation.poolId] = totalIncome * allocation.proportion;
  });

  return distribution;
};

/**
 * Helper function to calculate percentage for display
 */
export const proportionToPercentage = (proportion: number): number => {
  return Math.round(proportion * 100);
};

/**
 * Helper function to convert percentage to proportion
 */
export const percentageToProportion = (percentage: number): number => {
  return percentage / 100;
};

/**
 * Helper function to create balanced allocations from percentages
 */
export const createAllocationsFromPercentages = (
  poolPercentages: Record<string, number>
): PoolAllocation[] => {
  const totalPercentage = Object.values(poolPercentages).reduce(
    (sum, pct) => sum + pct,
    0
  );

  if (Math.abs(totalPercentage - 100) > 0.1) {
    throw new Error(`Percentages must sum to 100%, got ${totalPercentage}%`);
  }

  return Object.entries(poolPercentages).map(([poolId, percentage]) => ({
    poolId,
    proportion: percentageToProportion(percentage),
  }));
};

/**
 * Helper function to normalize allocations to sum to 1.0
 */
export const normalizeAllocations = (
  allocations: PoolAllocation[]
): PoolAllocation[] => {
  const total = allocations.reduce(
    (sum, allocation) => sum + allocation.proportion,
    0
  );

  if (total === 0) {
    throw new Error("Cannot normalize allocations with zero total");
  }

  return allocations.map((allocation) => ({
    ...allocation,
    proportion: allocation.proportion / total,
  }));
};

/**
 * Common allocation strategy templates
 */
export const ALLOCATION_TEMPLATES = {
  balanced: {
    name: "50/30/20 Balanced Strategy",
    description: "50% needs, 30% wants, 20% savings and goals",
  },
  aggressive_savings: {
    name: "Aggressive Savings Strategy",
    description: "60% needs, 20% wants, 20% savings and goals",
  },
  debt_payoff: {
    name: "Debt Payoff Strategy",
    description:
      "Focused on debt elimination with minimal discretionary spending",
  },
  student_budget: {
    name: "Student Budget",
    description: "Budget optimized for student lifestyle and limited income",
  },
} as const;
