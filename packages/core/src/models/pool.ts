import { z } from "zod";
import { ValidationErrorCodes } from "../constants/validation-errors";

/**
 * Pool purpose types that determine behavior
 */
export const PoolPurposeTypeSchema = z.enum([
  "spending", // For immediate consumption (groceries, entertainment)
  "saving", // For accumulation without specific goal (emergency fund)
  "goal", // For specific targets with amount/date (vacation, car)
]);

export type PoolPurposeType = z.infer<typeof PoolPurposeTypeSchema>;

/**
 * Pool color options for UI categorization
 */
export const PoolColorSchema = z.enum([
  "blue",
  "green",
  "orange",
  "red",
  "purple",
  "pink",
  "teal",
  "indigo",
  "yellow",
  "gray",
]);

export type PoolColor = z.infer<typeof PoolColorSchema>;

/**
 * Pool icon options for visual identification
 */
export const PoolIconSchema = z.enum([
  "home",
  "car",
  "food",
  "entertainment",
  "health",
  "education",
  "travel",
  "shopping",
  "bills",
  "savings",
  "investment",
  "gift",
  "emergency",
  "goal",
  "other",
]);

export type PoolIcon = z.infer<typeof PoolIconSchema>;

/**
 * Core pool definition
 */
export const PoolSchema = z.object({
  id: z.string().min(1, ValidationErrorCodes.POOL_ID_REQUIRED),
  budgetId: z.string().min(1, ValidationErrorCodes.BUDGET_ID_REQUIRED),
  name: z
    .string()
    .min(1, ValidationErrorCodes.POOL_NAME_REQUIRED)
    .max(50, ValidationErrorCodes.FIELD_TOO_LONG),
  description: z
    .string()
    .max(200, ValidationErrorCodes.FIELD_TOO_LONG)
    .optional(),
  icon: PoolIconSchema.default("other"),
  color: PoolColorSchema.default("blue"),
  purposeType: PoolPurposeTypeSchema,

  // Goal-specific fields (only relevant for 'goal' purpose type)
  targetAmount: z
    .number()
    .positive(ValidationErrorCodes.FIELD_POSITIVE_NUMBER_REQUIRED)
    .optional(),
  targetDate: z.date().optional(),

  // Status and metadata
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Pool = z.infer<typeof PoolSchema>;

/**
 * Pool creation input
 */
export const CreatePoolSchema = z
  .object({
    budgetId: z.string().min(1, ValidationErrorCodes.BUDGET_ID_REQUIRED),
    name: z
      .string()
      .min(1, ValidationErrorCodes.POOL_NAME_REQUIRED)
      .max(50, ValidationErrorCodes.FIELD_TOO_LONG),
    description: z
      .string()
      .max(200, ValidationErrorCodes.FIELD_TOO_LONG)
      .optional(),
    icon: PoolIconSchema.default("other"),
    color: PoolColorSchema.default("blue"),
    purposeType: PoolPurposeTypeSchema,
    targetAmount: z
      .number()
      .positive(ValidationErrorCodes.FIELD_POSITIVE_NUMBER_REQUIRED)
      .optional(),
    targetDate: z.date().optional(),
    isActive: z.boolean().default(true),
  })
  .refine(
    (data) => {
      // For goal pools, either targetAmount or targetDate should be provided
      if (data.purposeType === "goal") {
        return data.targetAmount !== undefined || data.targetDate !== undefined;
      }
      return true;
    },
    {
      message: ValidationErrorCodes.GOAL_REQUIRES_TARGET,
      path: ["targetAmount"],
    }
  );

export type CreatePool = z.infer<typeof CreatePoolSchema>;

/**
 * Pool update input
 */
export const UpdatePoolSchema = z
  .object({
    name: z
      .string()
      .min(1, ValidationErrorCodes.POOL_NAME_REQUIRED)
      .max(50, ValidationErrorCodes.FIELD_TOO_LONG)
      .optional(),
    description: z
      .string()
      .max(200, ValidationErrorCodes.FIELD_TOO_LONG)
      .optional(),
    icon: PoolIconSchema.optional(),
    color: PoolColorSchema.optional(),
    purposeType: PoolPurposeTypeSchema.optional(),
    targetAmount: z
      .number()
      .positive(ValidationErrorCodes.FIELD_POSITIVE_NUMBER_REQUIRED)
      .optional(),
    targetDate: z.date().optional(),
    isActive: z.boolean().optional(),
    updatedAt: z.date(),
  })
  .refine(
    (data) => {
      // If purpose type is being changed to goal, validate goal fields
      if (data.purposeType === "goal") {
        return data.targetAmount !== undefined || data.targetDate !== undefined;
      }
      return true;
    },
    {
      message: ValidationErrorCodes.GOAL_REQUIRES_TARGET,
      path: ["targetAmount"],
    }
  );

export type UpdatePool = z.infer<typeof UpdatePoolSchema>;

/**
 * Pool with balance information (for display purposes)
 */
export const PoolWithBalanceSchema = z.object({
  id: z.string().min(1, ValidationErrorCodes.POOL_ID_REQUIRED),
  budgetId: z.string().min(1, ValidationErrorCodes.BUDGET_ID_REQUIRED),
  name: z
    .string()
    .min(1, ValidationErrorCodes.POOL_NAME_REQUIRED)
    .max(50, ValidationErrorCodes.FIELD_TOO_LONG),
  description: z
    .string()
    .max(200, ValidationErrorCodes.FIELD_TOO_LONG)
    .optional(),
  icon: PoolIconSchema.default("other"),
  color: PoolColorSchema.default("blue"),
  purposeType: PoolPurposeTypeSchema,
  targetAmount: z
    .number()
    .positive(ValidationErrorCodes.FIELD_POSITIVE_NUMBER_REQUIRED)
    .optional(),
  targetDate: z.date().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
  currentBalance: z.number(),
  lastBalanceUpdate: z.date(),
});

export type PoolWithBalance = z.infer<typeof PoolWithBalanceSchema>;

/**
 * Validation functions
 */
export const validatePool = (data: unknown): Pool => {
  return PoolSchema.parse(data);
};

export const validateCreatePool = (data: unknown): CreatePool => {
  return CreatePoolSchema.parse(data);
};

export const validateUpdatePool = (data: unknown): UpdatePool => {
  return UpdatePoolSchema.parse(data);
};

/**
 * Helper function to create a new pool with defaults
 */
export const createPool = (input: CreatePool): Omit<Pool, "id"> => {
  const now = new Date();

  return {
    ...input,
    createdAt: now,
    updatedAt: now,
  };
};

/**
 * Helper function to check if a pool is a goal pool
 */
export const isGoalPool = (pool: Pool): boolean => {
  return pool.purposeType === "goal";
};

/**
 * Helper function to calculate goal progress (0-1)
 */
export const calculateGoalProgress = (
  pool: Pool,
  currentBalance: number
): number | null => {
  if (!isGoalPool(pool) || !pool.targetAmount) {
    return null;
  }

  return Math.min(currentBalance / pool.targetAmount, 1);
};

/**
 * Helper function to check if goal is complete
 */
export const isGoalComplete = (pool: Pool, currentBalance: number): boolean => {
  const progress = calculateGoalProgress(pool, currentBalance);
  return progress !== null && progress >= 1;
};

/**
 * Common pool templates for quick setup
 */
export const POOL_TEMPLATES: Record<
  string,
  Partial<CreatePool> & { name: string }
> = {
  emergency: {
    name: "Emergency Fund",
    description: "Emergency fund for unexpected expenses",
    icon: "emergency",
    color: "red",
    purposeType: "saving",
    isActive: true,
  },
  groceries: {
    name: "Groceries",
    description: "Food and household essentials",
    icon: "food",
    color: "green",
    purposeType: "spending",
    isActive: true,
  },
  entertainment: {
    name: "Entertainment",
    description: "Movies, dining out, and fun activities",
    icon: "entertainment",
    color: "purple",
    purposeType: "spending",
    isActive: true,
  },
  travel: {
    name: "Travel Fund",
    description: "Vacation and travel expenses",
    icon: "travel",
    color: "blue",
    purposeType: "goal",
    isActive: true,
  },
  housing: {
    name: "Housing",
    description: "Rent, mortgage, and home expenses",
    icon: "home",
    color: "orange",
    purposeType: "spending",
    isActive: true,
  },
  transportation: {
    name: "Transportation",
    description: "Car payment, gas, and transit",
    icon: "car",
    color: "gray",
    purposeType: "spending",
    isActive: true,
  },
};
