import { z } from "zod";
import { ValidationErrorCodes } from "../constants/validation-errors";

export const BudgetSchema = z.object({
  id: z.string().min(1, ValidationErrorCodes.BUDGET_ID_REQUIRED),
  name: z
    .string()
    .min(1, ValidationErrorCodes.BUDGET_NAME_REQUIRED)
    .max(100, ValidationErrorCodes.FIELD_TOO_LONG),
  description: z
    .string()
    .max(500, ValidationErrorCodes.FIELD_TOO_LONG)
    .optional(),
  currency: z
    .string()
    .length(3, ValidationErrorCodes.FIELD_INVALID_CURRENCY)
    .default("USD"),
  ownerId: z.string().min(1, ValidationErrorCodes.OWNER_ID_REQUIRED),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Budget = z.infer<typeof BudgetSchema>;

export const SharedUserSchema = z.object({
  userId: z.string().min(1, ValidationErrorCodes.USER_ID_REQUIRED),
  role: z.enum(["viewer", "editor", "admin"]),
  addedAt: z.date(),
  addedBy: z.string().min(1, ValidationErrorCodes.USER_ID_REQUIRED),
});

export type SharedUser = z.infer<typeof SharedUserSchema>;

export const CreateBudgetSchema = z.object({
  name: z
    .string()
    .min(1, ValidationErrorCodes.BUDGET_NAME_REQUIRED)
    .max(100, ValidationErrorCodes.FIELD_TOO_LONG),
  description: z
    .string()
    .max(500, ValidationErrorCodes.FIELD_TOO_LONG)
    .optional(),
  currency: z
    .string()
    .length(3, ValidationErrorCodes.FIELD_INVALID_CURRENCY)
    .default("USD"),
  ownerId: z.string().min(1, ValidationErrorCodes.OWNER_ID_REQUIRED),
});

export type CreateBudget = z.infer<typeof CreateBudgetSchema>;

// Add missing UpdateBudget schema and type
export const UpdateBudgetSchema = z.object({
  name: z
    .string()
    .min(1, ValidationErrorCodes.BUDGET_NAME_REQUIRED)
    .max(100, ValidationErrorCodes.FIELD_TOO_LONG)
    .optional(),
  description: z
    .string()
    .max(500, ValidationErrorCodes.FIELD_TOO_LONG)
    .optional(),
  currency: z
    .string()
    .length(3, ValidationErrorCodes.FIELD_INVALID_CURRENCY)
    .optional(),
});

export type UpdateBudget = z.infer<typeof UpdateBudgetSchema>;

// Validation functions
export function validateBudget(data: unknown): Budget {
  return BudgetSchema.parse(data);
}

export function validateCreateBudget(data: unknown): CreateBudget {
  return CreateBudgetSchema.parse(data);
}

export function validateUpdateBudget(data: unknown): UpdateBudget {
  return UpdateBudgetSchema.parse(data);
}

// Helper functions
export function createBudget(
  data: CreateBudget
): Omit<Budget, "id" | "createdAt" | "updatedAt"> {
  return {
    name: data.name,
    description: data.description,
    currency: data.currency || "USD",
    ownerId: data.ownerId,
    isActive: true,
  };
}
