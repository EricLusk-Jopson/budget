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
