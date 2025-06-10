import { z } from "zod";

export const BudgetSchema = z.object({
  id: z.string().min(1, "Budget ID is required"),
  name: z.string().min(1, "Budget name is required").max(100),
  description: z.string().max(500).optional(),
  currency: z
    .string()
    .length(3, "Currency must be 3-letter ISO code")
    .default("USD"),
  ownerId: z.string().min(1, "Owner ID is required"),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Budget = z.infer<typeof BudgetSchema>;

export const SharedUserSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  role: z.enum(["viewer", "editor", "admin"]),
  addedAt: z.date(),
  addedBy: z.string().min(1, "Added by user ID is required"),
});

export type SharedUser = z.infer<typeof SharedUserSchema>;

export const CreateBudgetSchema = z.object({
  name: z.string().min(1, "Budget name is required").max(100),
  description: z.string().max(500).optional(),
  currency: z.string().length(3).default("USD"),
  ownerId: z.string().min(1, "Owner ID is required"),
});

export type CreateBudget = z.infer<typeof CreateBudgetSchema>;
